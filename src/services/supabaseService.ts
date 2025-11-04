import { supabase } from "@/integrations/supabase/client";
import { Profile, Ride, UserSettings, SystemSetting, Complaint, Rating, Message, ProfileDetails, RawRideData, RawComplaintData, SupabaseJoinedMessageData } from "@/types/supabase";

// Helper to safely extract single profile from potential array
const extractSingleProfile = (data: ProfileDetails[] | ProfileDetails | null): ProfileDetails | null => {
  if (Array.isArray(data)) {
    return data.length > 0 ? data[0] : null;
  }
  return data;
};

// Helper to format ride data from raw Supabase response
const formatRideData = (rideRaw: RawRideData): Ride => {
  const passengerProfile = extractSingleProfile(rideRaw.passenger_profiles);
  const driverProfile = extractSingleProfile(rideRaw.driver_profiles);
  return {
    ...rideRaw,
    passenger_profiles: passengerProfile,
    driver_profiles: driverProfile,
  } as Ride;
};

// Helper to format complaint data from raw Supabase response
const formatComplaintData = (complaintRaw: RawComplaintData): Complaint => {
  const passengerProfile = extractSingleProfile(complaintRaw.passenger_profiles);
  const driverProfile = extractSingleProfile(complaintRaw.driver_profiles);
  const rideDetails = Array.isArray(complaintRaw.rides) && complaintRaw.rides.length > 0
    ? complaintRaw.rides[0]
    : (complaintRaw.rides as { id: string; pickup_location: string; destination: string } | null);

  return {
    ...complaintRaw,
    passenger_profiles: passengerProfile,
    driver_profiles: driverProfile,
    ride_details: rideDetails,
  } as Complaint;
};

// Helper to format message data from raw Supabase response
const formatMessageData = (messageRaw: SupabaseJoinedMessageData): Message => {
  const senderProfiles = extractSingleProfile(messageRaw.sender_profiles);
  const receiverProfiles = extractSingleProfile(messageRaw.receiver_profiles);
  return {
    ...messageRaw,
    sender_profiles: senderProfiles,
    receiver_profiles: receiverProfiles,
  } as Message;
};

const supabaseService = {
  // --- Auth & User Management ---
  async getUserProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, user_type, status, phone_number, avatar_url, created_at")
      .eq("id", userId)
      .single();
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 means no rows found
    return data as Profile | null;
  },

  async createProfile(profileData: Omit<Profile, 'created_at'>): Promise<Profile | null> {
    const { data, error } = await supabase
      .from("profiles")
      .insert(profileData)
      .select()
      .single();
    if (error) throw error;
    return data as Profile;
  },

  async updateProfile(userId: string, updates: Partial<Omit<Profile, 'id' | 'email' | 'created_at'>>): Promise<Profile | null> {
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();
    if (error) throw error;
    return data as Profile;
  },

  async deleteProfile(userId: string): Promise<void> {
    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("id", userId);
    if (error) throw error;
  },

  async getAllUsers(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Profile[];
  },

  // --- Ride Management ---
  async getRideById(rideId: string): Promise<Ride | null> {
    const { data: rideRaw, error } = await supabase
      .from('rides')
      .select(`
        *,
        passenger_profiles:passenger_id(id, full_name, avatar_url, user_type),
        driver_profiles:driver_id(id, full_name, avatar_url, user_type)
      `)
      .eq('id', rideId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return rideRaw ? formatRideData(rideRaw as RawRideData) : null;
  },

  async getPassengerCurrentRide(passengerId: string): Promise<Ride | null> {
    const { data: ridesRaw, error } = await supabase
      .from('rides')
      .select(`
        *,
        passenger_profiles:passenger_id(id, full_name, avatar_url, user_type),
        driver_profiles:driver_id(id, full_name, avatar_url, user_type)
      `)
      .eq('passenger_id', passengerId)
      .in('status', ['pending', 'accepted'])
      .order('created_at', { ascending: false })
      .limit(1);
    if (error) throw error;
    return ridesRaw && ridesRaw.length > 0 ? formatRideData(ridesRaw[0] as RawRideData) : null;
  },

  async getDriverCurrentRide(driverId: string): Promise<Ride | null> {
    const { data: ridesRaw, error } = await supabase
      .from('rides')
      .select(`
        *,
        passenger_profiles:passenger_id(id, full_name, avatar_url, user_type),
        driver_profiles:driver_id(id, full_name, avatar_url, user_type)
      `)
      .eq('driver_id', driverId)
      .in('status', ['accepted'])
      .order('created_at', { ascending: false })
      .limit(1);
    if (error) throw error;
    return ridesRaw && ridesRaw.length > 0 ? formatRideData(ridesRaw[0] as RawRideData) : null;
  },

  async getPassengerRides(passengerId: string): Promise<Ride[]> {
    const { data: ridesRaw, error } = await supabase
      .from('rides')
      .select(`
        *,
        passenger_profiles:passenger_id(id, full_name, avatar_url, user_type),
        driver_profiles:driver_id(id, full_name, avatar_url, user_type)
      `)
      .eq('passenger_id', passengerId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (ridesRaw || []).map(formatRideData);
  },

  async getDriverAcceptedRides(driverId: string): Promise<Ride[]> {
    const { data: ridesRaw, error } = await supabase
      .from('rides')
      .select(`
        *,
        passenger_profiles:passenger_id(id, full_name, avatar_url, user_type),
        driver_profiles:driver_id(id, full_name, avatar_url, user_type)
      `)
      .eq('driver_id', driverId)
      .in('status', ['accepted', 'completed', 'cancelled'])
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (ridesRaw || []).map(formatRideData);
  },

  async getAvailableRides(
    driverId: string,
    page: number,
    pageSize: number,
    searchCriteria: { pickupLocation?: string; destination?: string }
  ): Promise<{ rides: Ride[]; count: number }> {
    const limit = pageSize;
    const offset = page * limit;

    let query = supabase
      .from('rides')
      .select(`
        *,
        passenger_profiles:passenger_id(id, full_name, avatar_url, user_type)
      `, { count: 'exact' })
      .eq('status', 'pending')
      .is('driver_id', null)
      .neq('passenger_id', driverId) // Re-enabled for correct logic
      .order('created_at', { ascending: false });

    if (searchCriteria?.pickupLocation) {
      query = query.ilike('pickup_location', `%${searchCriteria.pickupLocation}%`);
    }
    if (searchCriteria?.destination) {
      query = query.ilike('destination', `%${searchCriteria.destination}%`);
    }

    const { data: ridesRaw, error, count } = await query.range(offset, offset + limit - 1);
    if (error) throw error;
    return {
      rides: (ridesRaw || []).map(formatRideData),
      count: count || 0,
    };
  },

  async createRide(rideData: Omit<Ride, 'id' | 'created_at' | 'passenger_profiles' | 'driver_profiles' | 'cancellation_reason' | 'pickup_lat' | 'pickup_lng' | 'destination_lat' | 'destination_lng' | 'driver_current_lat' | 'driver_current_lng'>): Promise<Ride | null> {
    const { data, error } = await supabase
      .from('rides')
      .insert(rideData)
      .select()
      .single();
    if (error) throw error;
    return data ? formatRideData(data as RawRideData) : null;
  },

  async updateRide(rideId: string, updates: Partial<Omit<Ride, 'id' | 'created_at' | 'passenger_profiles' | 'driver_profiles'>>): Promise<Ride | null> {
    const { data, error } = await supabase
      .from('rides')
      .update(updates)
      .eq('id', rideId)
      .select()
      .single();
    if (error) throw error;
    return data ? formatRideData(data as RawRideData) : null;
  },

  async deleteRide(rideId: string): Promise<void> {
    const { error } = await supabase
      .from('rides')
      .delete()
      .eq('id', rideId);
    if (error) throw error;
  },

  async getAllRides(): Promise<Ride[]> {
    const { data: ridesRaw, error } = await supabase
      .from('rides')
      .select(`
        *,
        passenger_profiles:passenger_id(id, full_name, avatar_url, user_type),
        driver_profiles:driver_id(id, full_name, avatar_url, user_type)
      `)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (ridesRaw || []).map(formatRideData);
  },

  // --- Message Management ---
  async getMessagesForRide(rideId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        id,
        sender_id,
        content,
        created_at,
        sender_profiles:sender_id(id, full_name, avatar_url, user_type),
        receiver_profiles:receiver_id(id, full_name, avatar_url, user_type)
      `)
      .eq('ride_id', rideId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []).map(formatMessageData);
  },

  async sendMessage(rideId: string, senderId: string, receiverId: string, content: string): Promise<Message | null> {
    const { data, error } = await supabase.from('messages').insert({
      ride_id: rideId,
      sender_id: senderId,
      receiver_id: receiverId,
      content: content.trim(),
    }).select().single();
    if (error) throw error;
    return data ? formatMessageData(data as SupabaseJoinedMessageData) : null;
  },

  // --- Rating Management ---
  async createRating(ratingData: Omit<Rating, 'id' | 'created_at'>): Promise<Rating | null> {
    const { data, error } = await supabase.from('ratings').insert(ratingData).select().single();
    if (error) throw error;
    return data as Rating;
  },

  // --- Complaint Management ---
  async createComplaint(complaintData: Omit<Complaint, 'id' | 'created_at' | 'resolved_at' | 'passenger_profiles' | 'driver_profiles' | 'ride_details'>): Promise<Complaint | null> {
    const { data, error } = await supabase.from('complaints').insert(complaintData).select().single();
    if (error) throw error;
    return data ? formatComplaintData(data as RawComplaintData) : null;
  },

  async updateComplaint(complaintId: string, updates: Partial<Omit<Complaint, 'id' | 'created_at' | 'passenger_id' | 'driver_id' | 'ride_id' | 'passenger_profiles' | 'driver_profiles' | 'ride_details'>>): Promise<Complaint | null> {
    const { data, error } = await supabase
      .from('complaints')
      .update(updates)
      .eq('id', complaintId)
      .select()
      .single();
    if (error) throw error;
    return data ? formatComplaintData(data as RawComplaintData) : null;
  },

  async deleteComplaint(complaintId: string): Promise<void> {
    const { error } = await supabase
      .from('complaints')
      .delete()
      .eq('id', complaintId);
    if (error) throw error;
  },

  async getPassengerComplaints(passengerId: string): Promise<Complaint[]> {
    const { data: complaintsRaw, error } = await supabase
      .from('complaints')
      .select(`
        *,
        passenger_profiles:passenger_id(id, full_name, avatar_url, user_type),
        driver_profiles:driver_id(id, full_name, avatar_url, user_type),
        rides(id, pickup_location, destination)
      `)
      .eq('passenger_id', passengerId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (complaintsRaw || []).map(formatComplaintData);
  },

  async getAllComplaints(): Promise<Complaint[]> {
    const { data: complaintsRaw, error } = await supabase
      .from('complaints')
      .select(`
        *,
        passenger_profiles:passenger_id(id, full_name, avatar_url, user_type),
        driver_profiles:driver_id(id, full_name, avatar_url, user_type),
        rides(id, pickup_location, destination)
      `)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (complaintsRaw || []).map(formatComplaintData);
  },

  // --- Settings Management ---
  async getSystemSettings(keys: string[]): Promise<SystemSetting[]> {
    const { data, error } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', keys);
    if (error) throw error;
    return data as SystemSetting[];
  },

  async upsertSystemSettings(settings: Partial<SystemSetting>[]): Promise<void> {
    const { error } = await supabase
      .from('settings')
      .upsert(settings, { onConflict: 'key' });
    if (error) throw error;
  },

  async getUserSettings(userId: string): Promise<UserSettings | null> {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data as UserSettings | null;
  },

  async upsertUserSettings(settings: Omit<UserSettings, 'id'>): Promise<UserSettings | null> {
    const { data, error } = await supabase
      .from('user_settings')
      .upsert(settings, { onConflict: 'user_id' })
      .select()
      .single();
    if (error) throw error;
    return data as UserSettings;
  },

  // --- Overview Data (Admin Dashboard) ---
  async getOverviewStats(): Promise<{
    totalUsers: number;
    completedRidesCount: number;
    totalRevenue: number;
    averageRating: number;
    recentRides: Ride[];
    monthlyRevenueData: { name: string; total: number }[];
  }> {
    // Fetch total users
    const { count: usersCount, error: usersError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    if (usersError) throw usersError;

    // Fetch completed rides count
    const { count: completedRidesCountData, error: completedRidesCountError } = await supabase
      .from('rides')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');
    if (completedRidesCountError) throw completedRidesCountError;

    // Fetch all completed rides for revenue calculation and chart
    const { data: allCompletedRides, error: allCompletedRidesError } = await supabase
      .from('rides')
      .select('price, created_at')
      .eq('status', 'completed');
    if (allCompletedRidesError) throw allCompletedRidesError;

    let calculatedTotalRevenue = 0;
    const monthlyRevenueMap = new Map<string, number>();

    if (allCompletedRides) {
      allCompletedRides.forEach(ride => {
        const price = ride.price || 0;
        calculatedTotalRevenue += price;

        const date = new Date(ride.created_at);
        const monthYear = date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short' });
        monthlyRevenueMap.set(monthYear, (monthlyRevenueMap.get(monthYear) || 0) + price);
      });
    }

    const sortedMonthlyRevenue = Array.from(monthlyRevenueMap.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => {
        // Simple sorting by month name might not be chronological,
        // for real app, store month index or full date for sorting.
        // For now, assuming month names are ordered for display.
        return 0;
      });

    // Fetch average rating
    const { data: ratingsData, error: ratingsError } = await supabase
      .from('ratings')
      .select('rating');
    if (ratingsError) throw ratingsError;
    const averageRating = ratingsData && ratingsData.length > 0
      ? parseFloat((ratingsData.reduce((sum, r) => sum + r.rating, 0) / ratingsData.length).toFixed(1))
      : 0;

    // Fetch recent rides
    const { data: recentRidesRaw, error: recentRidesError } = await supabase
      .from('rides')
      .select(`
        id,
        pickup_location,
        destination,
        status,
        created_at,
        passenger_profiles:passenger_id(id, full_name, avatar_url, user_type),
        driver_profiles:driver_id(id, full_name, avatar_url, user_type)
      `)
      .order('created_at', { ascending: false })
      .limit(5);
    if (recentRidesError) throw recentRidesError;
    const recentRides = (recentRidesRaw || []).map(formatRideData);

    return {
      totalUsers: usersCount || 0,
      completedRidesCount: completedRidesCountData || 0,
      totalRevenue: calculatedTotalRevenue,
      averageRating: averageRating,
      recentRides: recentRides,
      monthlyRevenueData: sortedMonthlyRevenue,
    };
  },
};

export default supabaseService;