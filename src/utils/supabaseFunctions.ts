import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CreateRidePayload {
  passenger_id: string;
  pickup_location: string;
  destination: string;
  passengers_count: number;
}

export async function createRideViaEdgeFunction(payload: CreateRidePayload): Promise<any | null> {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      toast.error("الرجاء تسجيل الدخول لطلب رحلة.");
      console.error("Error getting session:", sessionError);
      return null;
    }

    // Replace with your actual Supabase Project ID and Edge Function name
    const SUPABASE_PROJECT_ID = "utbimfmafegovypqtdyj"; // From Supabase Context
    const EDGE_FUNCTION_NAME = "create-ride";
    const EDGE_FUNCTION_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/${EDGE_FUNCTION_NAME}`;

    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(payload),
    });

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