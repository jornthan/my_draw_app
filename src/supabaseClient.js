import { createClient } from '@supabase/supabase-js';

// import.meta.env는 .env 파일에 적힌 값을 가져오는 특수한 명령어입니다.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);