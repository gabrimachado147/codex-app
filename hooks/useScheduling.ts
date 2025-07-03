import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface ScheduledPost {
  id: string;
  content_id: string;
  scheduled_at: string;
  status: 'pending' | 'published' | 'failed';
  created_at: string;
  published_at?: string;
  content?: {
    title: string;
    description: string;
    type: string;
  };
}

export function useScheduling() {
  const { user } = useAuth();
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchScheduledPosts();
    }
  }, [user]);

  const fetchScheduledPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('scheduled_posts')
        .select(`
          *,
          contents (
            title,
            description,
            type
          )
        `)
        .eq('contents.user_id', user?.id)
        .order('scheduled_at', { ascending: true });

      if (error) throw error;
      setScheduledPosts(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const schedulePost = async (contentId: string, scheduledAt: Date): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // Update content with scheduled_at
      const { error: contentError } = await supabase
        .from('contents')
        .update({ 
          scheduled_at: scheduledAt.toISOString(),
          status: 'pending_approval'
        })
        .eq('id', contentId);

      if (contentError) throw contentError;

      // Create scheduled post entry
      const { error: scheduleError } = await supabase
        .from('scheduled_posts')
        .insert({
          content_id: contentId,
          scheduled_at: scheduledAt.toISOString(),
          status: 'pending'
        });

      if (scheduleError) throw scheduleError;

      await fetchScheduledPosts();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const cancelScheduledPost = async (scheduledPostId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // Get the scheduled post to find content_id
      const { data: scheduledPost, error: fetchError } = await supabase
        .from('scheduled_posts')
        .select('content_id')
        .eq('id', scheduledPostId)
        .single();

      if (fetchError) throw fetchError;

      // Update content status back to draft
      const { error: contentError } = await supabase
        .from('contents')
        .update({ 
          scheduled_at: null,
          status: 'draft'
        })
        .eq('id', scheduledPost.content_id);

      if (contentError) throw contentError;

      // Delete scheduled post entry
      const { error: deleteError } = await supabase
        .from('scheduled_posts')
        .delete()
        .eq('id', scheduledPostId);

      if (deleteError) throw deleteError;

      await fetchScheduledPosts();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const reschedulePost = async (scheduledPostId: string, newDate: Date): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // Update scheduled post
      const { error } = await supabase
        .from('scheduled_posts')
        .update({ 
          scheduled_at: newDate.toISOString(),
          status: 'pending'
        })
        .eq('id', scheduledPostId);

      if (error) throw error;

      await fetchScheduledPosts();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    scheduledPosts,
    loading,
    error,
    schedulePost,
    cancelScheduledPost,
    reschedulePost,
    refetch: fetchScheduledPosts,
  };
}