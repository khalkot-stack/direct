export interface Profile {
  id: string;
  full_name: string | null; // Changed to allow null
  email: string;
  user_type: "passenger" | "driver" | "admin";
  status: "active" | "suspended" | "banned";
  phone_number: string | null; // Changed to allow null
  avatar_url: string | null; // Changed to allow null
  created_at: string;
}

export interface ProfileDetails {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  // Removed user_type as it's not consistently selected in joins
}

export interface Ride {
  id: string;
  passenger_id: string;
  driver_id: string | null;
  pickup_location: string;
  destination: string;
  passengers_count: number;
  status: "pending" | "accepted" | "completed" | "cancelled";
  created_at: string;
  cancellation_reason: string | null;
  pickup_lat: number | null;
  pickup_lng: number | null;
  destination_lat: number | null;
  destination_lng: number | null;
  driver_current_lat: number | null;
  driver_current_lng: number | null;
  passenger_profiles: ProfileDetails | null;
  driver_profiles: ProfileDetails | null;
}

// New interface to handle raw data from Supabase joins where profiles might be arrays
export interface RawRideData extends Omit<Ride, 'passenger_profiles' | 'driver_profiles'> {
  passenger_profiles: ProfileDetails[] | ProfileDetails | null;
  driver_profiles: ProfileDetails[] | ProfileDetails | null;
}

export interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_profiles: ProfileDetails | null;
  receiver_profiles: ProfileDetails | null;
}

// New interface to handle raw data from Supabase joins for messages where profiles might be arrays
export interface SupabaseJoinedMessageData extends Omit<Message, 'sender_profiles' | 'receiver_profiles'> {
  sender_profiles: ProfileDetails | ProfileDetails[] | null;
  receiver_profiles: ProfileDetails | ProfileDetails[] | null;
}

export interface Rating {
  id: string;
  ride_id: string;
  rater_id: string;
  rated_user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  theme: string;
  notifications_enabled: boolean;
  language: string;
}

export interface SystemSetting {
  id: string;
  key: string;
  value: string;
  description?: string;
}