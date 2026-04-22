/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL o Anon Key no configurados. Las funciones en la nube estarán deshabilitadas.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
