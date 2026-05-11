import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// detectSessionInUrl is enabled by default to support OAuth redirects
export const supabase = createClient(supabaseUrl, supabaseKey);
