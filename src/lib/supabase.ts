/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Sanitizar URL: Si incluye /rest/v1/, lo removemos para que supabase-js funcione correctamente
if (supabaseUrl.includes('/rest/v1/')) {
  supabaseUrl = supabaseUrl.split('/rest/v1/')[0];
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL o Anon Key no configurados. Las funciones en la nube estarán deshabilitadas.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
