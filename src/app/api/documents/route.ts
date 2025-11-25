import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { extractTextFromPdf, uploadFileToStorage } from '@/lib/document-utils';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const formData = await request.formData();
    
    const file = formData.get('file') as File | null;
    const caseId = formData.get('caseId') as string | null;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Verify case exists and user has access if caseId is provided
    if (caseId) {
      const { data: caseData, error: caseError } = await supabase
        .from('cases')
        .select('id')
        .eq('id', caseId)
        .eq('created_by', user.id)
        .single();

      if (caseError || !caseData) {
        return NextResponse.json(
          { error: 'Case not found or access denied' },
          { status: 404 }
        );
      }
    }

    // Upload file to storage
    const { filePath, fileUrl } = await uploadFileToStorage(file, user.id);
    
    // Extract text from PDF
    const contentText = await extractTextFromPdf(file);
    
    // Generate a summary using OpenAI (simplified for brevity)
    const summary = await generateDocumentSummary(contentText);
    
    // Save document metadata to database
    const { data: document, error } = await supabase
      .from('documents')
      .insert([
        {
          case_id: caseId,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
          content_text: contentText,
          summary: summary,
          created_by: user.id,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error saving document:', error);
      return NextResponse.json(
        { error: 'Failed to save document' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ...document,
      fileUrl,
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/documents:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function generateDocumentSummary(text: string): Promise<string> {
  // In a real implementation, you would call the OpenAI API here
  // to generate a summary of the document
  return text.slice(0, 200) + (text.length > 200 ? '...' : '');
}

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get('caseId');
    
    let query = supabase
      .from('documents')
      .select('*')
      .eq('created_by', user.id);
    
    if (caseId) {
      query = query.eq('case_id', caseId);
    }
    
    const { data: documents, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching documents:', error);
      return NextResponse.json(
        { error: 'Failed to fetch documents' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(documents || []);
  } catch (error) {
    console.error('Error in GET /api/documents:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
