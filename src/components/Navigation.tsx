'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ProtectedRoute } from '@/components/ProtectedRoute';
// import { supabase } from '@/utils/supabase';
import { createBrowserClient } from '@supabase/ssr';
import { useEffect, useState } from 'react';
import { getCookie } from 'cookies-next'; // Import cookies-next for cookie management
import { User } from '@supabase/supabase-js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function Navigation() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const session = getCookie('session'); // Check for session cookie
      if (session) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleDeleteAccount = async () => {
    if (!user) {
      console.error('User is not logged in.');
      return;
    }

    const { error: deleteUserError } = await supabase.auth.admin.deleteUser(
      user.id
    );

    if (deleteUserError) {
      console.error('Error deleting user from Auth:', deleteUserError.message);
      return;
    }

    // Delete user record from 'users' table
    const { error: deleteDataError } = await supabase
      .from('users')
      .delete()
      .eq('id', user.id);

    if (deleteDataError) {
      console.error('Error deleting user data:', deleteDataError.message);
    }

    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <ProtectedRoute>
      <nav className="bg-gray-800 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="text-xl font-bold">
            Secret Page App
          </Link>
          {user ? (
            <div className="space-x-4">
              <Link href="/secret-page-1">
                <Button variant="ghost">Secret Page 1</Button>
              </Link>
              <Link href="/secret-page-2">
                <Button variant="ghost">Secret Page 2</Button>
              </Link>
              <Link href="/secret-page-3">
                <Button variant="ghost">Secret Page 3</Button>
              </Link>
              <Link href="/logout">
                <Button variant="ghost">Logout</Button>
              </Link>
              <Button onClick={handleLogout} variant="destructive">
                Logout
              </Button>
              <Button onClick={handleDeleteAccount} variant="destructive">
                Delete Account
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger>Open</DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirm Deletion</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete your account? This action
                      cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleDeleteAccount} variant="destructive">
                      Delete Account
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <div className="space-x-4">
              <Link href="/secret-page-1">
                <Button variant="ghost">Secret 1</Button>
              </Link>
              <Link href="/secret-page-2">
                <Button variant="ghost">Secret 2</Button>
              </Link>
              <Link href="/secret-page-3">
                <Button variant="ghost">Secret 3</Button>
              </Link>
              <Link href="/">
                <Button onClick={handleLogout} variant="ghost">
                  Logout
                </Button>
              </Link>
              {/* <Link href="/">
                <Button
                  onClick={handleDeleteAccount}
                  variant="ghost"
                  className="text-red-600"
                >
                  Delete Account
                </Button>
              </Link> */}
              {/* <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger>Open</DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirm Deletion</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete your account? This action
                      cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleDeleteAccount} variant="destructive">
                      Delete Account
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog> */}
            </div>
          )}
        </div>
      </nav>
    </ProtectedRoute>
  );
}
