import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Helper to get user session
export const getUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// Helper to get user profile with role
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
  
  return data;
};

// Helper to get user's role
export const getUserRole = async (userId: string): Promise<string | null> => {
  const profile = await getUserProfile(userId);
  return profile?.role || null;
};

// Helper to check if user has required role
export const hasRole = async (userId: string, requiredRole: string): Promise<boolean> => {
  const role = await getUserRole(userId);
  return role === requiredRole || role === 'admin';
};
