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
import { Message, ProfileDetails } from "@/types/supabase";
import supabaseService from "@/services/supabaseService"; // Import the new service

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
  const [otherUserProfile, setOtherUserProfile] = useState<ProfileDetails | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentUserId = user?.id;

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
      try {
        const profile = await supabaseService.getUserProfile(otherUserId);
        setOtherUserProfile(profile);
      } catch (error) {
        console.error("Error fetching other user profile:", error);
        setOtherUserProfile(null);
      }
    }
  }, [open, otherUserId]);

  useEffect(() => {
    fetchOtherProfile();
  }, [fetchOtherProfile]);

  const fetchMessages = useCallback(async () => {
    if (!currentUserId) return;

    setLoadingMessages(true);
    try {
      const fetchedMessages = await supabaseService.getMessagesForRide(rideId);
      setMessages(fetchedMessages);
    } catch (error: any) {
      toast.error(`فشل جلب الرسائل: ${error.message}`);
      console.error("Error fetching messages:", error);
    } finally {
      setLoadingMessages(false);
    }
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
    if (!currentUserId) {
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
        async (payload) => {
          const newMsgPayload = payload.new;
          
          let senderProfiles: ProfileDetails | null = null;
          let receiverProfiles: ProfileDetails | null = null;

          if (newMsgPayload.sender_id === currentUserId) {
            senderProfiles = currentUserProfileRef.current;
            receiverProfiles = otherUserProfileRef.current;
          } else if (newMsgPayload.sender_id === otherUserId) {
            senderProfiles = otherUserProfileRef.current;
            receiverProfiles = currentUserProfileRef.current;
          }

          if (!senderProfiles || !receiverProfiles) {
            try {
              const profilesData = await Promise.all([
                supabaseService.getUserProfile(newMsgPayload.sender_id),
                supabaseService.getUserProfile(newMsgPayload.receiver_id)
              ]);
              senderProfiles = profilesData[0];
              receiverProfiles = profilesData[1];
            } catch (error) {
              console.error("Error fetching profiles for new message:", error);
            }
          }
          
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
  }, [open, rideId, currentUserId, otherUserId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUserId) return;
    if (!rideId) {
      toast.error("لا يمكن إرسال الرسالة: معرف الرحلة غير متوفر.");
      return;
    }

    setIsSending(true);
    try {
      await supabaseService.sendMessage(rideId, currentUserId, otherUserId, newMessage);
      setNewMessage("");
    } catch (error: any) {
      toast.error(`فشل إرسال الرسالة: ${error.message}`);
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const getSenderLabel = (msg: Message) => {
    if (msg.sender_id === currentUserId) {
      return "أنت";
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