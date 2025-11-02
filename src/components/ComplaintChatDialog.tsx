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
import { ComplaintMessage, ProfileDetails, RawComplaintMessageData } from "@/types/supabase";

interface ComplaintChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  complaintId: string;
  // No otherUserId or otherUserName needed as it's complaint-centric
}

const ComplaintChatDialog: React.FC<ComplaintChatDialogProps> = ({
  open,
  onOpenChange,
  complaintId,
}) => {
  const { user, profile: currentUserProfile, loading: userLoading } = useUser();
  const [messages, setMessages] = useState<ComplaintMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentUserId = user?.id;
  const currentUserProfileRef = useRef(currentUserProfile);

  useEffect(() => {
    currentUserProfileRef.current = currentUserProfile;
  }, [currentUserProfile]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = useCallback(async () => {
    if (!currentUserId || !complaintId) return;

    setLoadingMessages(true);
    const { data, error } = await supabase
      .from('complaint_messages')
      .select(`
        id,
        complaint_id,
        sender_id,
        content,
        created_at,
        sender_profiles:sender_id(id, full_name, avatar_url, user_type)
      `)
      .eq('complaint_id', complaintId)
      .order('created_at', { ascending: true });

    if (error) {
      toast.error(`فشل جلب رسائل الشكوى: ${error.message}`);
      console.error("Error fetching complaint messages:", error);
    } else {
      const formattedMessages: ComplaintMessage[] = (data as RawComplaintMessageData[]).map(msg => {
        const senderProfiles = Array.isArray(msg.sender_profiles) && msg.sender_profiles.length > 0
          ? msg.sender_profiles[0]
          : (msg.sender_profiles as ProfileDetails | null);
        
        return {
          id: msg.id,
          complaint_id: msg.complaint_id,
          sender_id: msg.sender_id,
          content: msg.content,
          created_at: msg.created_at,
          sender_profiles: senderProfiles,
        };
      });
      setMessages(formattedMessages);
    }
    setLoadingMessages(false);
  }, [complaintId, currentUserId]);

  useEffect(() => {
    if (open && currentUserId && complaintId) {
      fetchMessages();
    }
  }, [open, fetchMessages, currentUserId, complaintId]);

  useEffect(() => {
    if (open) {
      scrollToBottom();
    }
  }, [messages, open]);

  useEffect(() => {
    let channel: RealtimeChannel | undefined;
    if (!currentUserId || !complaintId) {
      return () => {
        if (channel) {
          supabase.removeChannel(channel);
        }
      };
    }

    channel = supabase
      .channel(`complaint_chat_${complaintId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'complaint_messages', filter: `complaint_id=eq.${complaintId}` },
        async (payload) => {
          const newMsgPayload = payload.new;
          
          let senderProfiles: ProfileDetails | null = null;

          if (newMsgPayload.sender_id === currentUserId) {
            senderProfiles = currentUserProfileRef.current;
          } else {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('id, full_name, avatar_url, user_type')
              .eq('id', newMsgPayload.sender_id)
              .single();
            if (profileError) {
              console.error("Error fetching profile for new complaint message:", profileError);
            } else {
              senderProfiles = profileData;
            }
          }
          
          if (!senderProfiles) {
            senderProfiles = { id: newMsgPayload.sender_id, full_name: 'مستخدم غير معروف', avatar_url: null, user_type: undefined };
          }

          const formattedNewMessage: ComplaintMessage = {
            id: newMsgPayload.id,
            complaint_id: newMsgPayload.complaint_id,
            sender_id: newMsgPayload.sender_id,
            content: newMsgPayload.content,
            created_at: newMsgPayload.created_at,
            sender_profiles: senderProfiles,
          };
          setMessages((prevMessages) => [...prevMessages, formattedNewMessage]);
          
          if (newMsgPayload.sender_id !== currentUserId && !open) {
            toast.info(`رسالة جديدة بخصوص الشكوى من ${senderProfiles?.full_name || 'مستخدم'}: ${formattedNewMessage.content.substring(0, 30)}...`);
          }
        }
      )
      .subscribe();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [open, complaintId, currentUserId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUserId || !complaintId) return;

    setIsSending(true);

    const { error } = await supabase.from('complaint_messages').insert({
      complaint_id: complaintId,
      sender_id: currentUserId,
      content: newMessage.trim(),
    });
    if (error) {
      toast.error(`فشل إرسال الرسالة: ${error.message}`);
      console.error("Error sending complaint message:", error);
    } else {
      setNewMessage("");
    }
    setIsSending(false);
  };

  const getSenderLabel = (msg: ComplaintMessage) => {
    if (msg.sender_id === currentUserId) {
      return currentUserProfile?.user_type === 'admin' ? "أنت (المدير)" : "أنت";
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
          <DialogTitle>محادثة الشكوى</DialogTitle>
          <DialogDescription>
            تواصل بخصوص الشكوى رقم {complaintId.substring(0, 8)}...
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 p-4 border rounded-md dark:border-gray-700 bg-gray-50 dark:bg-gray-800 mb-4">
          {loadingMessages ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400">
              ابدأ المحادثة بخصوص هذه الشكوى!
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

export default ComplaintChatDialog;