"use client";

import React, { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Flag, PlusCircle, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import EmptyState from "@/components/EmptyState";
import ComplaintFormDialog from "@/components/ComplaintFormDialog";
import { useUser } from "@/context/UserContext";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";
import { Complaint, RawComplaintData, ProfileDetails } from "@/types/supabase";
import { Badge } from "@/components/ui/badge";
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

const PassengerComplaintsPage: React.FC = () => {
  const { user, loading: userLoading } = useUser();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(true);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);

  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  const fetchMyComplaints = useCallback(async (userId: string) => {
    setLoadingComplaints(true);
    const { data: complaintsRaw, error } = await supabase
      .from('complaints')
      .select(`
        *,
        passenger_profiles:passenger_id(id, full_name, avatar_url, user_type),
        driver_profiles:driver_id(id, full_name, avatar_url, user_type),
        rides(id, pickup_location, destination)
      `)
      .eq('passenger_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error(`فشل جلب شكاواك: ${error.message}`);
      console.error("Error fetching passenger complaints:", error);
      setComplaints([]);
    } else {
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
      });
      setComplaints(formattedComplaints);
    }
    setLoadingComplaints(false);
  }, []);

  useEffect(() => {
    if (!userLoading && user) {
      fetchMyComplaints(user.id);
    }
  }, [userLoading, user, fetchMyComplaints]);

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
        fetchMyComplaints(user.id);
        if (_payload.eventType === 'UPDATE' && _payload.new.status !== _payload.old.status) {
          toast.info(`تم تحديث حالة شكواك (${_payload.new.subject}) إلى: ${_payload.new.status}`);
        }
      }
    },
    !!user
  );

  const handleAddComplaint = () => {
    setIsFormDialogOpen(true);
  };

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

  if (userLoading || loadingComplaints) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">جاري تحميل الشكاوى...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <PageHeader title="شكاواي" description="عرض وإدارة الشكاوى التي قدمتها." backPath="/passenger-dashboard" />

      <div className="flex justify-end mb-4">
        <Button onClick={handleAddComplaint} className="bg-primary hover:bg-primary-dark text-primary-foreground">
          <PlusCircle className="h-4 w-4 ml-2 rtl:mr-2" />
          تقديم شكوى جديدة
        </Button>
      </div>

      {complaints.length === 0 ? (
        <EmptyState
          icon={Flag}
          title="لا توجد شكاوى"
          description="لم تقدم أي شكاوى بعد. ابدأ بتقديم شكوى جديدة."
        />
      ) : (
        <div className="grid gap-4">
          {complaints.map((complaint) => (
            <Card key={complaint.id} className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{complaint.subject}</span>
                  <Badge variant={getStatusBadgeVariant(complaint.status)}>
                    {complaint.status === 'pending' ? 'قيد الانتظار' :
                     complaint.status === 'reviewed' ? 'تمت المراجعة' :
                     complaint.status === 'resolved' ? 'تم الحل' :
                     complaint.status === 'rejected' ? 'مرفوضة' : 'غير معروف'}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {complaint.ride_details ? (
                    <span>رحلة من {complaint.ride_details.pickup_location} إلى {complaint.ride_details.destination}</span>
                  ) : (
                    'شكوى عامة'
                  )}
                  {complaint.driver_profiles && (
                    <span> - ضد السائق: {complaint.driver_profiles.full_name}</span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => handleViewComplaint(complaint)}>
                  <Eye className="h-4 w-4 ml-2 rtl:mr-2" />
                  عرض التفاصيل
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ComplaintFormDialog
        open={isFormDialogOpen}
        onOpenChange={setIsFormDialogOpen}
        onSave={() => fetchMyComplaints(user?.id || '')}
      />

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>تفاصيل الشكوى</DialogTitle>
            <DialogDescription>
              عرض تفاصيل شكواك وحالتها.
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
                <Label className="text-right">الحالة:</Label>
                <span className="col-span-3">
                  <Badge variant={getStatusBadgeVariant(selectedComplaint.status)}>
                    {selectedComplaint.status === 'pending' ? 'قيد الانتظار' :
                     selectedComplaint.status === 'reviewed' ? 'تمت المراجعة' :
                     selectedComplaint.status === 'resolved' ? 'تم الحل' :
                     selectedComplaint.status === 'rejected' ? 'مرفوضة' : 'غير معروف'}
                  </Badge>
                </span>
              </div>
              {selectedComplaint.admin_notes && (
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right">ملاحظات المدير:</Label>
                  <Textarea
                    value={selectedComplaint.admin_notes}
                    className="col-span-3 resize-y"
                    rows={4}
                    readOnly
                  />
                </div>
              )}
              {selectedComplaint.resolved_at && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">تاريخ الحل/الرفض:</Label>
                  <span className="col-span-3">{new Date(selectedComplaint.resolved_at).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PassengerComplaintsPage;