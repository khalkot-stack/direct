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
import { PlusCircle, Search, Edit, Trash2, Loader2, MessageSquare, Car as CarIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import RideFormDialog from "@/components/RideFormDialog";
import EmptyState from "@/components/EmptyState";
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
import { Badge } from "@/components/ui/badge";
import ChatDialog from "@/components/ChatDialog";
import { useUser } from "@/context/UserContext";
import { ProfileDetails, Ride } from "@/types/supabase"; // Import shared types

// Define a raw data interface to correctly type the joined profiles
interface RawRideData extends Omit<Ride, 'passenger_profiles' | 'driver_profiles'> {
  passenger_profiles: ProfileDetails[] | ProfileDetails | null;
  driver_profiles: ProfileDetails[] | ProfileDetails | null;
}

const RideManagementPage: React.FC = () => {
  const { user, loading: userLoading } = useUser();
  const [rides, setRides] = useState<Ride[]>([]); // Changed to use Ride interface directly
  const [loadingRides, setLoadingRides] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [selectedRide, setSelectedRide] = useState<Ride | undefined>(undefined);
  const [isDeleting, setIsDeleting] = useState(false);
  const [rideToDelete, setRideToDelete] = useState<Ride | null>(null);

  const [isChatDialogOpen, setIsChatDialogOpen] = useState(false);
  const [chatRideId, setChatRideId] = useState("");
  const [chatOtherUserId, setChatOtherUserId] = useState("");
  const [chatOtherUserName, setChatOtherUserName] = useState("");

  const fetchRides = useCallback(async () => {
    setLoadingRides(true);
    const { data: ridesRaw, error } = await supabase
      .from('rides')
      .select(`
        id,
        passenger_id,
        driver_id,
        pickup_location,
        destination,
        passengers_count,
        status,
        created_at,
        cancellation_reason,
        pickup_lat,
        pickup_lng,
        destination_lat,
        destination_lng,
        driver_current_lat,
        driver_current_lng,
        passenger_profiles:passenger_id(id, full_name, avatar_url),
        driver_profiles:driver_id(id, full_name, avatar_url)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error(`فشل جلب الرحلات: ${error.message}`);
      console.error("Error fetching rides:", error);
    } else {
      // Map raw data to conform to the Ride interface
      const formattedRides: Ride[] = (ridesRaw as RawRideData[] || []).map(ride => {
        const passengerProfile = Array.isArray(ride.passenger_profiles)
          ? ride.passenger_profiles[0] || null
          : ride.passenger_profiles;
        
        const driverProfile = Array.isArray(ride.driver_profiles)
          ? ride.driver_profiles[0] || null
          : ride.driver_profiles;

        return {
          ...ride,
          passenger_profiles: passengerProfile,
          driver_profiles: driverProfile,
        };
      }) as Ride[]; // Cast to Ride[] after mapping
      setRides(formattedRides);
    }
    setLoadingRides(false);
  }, []);

  useEffect(() => {
    fetchRides();
  }, [fetchRides]);

  const handleAddRide = () => {
    setSelectedRide(undefined);
    setIsFormDialogOpen(true);
  };

  const handleEditRide = (ride: Ride) => { // Changed type to Ride
    setSelectedRide(ride);
    setIsFormDialogOpen(true);
  };

  const handleSaveRide = async (rideData: Omit<Ride, 'created_at' | 'passenger_profiles' | 'driver_profiles' | 'cancellation_reason' | 'pickup_lat' | 'pickup_lng' | 'destination_lat' | 'destination_lng' | 'driver_current_lat' | 'driver_current_lng'>) => {
    if (selectedRide) {
      // Update existing ride
      const { id, ...updates } = rideData;
      const { error } = await supabase
        .from('rides')
        .update(updates)
        .eq('id', id);

      if (error) {
        toast.error(`فشل تحديث الرحلة: ${error.message}`);
        console.error("Error updating ride:", error);
      } else {
        toast.success("تم تحديث الرحلة بنجاح!");
        fetchRides();
      }
    } else {
      // Create new ride
      const { error } = await supabase
        .from('rides')
        .insert(rideData);

      if (error) {
        toast.error(`فشل إضافة الرحلة: ${error.message}`);
        console.error("Error adding ride:", error);
      } else {
        toast.success("تم إضافة الرحلة بنجاح!");
        fetchRides();
      }
    }
    setIsFormDialogOpen(false);
  };

  const handleDeleteRide = async () => {
    if (!rideToDelete) return;

    setIsDeleting(true);
    const { error } = await supabase
      .from('rides')
      .delete()
      .eq('id', rideToDelete.id);
    setIsDeleting(false);
    setRideToDelete(null); // Close the dialog

    if (error) {
      toast.error(`فشل حذف الرحلة: ${error.message}`);
      console.error("Error deleting ride:", error);
    } else {
      toast.success("تم حذف الرحلة بنجاح!");
      fetchRides();
    }
  };

  const handleOpenChat = (ride: Ride) => { // Changed type to Ride
    if (!user?.id) {
      toast.error("الرجاء تسجيل الدخول للمحادثة.");
      return;
    }

    let otherUser: { id: string; name: string } | null = null;

    if (user.id === ride.passenger_id && ride.driver_profiles) {
      otherUser = { id: ride.driver_id!, name: ride.driver_profiles.full_name || 'السائق' };
    } else if (user.id === ride.driver_id && ride.passenger_profiles) {
      otherUser = { id: ride.passenger_id, name: ride.passenger_profiles.full_name || 'الراكب' };
    } else if (user.id !== ride.passenger_id && user.id !== ride.driver_id) {
      // Admin is initiating chat, choose passenger by default or prompt
      if (ride.passenger_profiles) {
        otherUser = { id: ride.passenger_id, name: ride.passenger_profiles.full_name || 'الراكب' };
      } else if (ride.driver_profiles) {
        otherUser = { id: ride.driver_id!, name: ride.driver_profiles.full_name || 'السائق' };
      }
    }

    if (otherUser) {
      setChatRideId(ride.id);
      setChatOtherUserId(otherUser.id);
      setChatOtherUserName(otherUser.name);
      setIsChatDialogOpen(true);
    } else {
      toast.error("لا يمكن بدء الدردشة. لا يوجد مستخدم آخر متاح في هذه الرحلة.");
    }
  };

  const getStatusBadge = (status: "pending" | "accepted" | "completed" | "cancelled") => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-blue-500 hover:bg-blue-500/80">قيد الانتظار</Badge>;
      case "accepted":
        return <Badge variant="default" className="bg-green-500 hover:bg-green-500/80">مقبولة</Badge>;
      case "completed":
        return <Badge variant="default" className="bg-purple-500 hover:bg-purple-500/80">مكتملة</Badge>;
      case "cancelled":
        return <Badge variant="destructive">ملغاة</Badge>;
      default:
        return <Badge variant="outline">غير معروف</Badge>;
    }
  };

  const filteredRides = rides.filter(ride => {
    const passengerName = ride.passenger_profiles?.full_name || '';
    const driverName = ride.driver_profiles?.full_name || '';

    return (
      ride.pickup_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ride.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      passengerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ride.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (userLoading || loadingRides) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <PageHeader title="إدارة الرحلات" description="عرض وإدارة جميع الرحلات في النظام." showBackButton={false} />

      <div className="flex items-center justify-between mb-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="البحث عن رحلة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button onClick={handleAddRide} className="bg-primary hover:bg-primary-dark text-primary-foreground">
          <PlusCircle className="h-4 w-4 ml-2 rtl:mr-2" />
          إضافة رحلة
        </Button>
      </div>

      {filteredRides.length === 0 ? (
        <EmptyState
          icon={CarIcon}
          title="لا توجد رحلات"
          description="لا توجد بيانات رحلات لعرضها. ابدأ بإضافة رحلة جديدة."
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الراكب</TableHead>
                <TableHead>السائق</TableHead>
                <TableHead>الانطلاق</TableHead>
                <TableHead>الوجهة</TableHead>
                <TableHead>الركاب</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRides.map((ride) => {
                const passengerName = ride.passenger_profiles?.full_name || '';
                const driverName = ride.driver_profiles?.full_name || '';
                return (
                  <TableRow key={ride.id}>
                    <TableCell className="font-medium">{passengerName}</TableCell>
                    <TableCell>{driverName}</TableCell>
                    <TableCell>{ride.pickup_location}</TableCell>
                    <TableCell>{ride.destination}</TableCell>
                    <TableCell>{ride.passengers_count}</TableCell>
                    <TableCell>{getStatusBadge(ride.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenChat(ride)}
                        className="ml-2 rtl:mr-2"
                        title="محادثة"
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span className="sr-only">محادثة</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditRide(ride)}
                        className="ml-2 rtl:mr-2"
                        title="تعديل"
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">تعديل</span>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20"
                            onClick={() => setRideToDelete(ride)} // Changed type to Ride
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
                              سيؤدي هذا الإجراء إلى حذف الرحلة من {rideToDelete?.pickup_location} إلى {rideToDelete?.destination} بشكل دائم. لا يمكن التراجع عن هذا الإجراء.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setRideToDelete(null)}>إلغاء</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteRide} disabled={isDeleting}>
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
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <RideFormDialog
        open={isFormDialogOpen}
        onOpenChange={setIsFormDialogOpen}
        ride={selectedRide}
        onSave={handleSaveRide}
      />

      {user && (
        <ChatDialog
          open={isChatDialogOpen}
          onOpenChange={setIsChatDialogOpen}
          rideId={chatRideId}
          otherUserId={chatOtherUserId}
          otherUserName={chatOtherUserName}
        />
      )}
    </div>
  );
};

export default RideManagementPage;