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

const hybridStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === "undefined") return null;
    try {
      const val = localStorage.getItem(key);
      if (val) return val;
    } catch {}
    try {
      const name = encodeURIComponent(key) + "=";
      const ca = document.cookie.split(";");
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i].trim();
        if (c.indexOf(name) === 0) {
          const val = decodeURIComponent(c.substring(name.length, c.length));
          try { localStorage.setItem(key, val); } catch {}
          return val;
        }
      }
    } catch {}
    return null;
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === "undefined") return;
    try { localStorage.setItem(key, value); } catch {}
    try {
      const date = new Date();
      date.setTime(date.getTime() + (365 * 24 * 60 * 60 * 1000));
      document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)}; expires=${date.toUTCString()}; path=/; SameSite=Lax; Secure`;
    } catch {}
  },
  removeItem: (key: string): void => {
    if (typeof window === "undefined") return;
    try { localStorage.removeItem(key); } catch {}
    try {
      document.cookie = `${encodeURIComponent(key)}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax; Secure`;
    } catch {}
  }
};

export const supabase = createClient(cleanUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: hybridStorage,
  },
});

