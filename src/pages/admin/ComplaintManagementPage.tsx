"use client";

import React, { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Loader2, Flag, Eye, MessageSquare } from "lucide-react"; // Added MessageSquare back
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import EmptyState from "@/components/EmptyState";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUser } from "@/context/UserContext";
import { Complaint, RawComplaintData } from "@/types/supabase";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";
import { Badge } from "@/components/ui/badge";
import ComplaintChatDialog from "@/components/ComplaintChatDialog"; // Import the new ComplaintChatDialog

const ComplaintManagementPage: React.FC = () => {
  const { user, loading: userLoading } = useUser();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [newStatus, setNewStatus] = useState<Complaint['status']>('pending');
  const [isSaving, setIsSaving] = useState(false);

  const [isComplaintChatDialogOpen, setIsComplaintChatDialogOpen] = useState(false); // New state for complaint chat
  const [chatComplaintId, setChatComplaintId] = useState(""); // New state for complaint ID in chat

  const fetchComplaints = useCallback(async () => {
    setLoadingComplaints(true);
    console.log("Fetching complaints...");
    const { data: complaintsRaw, error } = await supabase
      .from('complaints')
      .select(`
        *,
        passenger_profiles:passenger_id(id, full_name, avatar_url, user_type),
        driver_profiles:driver_id(id, full_name, avatar_url, user_type),
        rides(id, pickup_location, destination)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error(`فشل جلب الشكاوى: ${error.message}`);
      console.error("Error fetching complaints:", error);
      console.log("Supabase fetch error details:", error); // Log error details
    } else {
      console.log("Raw complaints data from Supabase:", complaintsRaw); // Log raw data
      const formattedComplaints: Complaint[] = (complaintsRaw as RawComplaintData[] || []).map(comp => {
        const passengerProfile = Array.isArray(comp.passenger_profiles)
          ? comp.passenger_profiles[0] || null
          : comp.passenger_profiles;
        
        const driverProfile = Array.isArray(comp.driver_profiles)
          ? comp.driver_profiles[0] || null
          : comp.driver_profiles;

        const rideDetails = Array.isArray(comp.rides) && comp.rides.length > 0
          ? comp.rides[0]
          : (comp.rides as { id: string; pickup_location: string; destination: string } | null);

        return {
          ...comp,
          passenger_profiles: passengerProfile,
          driver_profiles: driverProfile,
          ride_details: rideDetails,
        };
      }) as Complaint[];
      setComplaints(formattedComplaints);
      console.log("Formatted complaints for display:", formattedComplaints); // Log formatted data
    }
    setLoadingComplaints(false);
  }, []);

  useEffect(() => {
    if (!userLoading && user) {
      console.log("User is loaded, fetching complaints for user:", user.id, "with role:", user.user_metadata?.user_type);
      fetchComplaints();
    } else if (!userLoading && !user) {
      console.log("User is not logged in or still loading.");
      setLoadingComplaints(false);
    }
  }, [userLoading, user, fetchComplaints]);

  useSupabaseRealtime(
    'admin_complaints_channel',
    {
      event: '*',
      schema: 'public',
      table: 'complaints',
    },
    (_payload) => {
      console.log("Realtime update received for complaints:", _payload);
      fetchComplaints(); // Re-fetch all complaints on any change
    },
    !!user
  );

  const handleViewComplaint = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setAdminNotes(complaint.admin_notes || "");
    setNewStatus(complaint.status);
    setIsViewDialogOpen(true);
  };

  const handleUpdateComplaint = async () => {
    if (!selectedComplaint) return;

    setIsSaving(true);
    const { error } = await supabase
      .from('complaints')
      .update({
        status: newStatus,
        admin_notes: adminNotes.trim() === "" ? null : adminNotes.trim(),
        resolved_at: (newStatus === 'resolved' || newStatus === 'rejected') && !selectedComplaint.resolved_at ? new Date().toISOString() : selectedComplaint.resolved_at,
      })
      .eq('id', selectedComplaint.id);
    setIsSaving(false);

    if (error) {
      toast.error(`فشل تحديث الشكوى: ${error.message}`);
      console.error("Error updating complaint:", error);
    } else {
      toast.success("تم تحديث الشكوى بنجاح!");
      setIsViewDialogOpen(false);
      // fetchComplaints() will be triggered by realtime
    }
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
    const passengerName = complaint.passenger_profiles?.full_name || '';
    const driverName = complaint.driver_profiles?.full_name || '';
    const rideInfo = `${complaint.ride_details?.pickup_location || ''} ${complaint.ride_details?.destination || ''}`;

    const matchesSearch = (
      complaint.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      passengerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rideInfo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const matchesStatus = filterStatus === "all" || complaint.status === filterStatus;

    return matchesSearch && matchesStatus;
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
      <PageHeader title="إدارة الشكاوى" description="عرض وإدارة شكاوى الركاب ضد السائقين." showBackButton={false} />

      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="البحث عن شكوى..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
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
          description="لا توجد شكاوى لعرضها حاليًا."
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الموضوع</TableHead>
                <TableHead>الراكب</TableHead>
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
                  <TableCell>{complaint.passenger_profiles?.full_name || 'غير معروف'}</TableCell>
                  <TableCell>{complaint.driver_profiles?.full_name || 'غير معروف'}</TableCell>
                  <TableCell>
                    {complaint.ride_details ? (
                      <span className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer" onClick={() => { /* navigate to ride details */ }}>
                        {complaint.ride_details.pickup_location} - {complaint.ride_details.destination} (ID: {complaint.ride_details.id})
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
                      title="عرض/تعديل"
                    >
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">عرض/تعديل</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenComplaintChat(complaint.id)} // Open complaint chat
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
              عرض وتحديث حالة الشكوى وملاحظات المدير.
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
                <span className="col-span-3">{selectedComplaint.passenger_profiles?.full_name || 'غير معروف'} ({selectedComplaint.passenger_profiles?.id})</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">السائق:</Label>
                <span className="col-span-3">{selectedComplaint.driver_profiles?.full_name || 'غير معروف'} ({selectedComplaint.driver_profiles?.id})</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">الرحلة:</Label>
                <span className="col-span-3">
                  {selectedComplaint.ride_details ? (
                    <span className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer" onClick={() => { /* navigate to ride details */ }}>
                      {selectedComplaint.ride_details.pickup_location} - {selectedComplaint.ride_details.destination} (ID: {selectedComplaint.ride_details.id})
                    </span>
                  ) : (
                    'N/A'
                  )}
                </span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">الحالة:</Label>
                <Select value={newStatus} onValueChange={(value: Complaint['status']) => setNewStatus(value)}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="تغيير الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">قيد الانتظار</SelectItem>
                    <SelectItem value="reviewed">تمت المراجعة</SelectItem>
                    <SelectItem value="resolved">تم الحل</SelectItem>
                    <SelectItem value="rejected">مرفوضة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="admin_notes" className="text-right">ملاحظات المدير:</Label>
                <Textarea
                  id="admin_notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="col-span-3 resize-y"
                  rows={4}
                  placeholder="أضف ملاحظاتك هنا..."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              إلغاء
            </Button>
            <Button type="submit" onClick={handleUpdateComplaint} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2 rtl:mr-2" />
                  جاري الحفظ...
                </>
              ) : (
                "حفظ التغييرات"
              )}
            </Button>
          </DialogFooter>
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

export default ComplaintManagementPage;