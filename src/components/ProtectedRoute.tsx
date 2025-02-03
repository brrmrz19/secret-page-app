'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
// import { supabase } from '@/utils/supabase';
import type React from 'react'; // Added import for React
// import { getCookie } from 'cookies-next'; // Import cookies-next for cookie management

import { createBrowserClient } from '@supabase/ssr';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession(); // Use supabase to get the session
      if (!session) {
        router.push('/');
      } else {
        setIsLoading(false);
      }
    };
    checkUser();
  }, [router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
}
