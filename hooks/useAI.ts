import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export type AIStyle = 'witty' | 'professional' | 'playful';
export type AISuggestionType = 'title' | 'description' | 'tags' | 'optimization';

export interface AISuggestion {
  id: string;
  suggestion_type: AISuggestionType;
  original_text: string;
  suggested_text: string;
  confidence_score: number;
  applied: boolean;
  created_at: string;
}

export function useAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSuggestion = async (
    contentId: string,
    type: AISuggestionType,
    text: string,
    style: AIStyle = 'professional'
  ): Promise<AISuggestion | null> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.functions.invoke('ai-suggestions', {
        body: {
          contentId,
          type,
          text,
          style,
        },
      });

      if (error) throw error;

      return data.suggestion;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const applySuggestion = async (suggestionId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('ai_suggestions')
        .update({ applied: true })
        .eq('id', suggestionId);

      if (error) throw error;
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const getSuggestions = async (contentId: string): Promise<AISuggestion[]> => {
    try {
      const { data, error } = await supabase
        .from('ai_suggestions')
        .select('*')
        .eq('content_id', contentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      setError(err.message);
      return [];
    }
  };

  const generateTags = async (title: string, description: string): Promise<string[]> => {
    // Mock tag generation based on content
    const keywords = [...title.toLowerCase().split(' '), ...description.toLowerCase().split(' ')];
    const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'a', 'an'];
    
    const filteredKeywords = keywords
      .filter(word => word.length > 3 && !commonWords.includes(word))
      .slice(0, 5);

    const suggestedTags = [
      ...filteredKeywords,
      'trending',
      'content',
      'social',
    ].slice(0, 6);

    return suggestedTags;
  };

  return {
    loading,
    error,
    generateSuggestion,
    applySuggestion,
    getSuggestions,
    generateTags,
  };
}