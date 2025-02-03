'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Navigation } from '@/components/Navigation';
import { useToast } from '@/hooks/use-toast';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Define the type for a friend
type Friend = {
  id: string;
  first_name: string;
  last_name: string;
  secrets?: { id: string; message: string }[]; // Include secrets if applicable
};

// Define the type for a friend request
type FriendRequest = {
  id: string;
  sender_id: string;
  profiles?: { id: string; first_name: string; last_name: string }; // Include profiles
};

export default function FriendsPage() {
  const [allUsers, setAllUsers] = useState<
    { id: string; first_name: string; last_name: string }[]
  >([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [secretMessages, setSecretMessages] = useState<
    { id: string; message: string }[]
  >([]);
  const [newMessage, setNewMessage] = useState('');
  const [messageToUpdate, setMessageToUpdate] = useState<{
    id: string;
    message: string;
  } | null>(null);
  const [pendingFriendRequests, setPendingFriendRequests] = useState<string[]>(
    []
  );
  const [friendSecretMessages, setFriendSecretMessages] = useState<
    { id: string; message: string }[]
  >([]);
  const { toast } = useToast();

  useEffect(() => {
    console.log('🟢 Running fetch functions...');
    fetchAllUsers();
    fetchFriendRequests();
    fetchFriends();
    fetchSecretMessages();
  }, []);

  // Fetch all users except the logged-in user
  const fetchAllUsers = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .neq('id', user.id); // Exclude the logged-in user

    if (error) {
      console.error('❌ Error fetching users:', error.message);
    } else {
      console.log('✅ All Users:', data);
      setAllUsers(data || []);
    }
  };

  // Fetch incoming friend requests with sender's profile information
  const fetchFriendRequests = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: requests, error: requestsError } = await supabase
      .from('friend_requests')
      .select('id, sender_id')
      .eq('receiver_id', user.id)
      .eq('status', 'pending');

    if (requestsError) {
      console.error(
        '❌ Error fetching friend requests:',
        requestsError.message
      );
      return;
    }

    // Fetch profiles for the sender_ids
    const senderIds = requests.map((request) => request.sender_id);
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .in('id', senderIds);

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError.message);
      return;
    }

    // Combine requests with profiles
    const combinedData = requests.map((request) => {
      const profile = profiles.find((p) => p.id === request.sender_id);
      return { ...request, profiles: profile };
    });

    console.log('✅ Friend Requests:', combinedData);
    setFriendRequests(combinedData || []);
  };

  // Fetch list of confirmed friends
  const fetchFriends = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: requests, error: requestsError } = await supabase
      .from('friend_requests')
      .select('sender_id, receiver_id')
      .or(`receiver_id.eq.${user.id},sender_id.eq.${user.id}`)
      .eq('status', 'accepted');

    if (requestsError) {
      console.error('❌ Error fetching friends:', requestsError.message);
    } else {
      console.log('✅ Accepted Friend Requests:', requests);
      if (requests.length > 0) {
        const friendIds = requests.map((request) =>
          request.sender_id === user.id
            ? request.receiver_id
            : request.sender_id
        );
        const { data: friendsData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', friendIds);

        if (profilesError) {
          console.error('❌ Error fetching profiles:', profilesError.message);
        } else {
          console.log('✅ Friend Details:', friendsData);
          setFriends(friendsData || []);
        }
      }
    }
  };

  // Fetch user's secret messages
  const fetchSecretMessages = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('secret_messages')
      .select('id, message')
      .eq('user_id', user.id);

    if (error) {
      console.error('❌ Error fetching secret messages:', error.message);
    } else {
      console.log('✅ Secret Messages:', data);
      setSecretMessages(data || []);
    }
  };

  // Add a new secret message
  const handleAddMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('secret_messages')
      .insert({ user_id: user.id, message: newMessage });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Success', description: 'Secret message added' });
      setNewMessage('');
      fetchSecretMessages();
    }
  };

  // Edit a secret message
  const handleUpdateMessage = async (id: string) => {
    if (!messageToUpdate) return;

    const { error } = await supabase
      .from('secret_messages')
      .update({ message: messageToUpdate.message })
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Success', description: 'Secret message updated' });
      setMessageToUpdate(null);
      fetchSecretMessages();
    }
  };

  // Delete a secret message
  const handleDeleteMessage = async (id: string) => {
    await supabase.from('secret_messages').delete().eq('id', id);
    fetchSecretMessages();
  };

  // Accept a friend request
  const handleAcceptFriendRequest = async (senderId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'accepted' })
      .eq('sender_id', senderId)
      .eq('receiver_id', user.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to accept friend request',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Friend request accepted',
      });
      fetchFriendRequests(); // Refresh the friend requests
      fetchFriends(); // Refresh the friends list
    }
  };

  // Reject a friend request
  const handleRejectFriendRequest = async (senderId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('friend_requests')
      .delete()
      .eq('sender_id', senderId)
      .eq('receiver_id', user.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject friend request',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Friend request rejected',
      });
      fetchFriendRequests(); // Refresh the friend requests
    }
  };

  // Add a friend
  const handleAddFriend = async (friendId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Check if the friendId is already in pending requests
    if (pendingFriendRequests.includes(friendId)) {
      // If already pending, cancel the request
      const { error } = await supabase
        .from('friend_requests')
        .delete()
        .eq('sender_id', user.id)
        .eq('receiver_id', friendId);

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to cancel friend request',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Friend request canceled',
        });
        setPendingFriendRequests((prev) =>
          prev.filter((id) => id !== friendId)
        );
      }
    } else {
      // If not pending, send a new friend request
      const { error } = await supabase
        .from('friend_requests')
        .insert([
          { sender_id: user.id, receiver_id: friendId, status: 'pending' },
        ]);

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to send friend request',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Friend request sent',
        });
        setPendingFriendRequests((prev) => [...prev, friendId]);
      }
    }
  };

  // Update the viewFriendSecretMessage function to fetch secret messages
  const viewFriendSecretMessage = async (friendId: string) => {
    console.log('Fetching secrets for friend:', friendId); // Debugging log
    const { data } = await supabase
      .from('secret_messages')
      .select('id, message')
      .eq('user_id', friendId); // Fetch the friend's secret messages

    if (data) {
      const { data: friendData } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', friendId)
        .single();

      if (friendData) {
        const updatedFriend = {
          id: friendId,
          first_name: friendData.first_name,
          last_name: friendData.last_name,
          secrets: data, // Set the secrets here
        };

        console.log('Selected friend:', updatedFriend); // Check the selected friend data
        setSelectedFriend(updatedFriend);
        setFriendSecretMessages(data); // Set the friend's secret messages
      }
    }
  };

  // Add the handleUnfriend function
  const handleUnfriend = async (friendId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('friend_requests')
      .delete()
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .eq('status', 'accepted')
      .in('sender_id', [user.id, friendId])
      .in('receiver_id', [user.id, friendId]);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to unfriend',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'You have unfriended this user',
      });
      // Update the friends state to remove the unfriended user
      setFriends((prev) => prev.filter((friend) => friend.id !== friendId));
    }
  };

  return (
    <>
      <ProtectedRoute>
        <Navigation />
        <div className="container mx-auto mt-8">
          {/* Secret Page 3 */}
          <h1 className="text-3xl font-bold mb-4">Secret Page 3</h1>
          <Card className="mb-5">
            <CardHeader>
              <CardTitle>Secret Message</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddMessage} className="space-y-4 mb-4">
                <Input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Enter new secret message"
                />
                <Button type="submit">Add Secret Message</Button>
              </form>
              <Table>
                <TableHeader className="font-bold">
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Secret Message</TableCell>
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
                            <Button onClick={() => setMessageToUpdate(msg)}>
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
            </CardContent>
          </Card>

          <Card className="mb-5">
            <CardHeader>
              <CardTitle>People You May Know</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader className="font-bold">
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allUsers.length > 0 ? (
                    allUsers
                      .filter(
                        (user) =>
                          !friends.some((friend) => friend.id === user.id) &&
                          !pendingFriendRequests.includes(user.id)
                      ) // Hide already friends and pending requests
                      .map((user, index) => (
                        <TableRow key={user.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            {user.first_name} {user.last_name}
                          </TableCell>
                          <TableCell>
                            <Button onClick={() => handleAddFriend(user.id)}>
                              {pendingFriendRequests.includes(user.id)
                                ? 'Cancel'
                                : 'Add Friend'}
                            </Button>
                            <Button
                              onClick={() => {
                                // Navigate to a 404 page or show an error
                                window.location.href = '/404'; // Redirect to 404 page
                              }}
                              variant="outline"
                            >
                              View Secret
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center text-gray-500"
                      >
                        No users found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="mb-5">
            <CardHeader>
              <CardTitle>Friend Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableBody>
                  {friendRequests.length > 0 ? (
                    friendRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          {request.profiles?.first_name}{' '}
                          {request.profiles?.last_name}
                        </TableCell>
                        <TableCell>
                          <Button
                            onClick={() =>
                              handleAcceptFriendRequest(request.sender_id)
                            }
                          >
                            Confirm
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() =>
                              handleRejectFriendRequest(request.sender_id)
                            }
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center text-gray-500"
                      >
                        No friend requests.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="mb-5">
            <CardHeader>
              <CardTitle>My Friends</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {friends.length > 0 ? (
                    friends.map((friend, index) => (
                      <TableRow key={friend.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          {friend.first_name} {friend.last_name}
                        </TableCell>
                        <TableCell>
                          <Button
                            onClick={() => viewFriendSecretMessage(friend.id)}
                          >
                            View Secret
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleUnfriend(friend.id)}
                          >
                            Unfriend
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center text-gray-500"
                      >
                        No friends added yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Secret Dialog */}

              {/* Render the friend's secret messages in a table */}
              {selectedFriend && (
                <div>
                  <h2 className="text-2xl font-bold mt-8 mb-4">
                    Secrets of {selectedFriend.first_name}{' '}
                    {selectedFriend.last_name}
                  </h2>
                  <Table>
                    <TableHeader className="font-bold">
                      <TableRow>
                        <TableCell>#</TableCell>
                        <TableCell>Secret Message</TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {friendSecretMessages.length > 0 ? (
                        friendSecretMessages.map((secret, index) => (
                          <TableRow key={secret.id}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{secret.message}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={2}
                            className="text-center text-gray-500"
                          >
                            No secrets available.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    </>
  );
}
