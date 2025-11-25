import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const documentId = params.id;

    // Get document metadata
    const { data: document, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (error || !document) {
      console.error('Document not found:', error);
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Verify user has access to this document
    if (document.created_by !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get the file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(document.file_path);

    if (downloadError || !fileData) {
      console.error('Error downloading file:', downloadError);
      return NextResponse.json(
        { error: 'Failed to download file' },
        { status: 500 }
      );
    }

    // Create a response with the file
    const fileBuffer = await fileData.arrayBuffer();
    const response = new Response(fileBuffer, {
      headers: {
        'Content-Type': document.file_type,
        'Content-Disposition': `attachment; filename="${document.file_name}"`,
        'Content-Length': fileBuffer.byteLength.toString(),
      },
    });

    return response;
  } catch (error) {
    console.error('Error in GET /api/documents/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const documentId = params.id;

    // Get document to verify ownership
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('file_path, created_by')
      .eq('id', documentId)
      .single();

    if (fetchError || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Verify user owns the document
    if (document.created_by !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Delete file from storage
    const { error: deleteError } = await supabase.storage
      .from('documents')
      .remove([document.file_path]);

    if (deleteError) {
      console.error('Error deleting file from storage:', deleteError);
      // Continue with database deletion even if storage deletion fails
    }

    // Delete document from database
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);

    if (error) {
      console.error('Error deleting document:', error);
      return NextResponse.json(
        { error: 'Failed to delete document' },
        { status: 500 }
      );
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error in DELETE /api/documents/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
