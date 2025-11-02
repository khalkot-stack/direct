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
import { Loader2, Flag, MessageSquare, Eye, PlusCircle } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUser } from "@/context/UserContext";
import { Complaint, RawComplaintData } from "@/types/supabase";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";
import { Badge } from "@/components/ui/badge";
import ComplaintChatDialog from "@/components/ComplaintChatDialog";
import ComplaintFormDialog from "@/components/ComplaintFormDialog";

const PassengerComplaintsPage: React.FC = () => {
  const { user, loading: userLoading } = useUser();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  const [isComplaintChatDialogOpen, setIsComplaintChatDialogOpen] = useState(false);
  const [chatComplaintId, setChatComplaintId] = useState("");

  const [isComplaintFormDialogOpen, setIsComplaintFormDialogOpen] = useState(false);
  // Removed formDriverId, formRideId, formDriverName states as they are now handled within ComplaintFormDialog

  const fetchPassengerComplaints = useCallback(async (passengerId: string) => {
    setLoadingComplaints(true);
    const { data: complaintsRaw, error } = await supabase
      .from('complaints')
      .select(`
        *,
        driver_profiles:driver_id(id, full_name, avatar_url, user_type),
        rides(id, pickup_location, destination)
      `)
      .eq('passenger_id', passengerId)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error(`فشل جلب الشكاوى: ${error.message}`);
      console.error("Error fetching passenger complaints:", error);
    } else {
      const formattedComplaints: Complaint[] = (complaintsRaw as RawComplaintData[] || []).map(comp => {
        const driverProfile = Array.isArray(comp.driver_profiles)
          ? comp.driver_profiles[0] || null
          : comp.driver_profiles;
        
        const rideDetails = Array.isArray(comp.rides) && comp.rides.length > 0
          ? comp.rides[0]
          : (comp.rides as { id: string; pickup_location: string; destination: string } | null);

        return {
          ...comp,
          passenger_profiles: null, // Passenger profile is current user, not joined
          driver_profiles: driverProfile,
          ride_details: rideDetails,
        };
      }) as Complaint[];
      setComplaints(formattedComplaints);
    }
    setLoadingComplaints(false);
  }, []);

  useEffect(() => {
    if (!userLoading && user) {
      fetchPassengerComplaints(user.id);
    } else if (!userLoading && !user) {
      setLoadingComplaints(false);
    }
  }, [userLoading, user, fetchPassengerComplaints]);

  useSupabaseRealtime(
    'passenger_complaints_channel',
    {
      event: '*',
      schema: 'public',
      table: 'complaints',
      filter: `passenger_id=eq.${user?.id}`,
    },
    (_payload) => {
      if (user) {
        fetchPassengerComplaints(user.id);
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

  const handleOpenNewComplaintForm = () => {
    // No need to set driver/ride info here, ComplaintFormDialog will handle it
    setIsComplaintFormDialogOpen(true);
  };

  const handleComplaintSubmitted = () => {
    if (user) {
      fetchPassengerComplaints(user.id); // Refresh complaints list
    }
    setIsComplaintFormDialogOpen(false);
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
      <PageHeader title="شكاواي" description="عرض الشكاوى التي قدمتها." backPath="/passenger-dashboard" />

      <div className="flex items-center justify-between mb-4">
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
        <Button onClick={handleOpenNewComplaintForm} className="bg-primary hover:bg-primary-dark text-primary-foreground">
          <PlusCircle className="h-4 w-4 ml-2 rtl:mr-2" />
          تقديم شكوى جديدة
        </Button>
      </div>

      {filteredComplaints.length === 0 ? (
        <EmptyState
          icon={Flag}
          title="لا توجد شكاوى"
          description="لم تقدم أي شكاوى بعد."
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الموضوع</TableHead>
                <TableHead>السائق</TableHead>
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
                  <TableCell>{complaint.driver_profiles?.full_name || 'غير معروف'}</TableCell>
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
              عرض تفاصيل الشكوى التي قدمتها.
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
                <Label className="text-right">السائق:</Label>
                <span className="col-span-3">{selectedComplaint.driver_profiles?.full_name || 'غير معروف'}</span>
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

      {user && (
        <ComplaintFormDialog
          open={isComplaintFormDialogOpen}
          onOpenChange={setIsComplaintFormDialogOpen}
          onComplaintSubmitted={handleComplaintSubmitted}
        />
      )}
    </div>
  );
};

export default PassengerComplaintsPage;