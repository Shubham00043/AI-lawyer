import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: cases, error } = await supabase
      .from('cases')
      .select('*')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching cases:', error);
      return NextResponse.json(
        { error: 'Failed to fetch cases' },
        { status: 500 }
      );
    }

    return NextResponse.json(cases);
  } catch (error) {
    console.error('Error in GET /api/cases:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, description, caseNumber, courtName, judgeName, plaintiff, defendant, filingDate, status } = body;

    const { data: newCase, error } = await supabase
      .from('cases')
      .insert([
        {
          title,
          description,
          case_number: caseNumber,
          court_name: courtName,
          judge_name: judgeName,
          plaintiff,
          defendant,
          filing_date: filingDate,
          status: status || 'open',
          created_by: user.id,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating case:', error);
      return NextResponse.json(
        { error: 'Failed to create case' },
        { status: 500 }
      );
    }

    return NextResponse.json(newCase, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/cases:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
