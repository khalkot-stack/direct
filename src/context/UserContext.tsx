"use client";

import React,
{
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
import supabaseService from "@/services/supabaseService"; // Import the new service

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
    try {
      let userProfile = await supabaseService.getUserProfile(userId);

      if (userProfile) {
        setProfile(userProfile);
      } else {
        // If no profile found, create a default one
        const { data: userData } = await supabase.auth.getUser();
        const currentUser = userData.user;

        if (currentUser) {
          const defaultFullName =
            currentUser.user_metadata.full_name ||
            currentUser.email?.split("@")[0] ||
            "مستخدم جديد";
          const defaultUserType =
            currentUser.app_metadata.user_type || "passenger";
          const defaultStatus = currentUser.app_metadata.status || "active";
          const defaultPhoneNumber = currentUser.user_metadata.phone_number || null;
          const defaultAvatarUrl = currentUser.user_metadata.avatar_url || null;

          const newProfile = await supabaseService.createProfile({
            id: currentUser.id,
            full_name: defaultFullName,
            email: currentUser.email!, // Email is guaranteed to exist for a signed-in user
            user_type: defaultUserType,
            status: defaultStatus,
            phone_number: defaultPhoneNumber,
            avatar_url: defaultAvatarUrl,
          });
          setProfile(newProfile);
        }
      }
    } catch (error) {
      console.error("UserContext: Error in fetchUserProfile:", error);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    if (isInitialLoadHandled.current) {
      return;
    }
    isInitialLoadHandled.current = true;

    let authListenerSubscription: { unsubscribe: () => void } | null = null;

    const setupAuth = async () => {
      const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("UserContext: Error fetching initial session:", sessionError);
      }
      setSession(initialSession);
      setUser(initialSession?.user || null);
      console.log("UserContext: Initial session user:", initialSession?.user?.id, "App Metadata:", initialSession?.user?.app_metadata);


      if (initialSession?.user) {
        await fetchUserProfile(initialSession.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);

      const { data } = supabase.auth.onAuthStateChange(
        async (_event, currentSession) => {
          if (_event === 'TOKEN_REFRESHED') {
            console.log('UserContext: Supabase token refreshed!');
          }
          setSession(currentSession);
          setUser(currentSession?.user || null);
          console.log("UserContext: Auth state changed - Event:", _event, "User ID:", currentSession?.user?.id, "App Metadata:", currentSession?.user?.app_metadata);

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