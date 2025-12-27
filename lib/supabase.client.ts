import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("[supabase env] url:", url);
console.log("[supabase env] key head:", key?.slice(0,20));
export const supabase = createClient(url!,key!);