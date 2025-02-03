'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { setCookie } from 'cookies-next';

import { createClient } from '@/utils/supabase/server';

export async function login(formData: FormData) {
  const supabase = await createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const { data: authData, error } =
    await supabase.auth.signInWithPassword(data);

  if (error) {
    redirect('/error');
  }

  // Access the user from authData
  const user = authData.user;

  // Set session cookie
  setCookie('session', user?.id, { maxAge: 60 * 60 * 24 }); // 1 day
  revalidatePath('/secret-page-1', 'layout');
  redirect('/secret-page-1');
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  // Extract user inputs
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const firstName = formData.get('first_name') as string;
  const lastName = formData.get('last_name') as string;

  // Step 1: Sign up user
  const { data: authUser, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError || !authUser.user) {
    redirect('/error');
  }

  // Set session cookie
  setCookie('session', authUser.user.id, { maxAge: 60 * 60 * 24 }); // 1 day

  // Step 2: Insert user profile into the "profiles" table
  const { error: profileError } = await supabase.from('profiles').insert([
    {
      id: authUser.user.id, // Use auth user ID
      first_name: firstName,
      last_name: lastName,
    },
  ]);

  if (profileError) {
    console.error('Profile Insert Error:', profileError.message);
    redirect('/error');
  }

  // Revalidate cache and redirect upon success
  revalidatePath('/success', 'layout');
  redirect('/success');
}

export const deleteMessage = async (messageId: string) => {
  const supabase = await createClient();
  const { error } = await supabase
    .from('secret_messages')
    .delete()
    .eq('id', messageId);

  if (error) {
    throw new Error('Failed to delete secret message');
  }
};
