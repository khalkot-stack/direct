"use client";

import React, { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Flag, MessageSquare, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import EmptyState from "@/components/EmptyState";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Import Select components
import { useUser } from "@/context/UserContext";
import { Complaint, RawComplaintData } from "@/types/supabase";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";
import { Badge } from "@/components/ui/badge";
import ComplaintChatDialog from "@/components/ComplaintChatDialog";

const DriverComplaintsPage: React.FC = () => {
  const { user, loading: userLoading } = useUser();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all"); // New state for filter

  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  const [isComplaintChatDialogOpen, setIsComplaintChatDialogOpen] = useState(false);
  const [chatComplaintId, setChatComplaintId] = useState("");

  const fetchDriverComplaints = useCallback(async (driverId: string) => {
    setLoadingComplaints(true);
    const { data: complaintsRaw, error } = await supabase
      .from('complaints')
      .select(`
        *,
        passenger_profiles:passenger_id(id, full_name, avatar_url, user_type),
        rides(id, pickup_location, destination)
      `)
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error(`فشل جلب الشكاوى: ${error.message}`);
      console.error("Error fetching driver complaints:", error);
    } else {
      const formattedComplaints: Complaint[] = (complaintsRaw as RawComplaintData[] || []).map(comp => {
        const passengerProfile = Array.isArray(comp.passenger_profiles)
          ? comp.passenger_profiles[0] || null
          : comp.passenger_profiles;
        
        const rideDetails = Array.isArray(comp.rides) && comp.rides.length > 0
          ? comp.rides[0]
          : (comp.rides as { id: string; pickup_location: string; destination: string } | null);

        return {
          ...comp,
          passenger_profiles: passengerProfile,
          driver_profiles: null, // Driver profile is current user, not joined
          ride_details: rideDetails,
        };
      }) as Complaint[];
      setComplaints(formattedComplaints);
    }
    setLoadingComplaints(false);
  }, []);

  useEffect(() => {
    if (!userLoading && user) {
      fetchDriverComplaints(user.id);
    } else if (!userLoading && !user) {
      setLoadingComplaints(false);
    }
  }, [userLoading, user, fetchDriverComplaints]);

  useSupabaseRealtime(
    'driver_complaints_channel',
    {
      event: '*',
      schema: 'public',
      table: 'complaints',
      filter: `driver_id=eq.${user?.id}`,
    },
    (_payload) => {
      if (user) {
        fetchDriverComplaints(user.id);
      }
    },
    !!user
  );

  const handleViewComplaint = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setIsViewDialogOpen(true);
  };

  const getStatusBadgeVariant = (status: Complaint['status']) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'reviewed': return 'default';
      case 'resolved': return 'default';
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  };

  const handleOpenComplaintChat = (complaintId: string) => {
    if (!user?.id) {
      toast.error("الرجاء تسجيل الدخول للمحادثة.");
      return;
    }
    setChatComplaintId(complaintId);
    setIsComplaintChatDialogOpen(true);
  };

  const filteredComplaints = complaints.filter(complaint => {
    const matchesStatus = filterStatus === "all" || complaint.status === filterStatus;
    return matchesStatus;
  });

  if (userLoading || loadingComplaints) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <PageHeader title="شكاواي" description="عرض الشكاوى المقدمة ضدك." backPath="/driver-dashboard" />

      <div className="flex justify-end mb-4">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="تصفية حسب الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            <SelectItem value="pending">قيد الانتظار</SelectItem>
            <SelectItem value="reviewed">تمت المراجعة</SelectItem>
            <SelectItem value="resolved">تم الحل</SelectItem>
            <SelectItem value="rejected">مرفوضة</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredComplaints.length === 0 ? (
        <EmptyState
          icon={Flag}
          title="لا توجد شكاوى"
          description="لا توجد شكاوى مقدمة ضدك حاليًا."
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الموضوع</TableHead>
                <TableHead>الراكب</TableHead>
                <TableHead>الرحلة</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>تاريخ الإنشاء</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredComplaints.map((complaint) => (
                <TableRow key={complaint.id}>
                  <TableCell className="font-medium">{complaint.subject}</TableCell>
                  <TableCell>{complaint.passenger_profiles?.full_name || 'غير معروف'}</TableCell>
                  <TableCell>
                    {complaint.ride_details ? (
                      <span>
                        {complaint.ride_details.pickup_location} - {complaint.ride_details.destination}
                      </span>
                    ) : (
                      'N/A'
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(complaint.status)}>
                      {complaint.status === 'pending' ? 'قيد الانتظار' :
                       complaint.status === 'reviewed' ? 'تمت المراجعة' :
                       complaint.status === 'resolved' ? 'تم الحل' :
                       complaint.status === 'rejected' ? 'مرفوضة' : 'غير معروف'}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(complaint.created_at).toLocaleDateString('ar-SA')}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewComplaint(complaint)}
                      className="ml-2 rtl:mr-2"
                      title="عرض التفاصيل"
                    >
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">عرض التفاصيل</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenComplaintChat(complaint.id)}
                      className="ml-2 rtl:mr-2"
                      title="محادثة الشكوى"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span className="sr-only">محادثة الشكوى</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>تفاصيل الشكوى</DialogTitle>
            <DialogDescription>
              عرض تفاصيل الشكوى المقدمة ضدك.
            </DialogDescription>
          </DialogHeader>
          {selectedComplaint && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">الموضوع:</Label>
                <span className="col-span-3 font-medium">{selectedComplaint.subject}</span>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right">الوصف:</Label>
                <span className="col-span-3 text-sm">{selectedComplaint.description}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">الراكب:</Label>
                <span className="col-span-3">{selectedComplaint.passenger_profiles?.full_name || 'غير معروف'}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">الرحلة:</Label>
                <span className="col-span-3">
                  {selectedComplaint.ride_details ? (
                    <span>
                      {selectedComplaint.ride_details.pickup_location} - {selectedComplaint.ride_details.destination} (ID: {selectedComplaint.ride_details.id})
                    </span>
                  ) : (
                    'N/A'
                  )}
                </span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">الحالة:</Label>
                <Badge variant={getStatusBadgeVariant(selectedComplaint.status)}>
                  {selectedComplaint.status === 'pending' ? 'قيد الانتظار' :
                   selectedComplaint.status === 'reviewed' ? 'تمت المراجعة' :
                   selectedComplaint.status === 'resolved' ? 'تم الحل' :
                   selectedComplaint.status === 'rejected' ? 'مرفوضة' : 'غير معروف'}
                </Badge>
              </div>
              {selectedComplaint.admin_notes && (
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right">ملاحظات المدير:</Label>
                  <Textarea
                    value={selectedComplaint.admin_notes}
                    readOnly
                    className="col-span-3 resize-y bg-gray-100 dark:bg-gray-800"
                    rows={4}
                  />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {user && (
        <ComplaintChatDialog
          open={isComplaintChatDialogOpen}
          onOpenChange={setIsComplaintChatDialogOpen}
          complaintId={chatComplaintId}
        />
      )}
    </div>
  );
};

export default DriverComplaintsPage;