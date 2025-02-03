'use client';

import { Navigation } from '@/components/Navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { createBrowserClient } from '@supabase/ssr';
import { useEffect, useState } from 'react';
import { deleteMessage } from '../actions'; // Import the delete function
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/ui/table'; // Import ShadCN table components

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SecretPage2() {
  const [secretMessages, setSecretMessages] = useState<
    { id: string; message: string }[]
  >([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [messageToUpdate, setMessageToUpdate] = useState<{
    id: string;
    message: string;
  } | null>(null);
  const { toast } = useToast();

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

  const handleAddMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase
        .from('secret_messages')
        .insert({ user_id: user.id, message: newMessage });

      if (error) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to add secret message',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Secret message added',
        });
        setNewMessage('');
        fetchSecretMessages(); // Refresh the messages
      }
    }
  };

  const handleUpdateMessage = async (id: string) => {
    if (messageToUpdate) {
      const { error } = await supabase
        .from('secret_messages')
        .update({ message: messageToUpdate.message })
        .eq('id', id);

      if (error) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to update secret message',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Secret message updated',
        });
        setMessageToUpdate(null);
        fetchSecretMessages(); // Refresh the messages
      }
    }
  };

  const handleDeleteMessage = async (id: string) => {
    try {
      await deleteMessage(id);
      toast({
        title: 'Success',
        description: 'Secret message deleted',
      });
      fetchSecretMessages(); // Refresh the messages
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to delete secret message',
        variant: 'destructive',
      });
    }
  };

  return (
    <ProtectedRoute>
      <main>
        <Navigation />
        <div className="container mx-auto mt-8">
          <h1 className="text-3xl font-bold mb-4">Secret Page 2</h1>
          <form onSubmit={handleAddMessage} className="space-y-4 mb-4">
            <Input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Enter new secret message"
              required
            />
            <Button type="submit">Add Secret Message</Button>
          </form>
          <Table>
            <TableHeader className="font-bold">
              <TableRow>
                <TableCell className="w-[5%]">#</TableCell>
                <TableCell className="w-[80%]">Secret Message</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {secretMessages.map((msg, index) => (
                <TableRow key={msg.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    {messageToUpdate?.id === msg.id ? (
                      <Input
                        type="text"
                        value={messageToUpdate.message}
                        onChange={(e) =>
                          setMessageToUpdate({
                            id: msg.id,
                            message: e.target.value,
                          })
                        }
                      />
                    ) : (
                      msg.message
                    )}
                  </TableCell>
                  <TableCell className="flex gap-2">
                    {messageToUpdate?.id === msg.id ? (
                      <Button onClick={() => handleUpdateMessage(msg.id)}>
                        Update
                      </Button>
                    ) : (
                      <>
                        <Button
                          onClick={() =>
                            setMessageToUpdate({
                              id: msg.id,
                              message: msg.message,
                            })
                          }
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => handleDeleteMessage(msg.id)}
                          variant="destructive"
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>
    </ProtectedRoute>
  );
}
