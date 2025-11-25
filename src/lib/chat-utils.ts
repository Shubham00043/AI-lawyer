import { supabase } from './supabase';
import { openai } from './document-utils';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: Date;
  metadata?: Record<string, any>;
}

// Get chat history for a specific case
export const getChatHistory = async (caseId: string, limit: number = 50) => {
  const { data: messages, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('case_id', caseId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Error fetching chat history:', error);
    return [];
  }

  return messages.map(msg => ({
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
    createdAt: new Date(msg.created_at),
    metadata: msg.metadata || {},
  }));
};

// Send a message to the AI and get a response
export const sendAIMessage = async (
  caseId: string | null,
  userId: string,
  message: string,
  documentId?: string
): Promise<{ response: string; messageId: string }> => {
  try {
    // 1. Save user message to database
    const { data: userMessage, error: messageError } = await supabase
      .from('chat_messages')
      .insert([
        {
          case_id: caseId,
          document_id: documentId,
          user_id: userId,
          role: 'user',
          content: message,
        },
      ])
      .select()
      .single();

    if (messageError) throw messageError;

    // 2. Get chat history for context
    const chatHistory = caseId ? await getChatHistory(caseId) : [];
    
    // 3. Prepare messages for the AI
    const messages: Array<{
      role: 'system' | 'user' | 'assistant';
      content: string;
    }> = [
      {
        role: 'system',
        content: `You are an AI Legal Assistant. You help users with legal questions, document analysis, and case research. 
        Be concise, accurate, and cite relevant laws and precedents when possible. 
        If you don't know something, say so rather than making up information.`,
      },
      ...chatHistory.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user', content: message },
    ];

    // 4. Get AI response
    const completion = await openai.chat.completions.create({
      model: 'gpt-4', // or 'gpt-3.5-turbo' for faster, less expensive responses
      messages,
      temperature: 0.3,
      max_tokens: 1000,
    });

    const aiResponse = completion.choices[0]?.message?.content || 'I apologize, but I am unable to generate a response at this time.';

    // 5. Save AI response to database
    const { data: aiMessage, error: aiMessageError } = await supabase
      .from('chat_messages')
      .insert([
        {
          case_id: caseId,
          document_id: documentId,
          user_id: userId,
          role: 'assistant',
          content: aiResponse,
        },
      ])
      .select()
      .single();

    if (aiMessageError) throw aiMessageError;

    return {
      response: aiResponse,
      messageId: aiMessage.id,
    };
  } catch (error) {
    console.error('Error in sendAIMessage:', error);
    throw new Error('Failed to process your message. Please try again.');
  }
};

// Get relevant context from documents for a query
export const getRelevantContext = async (
  query: string,
  caseId?: string,
  limit: number = 3
) => {
  try {
    // Generate embedding for the query
    const embedding = await generateEmbedding(query);
    
    if (!embedding) {
      return [];
    }

    // Find similar documents
    const { data: similarDocs, error } = await supabase.rpc('match_documents', {
      query_embedding: embedding,
      match_threshold: 0.7,
      match_count: limit,
      ...(caseId && { case_id: caseId }),
    });

    if (error) throw error;
    return similarDocs || [];
  } catch (error) {
    console.error('Error getting relevant context:', error);
    return [];
  }
};

// Helper function to generate embedding (re-exported from document-utils)
export { generateEmbedding } from './document-utils';
