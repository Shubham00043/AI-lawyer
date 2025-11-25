import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { sendAIMessage } from '@/lib/chat-utils';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const { message, caseId, documentId } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Send the message to the AI and get a response
    const { response, messageId } = await sendAIMessage(
      caseId || null,
      user.id,
      message,
      documentId
    );

    return NextResponse.json({
      message: response,
      messageId,
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Not authenticated') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      if (error.message === 'Unauthorized') {
        return NextResponse.json(
          { error: 'You do not have permission to perform this action' },
          { status: 403 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to process your message' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get('caseId');
    
    if (!caseId) {
      return NextResponse.json(
        { error: 'caseId is required' },
        { status: 400 }
      );
    }

    // Get chat history for the case
    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('case_id', caseId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching chat history:', error);
      return NextResponse.json(
        { error: 'Failed to fetch chat history' },
        { status: 500 }
      );
    }

    return NextResponse.json(messages || []);
  } catch (error) {
    console.error('Error in GET /api/chat:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
