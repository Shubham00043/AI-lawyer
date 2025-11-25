import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';

export interface UploadedFile {
  filePath: string;
  fileUrl: string;
}

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Extract text from PDF file
export const extractTextFromPdf = async (file: File): Promise<string> => {
  const pdfjs = await import('pdf-parse/lib/pdf-parse.js');
  const arrayBuffer = await file.arrayBuffer();
  const typedArray = new Uint8Array(arrayBuffer);
  const data = await pdfjs(typedArray);
  return data.text;
};

// Generate embeddings using OpenAI
export const generateEmbedding = async (text: string): Promise<number[] | null> => {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text,
    });
    
    return response.data[0]?.embedding || null;
  } catch (error) {
    console.error('Error generating embedding:', error);
    return null;
  }
};

// Upload file to Supabase Storage
export const uploadFile = async (file: File, bucket: string, path: string) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${path}/${uuidv4()}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw error;
  }

  return data;
};

// Process and store document in database
export const processAndStoreDocument = async (
  file: File, 
  caseId: string, 
  userId: string
) => {
  try {
    // 1. Extract text from PDF
    const text = await extractTextFromPdf(file);
    
    // 2. Generate summary using OpenAI (first 2000 chars for efficiency)
    const summaryResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a legal document analysis assistant. Provide a concise summary of the legal document, highlighting key points, parties involved, and legal principles.',
        },
        {
          role: 'user',
          content: `Summarize this legal document in 3-5 bullet points:\n\n${text.substring(0, 2000)}`,
        },
      ],
      temperature: 0.3,
    });
    
    const summary = summaryResponse.choices[0]?.message?.content || '';
    
    // 3. Generate embeddings for semantic search
    const embedding = await generateEmbedding(text.substring(0, 8000)); // Limit to first 8000 chars for efficiency
    
    if (!embedding) {
      throw new Error('Failed to generate embedding for the document');
    }
    
    // 4. Upload file to storage
    const { path: filePath } = await uploadFile(file, 'documents', userId);
    
    // 5. Store document metadata in database
    const { data: document, error } = await supabase
      .from('documents')
      .insert([
        {
          case_id: caseId,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
          content_text: text,
          summary,
          embedding,
          created_by: userId,
          metadata: {
            pages: text.split('\f').length,
            words: text.split(/\s+/).length,
            characters: text.length,
          },
        },
      ])
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return document;
  } catch (error) {
    console.error('Error processing document:', error);
    throw error;
  }
};

// Find similar cases based on document content
export const findSimilarCases = async (
  documentId: string,
  threshold: number = 0.7,
  limit: number = 5
) => {
  try {
    // Get the embedding for the current document
    const { data: sourceDoc } = await supabase
      .from('documents')
      .select('embedding, case_id')
      .eq('id', documentId)
      .single();
    
    if (!sourceDoc?.embedding) {
      throw new Error('Document not found or has no embedding');
    }
    
    // Find similar documents using pgvector
    const { data: similarDocs, error } = await supabase
      .rpc('match_documents', {
        query_embedding: sourceDoc.embedding,
        match_threshold: threshold,
        match_count: limit,
      })
      .neq('id', documentId); // Exclude the current document
    
    if (error) {
      throw error;
    }
    
    return similarDocs;
  } catch (error) {
    console.error('Error finding similar cases:', error);
    throw error;
  }
};
