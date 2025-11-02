"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useUser } from "@/context/UserContext";
import { RealtimeChannel } from "@supabase/supabase-js";
import { Message, ProfileDetails, SupabaseJoinedMessageData } from "@/types/supabase";

interface ChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rideId: string;
  otherUserId: string;
  otherUserName: string;
  isAdminView?: boolean; // New prop
}

const ChatDialog: React.FC<ChatDialogProps> = ({
  open,
  onOpenChange,
  rideId,
  otherUserId,
  otherUserName,
  isAdminView = false, // Default to false
}) => {
  const { user, profile: currentUserProfile, loading: userLoading } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [otherUserProfile, setOtherUserProfile] = useState<ProfileDetails | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentUserId = user?.id;

  // Refs to hold the latest profile data without triggering useEffect re-runs for the channel
  const currentUserProfileRef = useRef(currentUserProfile);
  const otherUserProfileRef = useRef(otherUserProfile);

  useEffect(() => {
    currentUserProfileRef.current = currentUserProfile;
  }, [currentUserProfile]);

  useEffect(() => {
    otherUserProfileRef.current = otherUserProfile;
  }, [otherUserProfile]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchOtherProfile = useCallback(async () => {
    if (open && otherUserId) {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, user_type') // Fetch user_type
        .eq('id', otherUserId)
        .single();
      if (error) {
        console.error("Error fetching other user profile:", error);
        setOtherUserProfile(null);
      } else {
        setOtherUserProfile(data);
      }
    }
  }, [open, otherUserId]);

  useEffect(() => {
    fetchOtherProfile();
  }, [fetchOtherProfile]);

  const fetchMessages = useCallback(async () => {
    if (!currentUserId) return;

    setLoadingMessages(true);
    const { data, error } = await supabase
      .from('messages')
      .select(`
        id,
        sender_id,
        content,
        created_at,
        sender_profiles:sender_id(id, full_name, avatar_url, user_type),
        receiver_profiles:receiver_id(id, full_name, avatar_url, user_type)
      `)
      .eq('ride_id', rideId)
      .order('created_at', { ascending: true });

    if (error) {
      toast.error(`فشل جلب الرسائل: ${error.message}`);
      console.error("Error fetching messages:", error);
    } else {
      const formattedMessages: Message[] = (data as SupabaseJoinedMessageData[]).map(msg => {
        const senderProfiles = Array.isArray(msg.sender_profiles) && msg.sender_profiles.length > 0
          ? msg.sender_profiles[0]
          : (msg.sender_profiles as ProfileDetails | null);
        
        const receiverProfiles = Array.isArray(msg.receiver_profiles) && msg.receiver_profiles.length > 0
          ? msg.receiver_profiles[0]
          : (msg.receiver_profiles as ProfileDetails | null);

        return {
          ...msg,
          sender_profiles: senderProfiles,
          receiver_profiles: receiverProfiles,
        };
      });
      setMessages(formattedMessages);
    }
    setLoadingMessages(false);
  }, [rideId, currentUserId]);

  useEffect(() => {
    if (open && currentUserId) {
      fetchMessages();
    }
  }, [open, fetchMessages, currentUserId]);

  useEffect(() => {
    if (open) {
      scrollToBottom();
    }
  }, [messages, open]);

  useEffect(() => {
    let channel: RealtimeChannel | undefined;
    if (!currentUserId) { // Only subscribe if user is logged in
      return () => {
        if (channel) {
          supabase.removeChannel(channel);
        }
      };
    }

    channel = supabase
      .channel(`chat_ride_${rideId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `ride_id=eq.${rideId}` },
        async (payload) => { // Made callback async
          const newMsgPayload = payload.new;
          
          let senderProfiles: ProfileDetails | null = null;
          let receiverProfiles: ProfileDetails | null = null;

          // Try to get profiles from refs first
          if (newMsgPayload.sender_id === currentUserId) {
            senderProfiles = currentUserProfileRef.current;
            receiverProfiles = otherUserProfileRef.current;
          } else if (newMsgPayload.sender_id === otherUserId) {
            senderProfiles = otherUserProfileRef.current;
            receiverProfiles = currentUserProfileRef.current;
          }

          // If profiles are still null, fetch them
          if (!senderProfiles || !receiverProfiles) {
            const { data: profilesData, error: profilesError } = await supabase
              .from('profiles')
              .select('id, full_name, avatar_url, user_type') // Fetch user_type
              .in('id', [newMsgPayload.sender_id, newMsgPayload.receiver_id]);

            if (profilesError) {
              console.error("Error fetching profiles for new message:", profilesError);
            } else if (profilesData) {
              senderProfiles = profilesData.find(p => p.id === newMsgPayload.sender_id) || null;
              receiverProfiles = profilesData.find(p => p.id === newMsgPayload.receiver_id) || null;
            }
          }
          
          // Fallback if profiles are not found
          if (!senderProfiles) {
            senderProfiles = { id: newMsgPayload.sender_id, full_name: 'مستخدم غير معروف', avatar_url: null, user_type: undefined };
          }
          if (!receiverProfiles) {
            receiverProfiles = { id: newMsgPayload.receiver_id, full_name: 'مستخدم غير معروف', avatar_url: null, user_type: undefined };
          }

          const formattedNewMessage: Message = {
            id: newMsgPayload.id,
            sender_id: newMsgPayload.sender_id,
            content: newMsgPayload.content,
            created_at: newMsgPayload.created_at,
            sender_profiles: senderProfiles,
            receiver_profiles: receiverProfiles,
          };
          setMessages((prevMessages) => [...prevMessages, formattedNewMessage]);
          
          // Show toast notification only if the message is from the other user AND the chat dialog is NOT open
          if (newMsgPayload.sender_id !== currentUserId && !open) {
            toast.info(`رسالة جديدة من ${senderProfiles?.full_name || 'مستخدم'}: ${formattedNewMessage.content.substring(0, 30)}...`);
          }
        }
      )
      .subscribe();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [open, rideId, currentUserId, otherUserId]); // Added 'open' to dependencies

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUserId) return;
    if (!rideId) { // Added check for empty rideId
      toast.error("لا يمكن إرسال الرسالة: معرف الرحلة غير متوفر.");
      return;
    }

    setIsSending(true);

    if (isAdminView) {
      // Admin sending a message, send to both passenger and driver of the ride
      const { data: rideData, error: rideError } = await supabase
        .from('rides')
        .select('passenger_id, driver_id')
        .eq('id', rideId)
        .maybeSingle(); // Changed to maybeSingle()

      if (rideError) {
        toast.error(`فشل جلب تفاصيل الرحلة لإرسال رسالة: ${rideError.message}`);
        console.error("Error fetching ride details for admin message:", rideError);
        setIsSending(false);
        return;
      }
      
      if (!rideData) {
        toast.error("فشل إرسال رسالة المدير: لم يتم العثور على تفاصيل الرحلة.");
        console.error("Ride details not found for admin message, rideId:", rideId);
        setIsSending(false);
        return;
      }

      const messagesToInsert = [];
      if (rideData.passenger_id) {
        messagesToInsert.push({
          ride_id: rideId,
          sender_id: currentUserId,
          receiver_id: rideData.passenger_id,
          content: newMessage.trim(),
        });
      }
      if (rideData.driver_id) {
        messagesToInsert.push({
          ride_id: rideId,
          sender_id: currentUserId,
          receiver_id: rideData.driver_id,
          content: newMessage.trim(),
        });
      }

      if (messagesToInsert.length > 0) {
        const { error: insertError } = await supabase.from('messages').insert(messagesToInsert);
        if (insertError) {
          toast.error(`فشل إرسال رسالة المدير: ${insertError.message}`);
          console.error("Error sending admin message:", insertError);
        } else {
          setNewMessage("");
        }
      } else {
        toast.error("لا يوجد ركاب أو سائقين في هذه الرحلة لإرسال رسالة.");
      }
    } else {
      // Existing logic for passenger/driver 1-to-1 chat
      const { error } = await supabase.from('messages').insert({
        ride_id: rideId,
        sender_id: currentUserId,
        receiver_id: otherUserId,
        content: newMessage.trim(),
      });
      if (error) {
        toast.error(`فشل إرسال الرسالة: ${error.message}`);
        console.error("Error sending message:", error);
      } else {
        setNewMessage("");
      }
    }
    setIsSending(false);
  };

  const getSenderLabel = (msg: Message) => {
    if (msg.sender_id === currentUserId) {
      return isAdminView ? "أنت (المدير)" : "أنت";
    }
    const senderName = msg.sender_profiles?.full_name || 'مستخدم';
    const senderType = msg.sender_profiles?.user_type;
    if (senderType) {
      const typeLabel = senderType === 'passenger' ? 'راكب' : senderType === 'driver' ? 'سائق' : 'مدير';
      return `${senderName} (${typeLabel})`;
    }
    return senderName;
  };

  if (userLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px] flex flex-col h-[80vh]">
          <DialogHeader>
            <DialogTitle>جاري تحميل الدردشة...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] flex flex-col h-[80vh]">
        <DialogHeader>
          <DialogTitle>الدردشة مع {otherUserName}</DialogTitle>
          <DialogDescription>
            تواصل مع {otherUserName} بخصوص الرحلة.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 p-4 border rounded-md dark:border-gray-700 bg-gray-50 dark:bg-gray-800 mb-4">
          {loadingMessages ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400">
              ابدأ المحادثة!
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex",
                    msg.sender_id === currentUserId ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[70%] p-3 rounded-lg shadow-sm",
                      msg.sender_id === currentUserId
                        ? "bg-primary text-primary-foreground rounded-br-none"
                        : "bg-muted dark:bg-gray-700 text-muted-foreground rounded-bl-none"
                    )}
                  >
                    <p className="text-xs font-semibold mb-1">
                      {getSenderLabel(msg)}
                    </p>
                    <p className="text-sm">{msg.content}</p>
                    <p className="text-xs text-gray-300 dark:text-gray-500 mt-1 text-left">
                      {new Date(msg.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            type="text"
            placeholder="اكتب رسالتك..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1"
            disabled={isSending}
          />
          <Button type="submit" disabled={isSending}>
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ChatDialog;