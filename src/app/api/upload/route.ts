import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    // Check authentication
    const { userId } = getAuth(request as any);
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Check file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a PDF or DOCX file.' },
        { status: 400 }
      );
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('legal-documents')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading file to Supabase:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }

    // Get public URL of the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('legal-documents')
      .getPublicUrl(filePath);

    // TODO: Process the document with OCR and extract text
    // This is a placeholder for actual document processing
    const documentText = 'Extracted text from the document will appear here.';

    // Save document metadata to database
    const { data: document, error: dbError } = await supabase
      .from('documents')
      .insert([
        {
          user_id: userId,
          file_name: file.name,
          file_path: filePath,
          file_url: publicUrl,
          file_type: file.type,
          file_size: file.size,
          text_content: documentText,
          status: 'processed',
        },
      ])
      .select()
      .single();

    if (dbError) {
      console.error('Error saving document to database:', dbError);
      // Clean up the uploaded file if database operation fails
      await supabase.storage.from('legal-documents').remove([filePath]);
      
      return NextResponse.json(
        { error: 'Failed to save document' },
        { status: 500 }
      );
    }

    // TODO: Generate embeddings for the document
    // This would involve calling an AI service to generate embeddings
    // and store them in Supabase's vector store

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        name: document.file_name,
        url: document.file_url,
        text: document.text_content,
      },
    });
  } catch (error) {
    console.error('Error processing file upload:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
