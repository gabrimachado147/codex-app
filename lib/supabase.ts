import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xnhuxqnodxomjoqdejgx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhuaHV4cW5vZHhvbWpvcWRlamd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NTY4NTQsImV4cCI6MjA2NzEzMjg1NH0.3Zik9NY4pCsls93J6RpyjaaurQGKKalaXNrsB0JaZsI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Content {
  id: string;
  user_id: string;
  title: string;
  description: string;
  type: 'post' | 'story' | 'video';
  media: string[];
  status: 'draft' | 'published' | 'review';
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
  created_at: string;
}