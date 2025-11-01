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
import { RealtimeChannel } from "@supabase/supabase-js"; // Import RealtimeChannel
import { Message, ProfileDetails, SupabaseJoinedMessageData } from "@/types/supabase"; // Import shared types

interface ChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rideId: string;
  otherUserId: string;
  otherUserName: string;
}

const ChatDialog: React.FC<ChatDialogProps> = ({
  open,
  onOpenChange,
  rideId,
  otherUserId,
  otherUserName,
}) => {
  const { user, profile: currentUserProfile, loading: userLoading } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [otherUserProfile, setOtherUserProfile] = useState<ProfileDetails | null>(null); // State for other user's profile
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentUserId = user?.id; // Get current user ID from context

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch other user's profile once when dialog opens
  useEffect(() => {
    const fetchOtherProfile = async () => {
      if (open && otherUserId) {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .eq('id', otherUserId)
          .single();
        if (error) {
          console.error("Error fetching other user profile:", error);
          setOtherUserProfile(null);
        } else {
          setOtherUserProfile(data);
        }
      }
    };
    fetchOtherProfile();
  }, [open, otherUserId]);

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
        sender_profiles:sender_id(id, full_name, avatar_url),
        receiver_profiles:receiver_id(id, full_name, avatar_url)
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
          id: msg.id,
          sender_id: msg.sender_id,
          content: msg.content,
          created_at: msg.created_at,
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
    if (!open || !currentUserId) {
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
        (payload) => {
          const newMsgPayload = payload.new;
          let senderProfiles: ProfileDetails | null = null;
          let receiverProfiles: ProfileDetails | null = null;

          if (newMsgPayload.sender_id === currentUserId) {
            senderProfiles = currentUserProfile;
            receiverProfiles = otherUserProfile;
          } else if (newMsgPayload.sender_id === otherUserId) {
            senderProfiles = otherUserProfile;
            receiverProfiles = currentUserProfile;
          }
          // Fallback if profiles are not found (shouldn't happen in 1-on-1 chat)
          if (!senderProfiles) {
            senderProfiles = { id: newMsgPayload.sender_id, full_name: 'مستخدم غير معروف', avatar_url: null };
          }
          if (!receiverProfiles) {
            receiverProfiles = { id: newMsgPayload.receiver_id, full_name: 'مستخدم غير معروف', avatar_url: null };
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
          if (newMsgPayload.sender_id !== currentUserId) {
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
  }, [open, rideId, currentUserId, currentUserProfile, otherUserId, otherUserProfile]); // Added profile dependencies

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUserId) return;

    setIsSending(true);
    const { error } = await supabase.from('messages').insert({
      ride_id: rideId,
      sender_id: currentUserId,
      receiver_id: otherUserId,
      content: newMessage.trim(),
    });
    setIsSending(false);

    if (error) {
      toast.error(`فشل إرسال الرسالة: ${error.message}`);
      console.error("Error sending message:", error);
    } else {
      setNewMessage("");
    }
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
                      {msg.sender_id === currentUserId ? "أنت" : msg.sender_profiles?.full_name || 'مستخدم'}
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