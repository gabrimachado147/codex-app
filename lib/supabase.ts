import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xnhuxqnodxomjoqdejgx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhuaHV4cW5vZHhvbWpvcWRlamd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NTY4NTQsImV4cCI6MjA2NzEzMjg1NH0.3Zik9NY4pCsls93J6RpyjaaurQGKKalaXNrsB0JaZsI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Content {
  id: string;
  user_id: string;
  title: string;
  description: string;
  type: 'post' | 'carousel' | 'video' | 'story';
  media: string[];
  tags: string[];
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'published';
  scheduled_at?: string | null;
  published_at?: string | null;
  view_count: number;
  engagement_score: number;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
  created_at: string;
}
