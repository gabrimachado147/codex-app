// eslint-disable-next-line import/no-unresolved
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all scheduled posts that are due
    const now = new Date().toISOString();
    const { data: scheduledPosts, error: fetchError } = await supabase
      .from('scheduled_posts')
      .select(`
        id,
        content_id,
        scheduled_at,
        contents (
          id,
          title,
          user_id
        )
      `)
      .eq('status', 'pending')
      .lte('scheduled_at', now);

    if (fetchError) {
      throw fetchError;
    }

    const results = [];

    for (const post of scheduledPosts || []) {
      try {
        // Update content status to published
        const { error: updateError } = await supabase
          .from('contents')
          .update({ 
            status: 'published',
            published_at: new Date().toISOString()
          })
          .eq('id', post.content_id);

        if (updateError) {
          throw updateError;
        }

        // Update scheduled post status
        const { error: scheduleError } = await supabase
          .from('scheduled_posts')
          .update({ 
            status: 'published',
            published_at: new Date().toISOString()
          })
          .eq('id', post.id);

        if (scheduleError) {
          throw scheduleError;
        }

        results.push({
          id: post.id,
          content_id: post.content_id,
          status: 'success'
        });

      } catch (error) {
        // Mark as failed
        await supabase
          .from('scheduled_posts')
          .update({ status: 'failed' })
          .eq('id', post.id);

        results.push({
          id: post.id,
          content_id: post.content_id,
          status: 'failed',
          error: error.message
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: results.length,
        results 
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