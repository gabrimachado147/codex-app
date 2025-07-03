import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AIRequest {
  contentId: string;
  type: 'title' | 'description' | 'tags' | 'optimization';
  text: string;
  style?: 'witty' | 'professional' | 'playful';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { contentId, type, text, style = 'professional' }: AIRequest = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let suggestion = '';
    let confidence = 0.8;

    // Mock AI suggestions (replace with actual OpenAI API calls)
    switch (type) {
      case 'title':
        const titlePrompts = {
          witty: ['Clever twist on', 'Witty take on', 'Smart spin on'],
          professional: ['Professional guide to', 'Expert insights on', 'Complete overview of'],
          playful: ['Fun facts about', 'Playful exploration of', 'Exciting journey through']
        };
        suggestion = `${titlePrompts[style][Math.floor(Math.random() * 3)]} ${text.slice(0, 30)}...`;
        break;

      case 'description':
        const descPrompts = {
          witty: 'A cleverly crafted piece that will make you think twice about everything you thought you knew. 🧠✨',
          professional: 'A comprehensive analysis providing valuable insights and actionable recommendations for professionals.',
          playful: 'Get ready for an adventure! This content will take you on a fun-filled journey of discovery! 🚀🎉'
        };
        suggestion = descPrompts[style];
        break;

      case 'tags':
        const commonTags = ['trending', 'viral', 'educational', 'inspiring', 'creative', 'innovative'];
        suggestion = commonTags.slice(0, 3).join(', ');
        break;

      case 'optimization':
        const issues = [];
        if (text.length < 10) issues.push('Content too short');
        if (text.length > 500) issues.push('Content might be too long');
        if (!text.includes(' ')) issues.push('Consider adding more descriptive words');
        
        suggestion = issues.length > 0 
          ? `Suggestions: ${issues.join(', ')}`
          : 'Content looks great! No optimization needed.';
        confidence = issues.length > 0 ? 0.9 : 0.7;
        break;
    }

    // Save suggestion to database
    const { data, error } = await supabase
      .from('ai_suggestions')
      .insert({
        content_id: contentId,
        suggestion_type: type,
        original_text: text,
        suggested_text: suggestion,
        confidence_score: confidence
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        suggestion: data 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});