import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// رسائل تسجيل للمساعدة في تصحيح الأخطاء
console.log("Supabase Client Init: URL =", supabaseUrl);
console.log("Supabase Client Init: Anon Key =", supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be provided as environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // تمكين استمرارية الجلسة
    storage: localStorage, // استخدام localStorage لتخزين الجلسة
    autoRefreshToken: true, // تمكين التحديث التلقائي للرمز المميز
    detectSessionInUrl: true, // الكشف عن الجلسة في عنوان URL
  },
});