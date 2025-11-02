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
import { Search, Loader2, Flag, Eye, MessageSquare } from "lucide-react";
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
import ComplaintChatDialog from "@/components/ComplaintChatDialog";

const ComplaintManagementPage: React.FC = () => {
  const { user, profile, loading: userLoading } = useUser(); // تم إضافة profile
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [newStatus, setNewStatus] = useState<Complaint['status']>('pending');
  const [isSaving, setIsSaving] = useState(false);

  const [isComplaintChatDialogOpen, setIsComplaintChatDialogOpen] = useState(false);
  const [chatComplaintId, setChatComplaintId] = useState("");

  const fetchComplaints = useCallback(async () => {
    setLoadingComplaints(true);
    console.log("Fetching complaints (simplified query for debugging)...");
    const { data: complaintsRaw, error } = await supabase
      .from('complaints')
      .select(`*`) // تم تبسيط الاستعلام لجلب جميع الأعمدة مباشرة من جدول الشكاوى
      .order('created_at', { ascending: false });

    if (error) {
      toast.error(`فشل جلب الشكاوى: ${error.message}`);
      console.error("Error fetching complaints (simplified):", error);
      console.log("Supabase fetch error details (simplified):", error);
    } else {
      console.log("Raw complaints data from Supabase (simplified):", complaintsRaw);
      // سنقوم بتنسيق البيانات هنا بشكل مبسط لأننا لا نملك بيانات العلاقات
      const formattedComplaints: Complaint[] = (complaintsRaw as any[] || []).map(comp => {
        return {
          ...comp,
          passenger_profiles: null, // تعيين صريح لـ null لأننا لا نجلبها في هذا الاستعلام المبسّط
          driver_profiles: null,
          ride_details: null,
        } as Complaint;
      });
      setComplaints(formattedComplaints);
      console.log("Formatted complaints for display (simplified):", formattedComplaints);
    }
    setLoadingComplaints(false);
  }, []);

  useEffect(() => {
    if (!userLoading && user && profile) { // التأكد من تحميل profile
      console.log("Admin ComplaintManagementPage: User loaded. ID:", user.id, "Email:", user.email);
      console.log("Admin ComplaintManagementPage: User app_metadata:", user.app_metadata);
      console.log("Admin ComplaintManagementPage: User user_metadata:", user.user_metadata);
      console.log("Admin ComplaintManagementPage: Profile from context:", profile); // سجل profile من السياق
      fetchComplaints();
    } else if (!userLoading && !user) {
      console.log("Admin ComplaintManagementPage: User is not logged in or still loading.");
      setLoadingComplaints(false);
    }
  }, [userLoading, user, profile, fetchComplaints]); // إضافة profile إلى مصفوفة التبعيات

  useSupabaseRealtime(
    'admin_complaints_channel',
    {
      event: '*',
      schema: 'public',
      table: 'complaints',
    },
    (_payload) => {
      console.log("Realtime update received for complaints:", _payload);
      fetchComplaints();
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
    // بما أننا بسّطنا الاستعلام، قد لا تكون بيانات الـ profiles والـ rides متاحة هنا
    // لذا سنركز على البحث في الحقول المباشرة للشكوى
    const matchesSearch = (
      complaint.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.description.toLowerCase().includes(searchTerm.toLowerCase())
      // لا يمكن البحث في passenger_profiles أو driver_profiles أو ride_details حاليًا
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
                <TableHead>الراكب (ID)</TableHead> {/* تم التعديل لعرض ID مؤقتًا */}
                <TableHead>السائق (ID)</TableHead> {/* تم التعديل لعرض ID مؤقتًا */}
                <TableHead>الرحلة (ID)</TableHead> {/* تم التعديل لعرض ID مؤقتًا */}
                <TableHead>الحالة</TableHead>
                <TableHead>تاريخ الإنشاء</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredComplaints.map((complaint) => (
                <TableRow key={complaint.id}>
                  <TableCell className="font-medium">{complaint.subject}</TableCell>
                  <TableCell>{complaint.passenger_id?.substring(0, 8) || 'N/A'}</TableCell> {/* عرض ID */}
                  <TableCell>{complaint.driver_id?.substring(0, 8) || 'N/A'}</TableCell> {/* عرض ID */}
                  <TableCell>{complaint.ride_id?.substring(0, 8) || 'N/A'}</TableCell> {/* عرض ID */}
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
                <Label className="text-right">الراكب (ID):</Label>
                <span className="col-span-3">{selectedComplaint.passenger_id}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">السائق (ID):</Label>
                <span className="col-span-3">{selectedComplaint.driver_id}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">الرحلة (ID):</Label>
                <span className="col-span-3">{selectedComplaint.ride_id || 'N/A'}</span>
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