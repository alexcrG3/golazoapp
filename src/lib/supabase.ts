import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (
  import.meta.env.VITE_SUPABASE_URL ||
  (typeof process !== "undefined" ? process.env.VITE_SUPABASE_URL : "") ||
  ""
).trim();

// Clean up any trailing /rest/v1/ from the user's .env URL configuration
const cleanUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, "");

const supabaseAnonKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  (typeof process !== "undefined" ? process.env.VITE_SUPABASE_ANON_KEY : "") ||
  ""
).trim();

if (!cleanUrl || !supabaseAnonKey) {
  console.warn(
    "[Supabase] Advertencia: VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY no están configurados en el archivo .env"
  );
}

export const supabase = createClient(cleanUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
