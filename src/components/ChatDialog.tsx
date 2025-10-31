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
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProfileName {
  full_name: string;
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_profiles: ProfileName | null;
  receiver_profiles: ProfileName | null;
}

interface SupabaseJoinedMessageData {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_profiles: ProfileName | null;
  receiver_profiles: ProfileName | null;
}

interface ChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rideId: string;
  otherUserId: string;
  otherUserName: string;
  currentUserId: string;
}

const ChatDialog: React.FC<ChatDialogProps> = ({
  open,
  onOpenChange,
  rideId,
  otherUserId,
  otherUserName,
  currentUserId,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('messages')
      .select(`
        id,
        sender_id,
        content,
        created_at,
        sender_profiles:sender_id(full_name),
        receiver_profiles:receiver_id(full_name)
      `)
      .eq('ride_id', rideId)
      .order('created_at', { ascending: true });

    if (error) {
      toast.error(`فشل جلب الرسائل: ${error.message}`);
      console.error("Error fetching messages:", error);
    } else {
      const formattedMessages: Message[] = (data as SupabaseJoinedMessageData[]).map(msg => ({
        id: msg.id,
        sender_id: msg.sender_id,
        content: msg.content,
        created_at: msg.created_at,
        sender_profiles: msg.sender_profiles,
        receiver_profiles: msg.receiver_profiles,
      }));
      setMessages(formattedMessages);
    }
    setLoading(false);
  }, [rideId]);

  useEffect(() => {
    if (open) {
      fetchMessages();
    }
  }, [open, fetchMessages]);

  useEffect(() => {
    if (open) {
      scrollToBottom();
    }
  }, [messages, open]);

  useEffect(() => {
    if (!open) return;

    const channel = supabase
      .channel(`chat_ride_${rideId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `ride_id=eq.${rideId}` },
        (payload) => {
          supabase
            .from('messages')
            .select(`
              id,
              sender_id,
              content,
              created_at,
              sender_profiles:sender_id(full_name),
              receiver_profiles:receiver_id(full_name)
            `)
            .eq('id', payload.new.id)
            .single()
            .then(({ data, error }) => {
              if (error) {
                console.error("Error fetching new message for realtime:", error);
              } else if (data) {
                const formattedNewMessage: Message = {
                  id: data.id,
                  sender_id: data.sender_id,
                  content: data.content,
                  created_at: data.created_at,
                  sender_profiles: (data as SupabaseJoinedMessageData).sender_profiles,
                  receiver_profiles: (data as SupabaseJoinedMessageData).receiver_profiles,
                };
                setMessages((prevMessages) => [...prevMessages, formattedNewMessage]);
                if (payload.new.sender_id !== currentUserId) {
                  toast.info(`رسالة جديدة من ${formattedNewMessage.sender_profiles?.full_name || 'مستخدم'}: ${formattedNewMessage.content.substring(0, 30)}...`);
                }
              }
            });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, rideId, currentUserId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

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
          {loading ? (
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