'use client';

import { Navigation } from '@/components/Navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/ui/table';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SecretPage1() {
  const [secretMessages, setSecretMessages] = useState<
    { id: string; message: string }[]
  >([]);

  useEffect(() => {
    fetchSecretMessages();
  }, []);

  const fetchSecretMessages = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('secret_messages')
        .select('id, message')
        .eq('user_id', user.id);

      if (data) {
        setSecretMessages(data);
      }
    }
  };

  return (
    <ProtectedRoute>
      <main>
        <Navigation />
        <div className="container mx-auto mt-8">
          <h1 className="text-3xl font-bold mb-4">Secret Page 1</h1>
          <Table>
            <TableHeader className="font-bold">
              <TableRow>
                <TableCell className="w-[5%]">#</TableCell>
                <TableCell className="w-[80%]">Secret Message</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {secretMessages.map((msg, index) => (
                <TableRow key={msg.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{msg.message}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>
    </ProtectedRoute>
  );
}
