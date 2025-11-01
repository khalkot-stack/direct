"use client";

import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
  useRef, // Import useRef
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
  const isInitialLoadHandled = useRef(false); // To prevent double-handling in Strict Mode

  console.log("UserProvider: Initializing, loading =", loading);

  const fetchUserProfile = useCallback(async (userId: string) => {
    console.log("fetchUserProfile: Starting for userId =", userId);
    const { data, error, status } = await supabase
      .from("profiles")
      .select(
        "id, full_name, email, user_type, status, phone_number, avatar_url, created_at"
      )
      .eq("id", userId)
      .single();

    if (error && status !== 406) { // PGRST116 means no rows found
      console.error("fetchUserProfile: Error fetching profile:", error);
      setProfile(null);
    } else if (data) {
      console.log("fetchUserProfile: Profile data received:", data);
      setProfile(data as Profile);
    } else {
      console.log("fetchUserProfile: No profile found, attempting to create default.");
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
          console.error("fetchUserProfile: Error creating default profile:", insertError);
        } else {
          console.log("fetchUserProfile: Default profile created:", newProfile);
          setProfile(newProfile as Profile);
        }
      }
    }
    console.log("fetchUserProfile: Finished.");
  }, []);

  useEffect(() => {
    // This ref ensures the effect runs only once per "real" mount, ignoring Strict Mode double-invocations
    if (isInitialLoadHandled.current) {
      return;
    }
    isInitialLoadHandled.current = true;

    console.log("UserProvider useEffect: Setting up auth listener.");
    let authListenerSubscription: { unsubscribe: () => void } | null = null;

    const setupAuth = async () => {
      // 1. Get initial session
      console.log("setupAuth: Getting initial session.");
      const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("setupAuth: Error fetching initial session:", sessionError);
      }
      console.log("setupAuth: Initial session data =", initialSession);
      setSession(initialSession);
      setUser(initialSession?.user || null);

      if (initialSession?.user) {
        await fetchUserProfile(initialSession.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false); // Set loading to false after initial load

      // 2. Set up auth state change listener
      console.log("setupAuth: Setting up onAuthStateChange listener.");
      const { data } = supabase.auth.onAuthStateChange(
        async (_event, currentSession) => {
          console.log("onAuthStateChange: Event received, _event =", _event, "currentSession =", currentSession);
          setSession(currentSession);
          setUser(currentSession?.user || null);
          if (currentSession?.user) {
            await fetchUserProfile(currentSession.user.id);
          } else {
            setProfile(null);
          }
          // No need to set loading here, it's already false after initial load
          console.log("onAuthStateChange: User/profile updated.");
        }
      );
      authListenerSubscription = data.subscription;
    };

    setupAuth();

    return () => {
      console.log("UserProvider useEffect: Cleaning up auth listener.");
      if (authListenerSubscription) {
        authListenerSubscription.unsubscribe();
      }
      // Removed: isInitialLoadHandled.current = false; to prevent re-running in StrictMode
    };
  }, [fetchUserProfile]); // fetchUserProfile is a dependency because it's called inside setupAuth

  if (loading) {
    console.log("UserProvider: Rendering loading spinner.");
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">جاري تحميل التطبيق...</span>
      </div>
    );
  }

  console.log("UserProvider: Rendering children, user =", user?.id, "profile =", profile?.id);
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