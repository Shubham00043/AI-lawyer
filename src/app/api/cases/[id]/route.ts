import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth();
    const caseId = params.id;

    const { data: caseData, error } = await supabase
      .from('cases')
      .select('*')
      .eq('id', caseId)
      .single();

    if (error) {
      console.error('Error fetching case:', error);
      return NextResponse.json(
        { error: 'Case not found' },
        { status: 404 }
      );
    }

    // Fetch related documents
    const { data: documents } = await supabase
      .from('documents')
      .select('*')
      .eq('case_id', caseId);

    return NextResponse.json({
      ...caseData,
      documents: documents || []
    });
  } catch (error) {
    console.error('Error in GET /api/cases/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const caseId = params.id;
    const body = await request.json();

    // Check if user owns the case
    const { data: existingCase, error: fetchError } = await supabase
      .from('cases')
      .select('created_by')
      .eq('id', caseId)
      .single();

    if (fetchError || existingCase.created_by !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { data: updatedCase, error } = await supabase
      .from('cases')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', caseId)
      .select()
      .single();

    if (error) {
      console.error('Error updating case:', error);
      return NextResponse.json(
        { error: 'Failed to update case' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedCase);
  } catch (error) {
    console.error('Error in PUT /api/cases/[id]:', error);
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
    const caseId = params.id;

    // Check if user owns the case
    const { data: existingCase, error: fetchError } = await supabase
      .from('cases')
      .select('created_by')
      .eq('id', caseId)
      .single();

    if (fetchError || existingCase.created_by !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Delete related documents first
    await supabase
      .from('documents')
      .delete()
      .eq('case_id', caseId);

    // Delete the case
    const { error } = await supabase
      .from('cases')
      .delete()
      .eq('id', caseId);

    if (error) {
      console.error('Error deleting case:', error);
      return NextResponse.json(
        { error: 'Failed to delete case' },
        { status: 500 }
      );
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error in DELETE /api/cases/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
