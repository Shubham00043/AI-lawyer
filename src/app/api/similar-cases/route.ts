import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { findSimilarCases } from '@/lib/document-utils';

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');
    const threshold = parseFloat(searchParams.get('threshold') || '0.7');
    const limit = parseInt(searchParams.get('limit') || '5');

    if (!documentId) {
      return NextResponse.json(
        { error: 'documentId is required' },
        { status: 400 }
      );
    }

    // Verify the user has access to the document
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('id, created_by')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    if (document.created_by !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Find similar cases
    const similarCases = await findSimilarCases(documentId, threshold, limit);
    
    return NextResponse.json(similarCases);
  } catch (error) {
    console.error('Error in GET /api/similar-cases:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Not authenticated') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      if (error.message === 'Document not found') {
        return NextResponse.json(
          { error: 'Document not found' },
          { status: 404 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to find similar cases' },
      { status: 500 }
    );
  }
}
