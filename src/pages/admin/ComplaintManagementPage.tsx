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
import { Search, Loader2, Flag, Eye, Trash2 } from "lucide-react";
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
import { Complaint } from "@/types/supabase";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import ComplaintTableSkeleton from "@/components/skeletons/ComplaintTableSkeleton";
import supabaseService from "@/services/supabaseService"; // Import the new service

const AdminComplaintManagementPage: React.FC = () => {
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

  const [isDeleting, setIsDeleting] = useState(false);
  const [complaintToDelete, setComplaintToDelete] = useState<Complaint | null>(null);

  const fetchComplaints = useCallback(async () => {
    setLoadingComplaints(true);
    try {
      const fetchedComplaints = await supabaseService.getAllComplaints();
      setComplaints(fetchedComplaints);
    } catch (error: any) {
      console.error("AdminComplaintManagementPage: Error fetching complaints:", error);
      toast.error(`فشل جلب الشكاوى: ${error.message}`);
      setComplaints([]);
    } finally {
      setLoadingComplaints(false);
    }
  }, []);

  useEffect(() => {
    if (!userLoading && user?.id) {
      fetchComplaints();
    } else if (!userLoading && !user) {
      setLoadingComplaints(false);
    }
  }, [userLoading, user?.id, fetchComplaints]);

  useSupabaseRealtime(
    'admin_complaints_channel',
    {
      event: '*',
      schema: 'public',
      table: 'complaints',
    },
    (_payload) => {
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
    try {
      await supabaseService.updateComplaint(selectedComplaint.id, {
        status: newStatus,
        admin_notes: adminNotes.trim() === "" ? null : adminNotes.trim(),
        resolved_at: (newStatus === 'resolved' || newStatus === 'rejected') && !selectedComplaint.resolved_at ? new Date().toISOString() : selectedComplaint.resolved_at,
      });
      toast.success("تم تحديث الشكوى بنجاح!");
      setIsViewDialogOpen(false);
      fetchComplaints(); // Re-fetch to update the list
    } catch (error: any) {
      toast.error(`فشل تحديث الشكوى: ${error.message}`);
      console.error("Error updating complaint:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteComplaint = async () => {
    if (!complaintToDelete) return;

    setIsDeleting(true);
    try {
      await supabaseService.deleteComplaint(complaintToDelete.id);
      toast.success("تم حذف الشكوى بنجاح!");
      fetchComplaints(); // Re-fetch to update the list
    } catch (error: any) {
      toast.error(`فشل حذف الشكوى: ${error.message}`);
      console.error("Error deleting complaint:", error);
    } finally {
      setIsDeleting(false);
      setComplaintToDelete(null);
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

  const filteredComplaints = complaints.filter(complaint => {
    const passengerName = complaint.passenger_profiles?.full_name || '';
    const driverName = complaint.driver_profiles?.full_name || '';
    const rideLocation = complaint.ride_details ? `${complaint.ride_details.pickup_location} ${complaint.ride_details.destination}` : '';

    const matchesSearch = (
      complaint.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      passengerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rideLocation.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const matchesStatus = filterStatus === "all" || complaint.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  if (userLoading) {
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

      {loadingComplaints ? (
        <ComplaintTableSkeleton />
      ) : filteredComplaints.length === 0 ? (
        <EmptyState
          icon={Flag}
          title="لا توجد شكاوى"
          description="لا توجد شكاوى لعرضها حاليًا."
        />
      ) : (
        <div className="rounded-md border overflow-x-auto">
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
                  <TableCell>{complaint.passenger_profiles?.full_name || 'N/A'}</TableCell>
                  <TableCell>{complaint.driver_profiles?.full_name || 'N/A'}</TableCell>
                  <TableCell>
                    {complaint.ride_details ? (
                      <span>{complaint.ride_details.pickup_location} - {complaint.ride_details.destination}</span>
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
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20"
                          onClick={() => setComplaintToDelete(complaint)}
                          title="حذف"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">حذف</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
                          <AlertDialogDescription>
                            سيؤدي هذا الإجراء إلى حذف الشكوى "{complaintToDelete?.subject}" بشكل دائم. لا يمكن التراجع عن هذا الإجراء.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setComplaintToDelete(null)}>إلغاء</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteComplaint} disabled={isDeleting}>
                            {isDeleting ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin ml-2 rtl:mr-2" />
                                جاري الحذف...
                              </>
                            ) : (
                              "حذف"
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
                <span className="col-span-3">{selectedComplaint.passenger_profiles?.full_name || selectedComplaint.passenger_id}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">السائق:</Label>
                <span className="col-span-3">{selectedComplaint.driver_profiles?.full_name || selectedComplaint.driver_id || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">الرحلة:</Label>
                <span className="col-span-3">
                  {selectedComplaint.ride_details ? (
                    <span>
                      {selectedComplaint.ride_details.pickup_location} - {selectedComplaint.ride_details.destination} (ID: {selectedComplaint.ride_details.id})
                    </span>
                  ) : (
                    selectedComplaint.ride_id || 'N/A'
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
    </div>
  );
};

export default AdminComplaintManagementPage;