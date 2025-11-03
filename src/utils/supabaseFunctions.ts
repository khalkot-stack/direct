import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CreateRidePayload {
  passenger_id: string;
  pickup_location: string;
  destination: string;
  passengers_count: number;
}

export async function createRideViaEdgeFunction(payload: CreateRidePayload): Promise<any | null> {
  const SUPABASE_PROJECT_ID = "utbimfmafegovypqtdyj"; // From Supabase Context
  const EDGE_FUNCTION_NAME = "create-ride";
  const EDGE_FUNCTION_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/${EDGE_FUNCTION_NAME}`;

  const callEdgeFunction = async (accessToken: string) => {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });
    return response;
  };

  try {
    let { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      toast.error("الرجاء تسجيل الدخول لطلب رحلة.");
      console.error("Error getting session:", sessionError);
      return null;
    }

    let response = await callEdgeFunction(session.access_token);

    // If 403 Forbidden, try to refresh session and retry once
    if (response.status === 403) {
      console.warn("Received 403 from Edge Function. Attempting to refresh session and retry...");
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

      if (refreshError || !refreshData.session) {
        toast.error(`فشل تحديث الجلسة: ${refreshError?.message || 'لا توجد جلسة جديدة.'}`);
        console.error("Error refreshing session:", refreshError);
        return null;
      }

      session = refreshData.session; // Use the new session
      response = await callEdgeFunction(session.access_token); // Retry the call
    }

    if (!response.ok) {
      const errorData = await response.json();
      toast.error(`فشل طلب الرحلة: ${errorData.error || response.statusText}`);
      console.error("Edge Function error response:", errorData);
      return null;
    }

    const data = await response.json();
    toast.success("تم طلب الرحلة بنجاح!");
    return data;

  } catch (error: any) {
    toast.error(`حدث خطأ غير متوقع: ${error.message}`);
    console.error("Unexpected error calling Edge Function:", error);
    return null;
  }
}