import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface AnalyticsData {
  totalContents: number;
  publishedContents: number;
  draftContents: number;
  pendingContents: number;
  totalViews: number;
  avgEngagement: number;
  postsPerDay: { date: string; count: number }[];
  statusDistribution: { status: string; count: number }[];
  topTags: { tag: string; count: number }[];
}

export function useAnalytics() {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch basic content stats
      const { data: contents, error: contentsError } = await supabase
        .from('contents')
        .select('status, created_at, view_count, engagement_score, tags')
        .eq('user_id', user?.id);

      if (contentsError) throw contentsError;

      // Calculate basic metrics
      const totalContents = contents?.length || 0;
      const publishedContents = contents?.filter(c => c.status === 'published').length || 0;
      const draftContents = contents?.filter(c => c.status === 'draft').length || 0;
      const pendingContents = contents?.filter(c => c.status === 'pending_approval').length || 0;
      const totalViews = contents?.reduce((sum, c) => sum + (c.view_count || 0), 0) || 0;
      const avgEngagement = contents?.reduce((sum, c) => sum + (c.engagement_score || 0), 0) / totalContents || 0;

      // Posts per day (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const postsPerDay = [];
      for (let i = 0; i < 30; i++) {
        const date = new Date(thirtyDaysAgo);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        
        const count = contents?.filter(c => 
          c.created_at.startsWith(dateStr)
        ).length || 0;
        
        postsPerDay.push({ date: dateStr, count });
      }

      // Status distribution
      const statusDistribution = [
        { status: 'published', count: publishedContents },
        { status: 'draft', count: draftContents },
        { status: 'pending_approval', count: pendingContents },
      ];

      // Top tags
      const tagCounts: { [key: string]: number } = {};
      contents?.forEach(content => {
        content.tags?.forEach((tag: string) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });

      const topTags = Object.entries(tagCounts)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      setData({
        totalContents,
        publishedContents,
        draftContents,
        pendingContents,
        totalViews,
        avgEngagement,
        postsPerDay,
        statusDistribution,
        topTags,
      });

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const trackEvent = async (contentId: string, eventType: string, metadata?: any) => {
    try {
      await supabase
        .from('content_analytics')
        .insert({
          content_id: contentId,
          event_type: eventType,
          user_id: user?.id,
          metadata: metadata || {}
        });
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  };

  return {
    data,
    loading,
    error,
    refetch: fetchAnalytics,
    trackEvent,
  };
}
