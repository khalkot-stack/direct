"use client";

import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
  useRef,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";
import { Profile } from "@/types/supabase";

interface UserContextType {
  user: SupabaseUser | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  fetchUserProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const isInitialLoadHandled = useRef(false);

  const fetchUserProfile = useCallback(async (userId: string) => {
    console.log("UserContext: Attempting to fetch profile for userId:", userId);
    const { data, error, status } = await supabase
      .from("profiles")
      .select(
        "id, full_name, email, user_type, status, phone_number, avatar_url, created_at"
      )
      .eq("id", userId)
      .single();

    if (error && status !== 406) {
      console.error("UserContext: Error fetching profile:", error);
      setProfile(null);
    } else if (data) {
      console.log("UserContext: Profile fetched successfully:", data);
      console.log("UserContext: Fetched profile user_type:", data.user_type); // Added log
      setProfile(data as Profile);
    } else {
      console.log("UserContext: No profile found, attempting to create default for userId:", userId);
      const { data: userData } = await supabase.auth.getUser();
      const currentUser = userData.user;

      if (currentUser) {
        const defaultFullName =
          currentUser.user_metadata.full_name ||
          currentUser.email?.split("@")[0] ||
          "مستخدم جديد";
        const defaultUserType =
          currentUser.user_metadata.user_type || "passenger";
        const defaultStatus = currentUser.user_metadata.status || "active";
        const defaultPhoneNumber = currentUser.user_metadata.phone_number || null;
        const defaultAvatarUrl = currentUser.user_metadata.avatar_url || null;

        const { data: newProfile, error: insertError } = await supabase
          .from("profiles")
          .insert({
            id: currentUser.id,
            full_name: defaultFullName,
            email: currentUser.email,
            user_type: defaultUserType,
            status: defaultStatus,
            phone_number: defaultPhoneNumber,
            avatar_url: defaultAvatarUrl,
          })
          .select()
          .single();

        if (insertError) {
          console.error("UserContext: Error creating default profile:", insertError);
        } else {
          console.log("UserContext: Default profile created:", newProfile);
          console.log("UserContext: Created profile user_type:", (newProfile as Profile).user_type); // Added log
          setProfile(newProfile as Profile);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (isInitialLoadHandled.current) {
      return;
    }
    isInitialLoadHandled.current = true;

    let authListenerSubscription: { unsubscribe: () => void } | null = null;

    const setupAuth = async () => {
      console.log("UserContext: Initializing authentication setup.");
      const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("UserContext: Error fetching initial session:", sessionError);
      }
      setSession(initialSession);
      setUser(initialSession?.user || null);
      console.log("UserContext: Initial session user:", initialSession?.user?.id);

      if (initialSession?.user) {
        await fetchUserProfile(initialSession.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
      console.log("UserContext: Initial loading complete. User:", initialSession?.user?.id ? "Logged In" : "Logged Out");

      const { data } = supabase.auth.onAuthStateChange(
        async (_event, currentSession) => {
          console.log("UserContext: Auth state changed. Event:", _event, "User:", currentSession?.user?.id);
          setSession(currentSession);
          setUser(currentSession?.user || null);
          if (currentSession?.user) {
            await fetchUserProfile(currentSession.user.id);
          } else {
            setProfile(null);
          }
        }
      );
      authListenerSubscription = data.subscription;
    };

    setupAuth();

    return () => {
      if (authListenerSubscription) {
        console.log("UserContext: Unsubscribing from auth listener.");
        authListenerSubscription.unsubscribe();
      }
    };
  }, [fetchUserProfile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">جاري تحميل التطبيق...</span>
      </div>
    );
  }

  return (
    <UserContext.Provider value={{ user, profile, session, loading, fetchUserProfile: () => fetchUserProfile(user?.id || '') }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};