import { currentUser } from '@clerk/nextjs/server';
import { supabase } from './supabase';
import { User } from '@clerk/nextjs/server';

interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  created_at: string;
  updated_at: string;
}

export async function getCurrentUser(): Promise<Profile | null> {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  // Get or create user in your database
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', clerkUser.id)
    .single();

  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }

  return user;
}

export async function requireAuth(): Promise<Profile> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Not authenticated');
  }
  return user;
}

export async function requireRole(role: string): Promise<Profile> {
  const user = await requireAuth();
  if (user.role !== role) {
    throw new Error('Unauthorized');
  }
  return user;
}
