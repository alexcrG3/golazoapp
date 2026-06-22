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

const minifySession = (valueStr: string): string => {
  try {
    const session = JSON.parse(valueStr);
    if (session && session.access_token && session.refresh_token) {
      const minified: any = {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
        expires_in: session.expires_in,
        token_type: session.token_type,
      };
      if (session.user) {
        minified.user = {
          id: session.user.id,
          email: session.user.email,
          aud: session.user.aud || "authenticated",
          role: session.user.role || "authenticated",
          app_metadata: session.user.app_metadata || {},
          user_metadata: session.user.user_metadata || {},
        };
      }
      return JSON.stringify(minified);
    }
  } catch (e) {
    console.warn("[Cookie Sync] Error minificando sesión para cookies:", e);
  }
  return valueStr;
};

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
      let cookieValue = value;
      if (key.startsWith("sb-") && key.endsWith("-auth-token")) {
        cookieValue = minifySession(value);
      }
      const date = new Date();
      date.setTime(date.getTime() + (365 * 24 * 60 * 60 * 1000));
      const isHttps = window.location.protocol === "https:";
      const secureAttr = isHttps ? "; Secure" : "";
      document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(cookieValue)}; expires=${date.toUTCString()}; path=/; SameSite=Lax${secureAttr}`;
    } catch {}
  },
  removeItem: (key: string): void => {
    if (typeof window === "undefined") return;
    try { localStorage.removeItem(key); } catch {}
    try {
      const isHttps = window.location.protocol === "https:";
      const secureAttr = isHttps ? "; Secure" : "";
      document.cookie = `${encodeURIComponent(key)}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax${secureAttr}`;
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

