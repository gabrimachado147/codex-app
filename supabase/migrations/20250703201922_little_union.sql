/*
  # Enhanced Content Management System

  1. New Tables
    - `user_roles` - User role management
    - `content_tags` - Tag system for content
    - `content_comments` - Comments and collaboration
    - `content_analytics` - Analytics tracking
    - `scheduled_posts` - Scheduled publishing
    - `ai_suggestions` - AI-generated suggestions

  2. Enhanced Tables
    - Update `contents` table with new fields
    - Add indexes for performance

  3. Security
    - Enable RLS on all tables
    - Add comprehensive policies
*/

-- Create enum types
CREATE TYPE user_role AS ENUM ('admin', 'editor', 'viewer');
CREATE TYPE ai_suggestion_type AS ENUM ('title', 'description', 'tags', 'optimization');

-- Update contents table with new fields
ALTER TABLE contents ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE contents ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
ALTER TABLE contents ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE contents ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE contents ADD COLUMN IF NOT EXISTS engagement_score DECIMAL DEFAULT 0;

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role DEFAULT 'viewer',
  assigned_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Create content_tags table
CREATE TABLE IF NOT EXISTS content_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create content_comments table
CREATE TABLE IF NOT EXISTS content_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES contents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  parent_id UUID REFERENCES content_comments(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create content_analytics table
CREATE TABLE IF NOT EXISTS content_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES contents(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'view', 'like', 'share', 'comment'
  user_id UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create scheduled_posts table
CREATE TABLE IF NOT EXISTS scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES contents(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT CHECK (status IN ('pending', 'published', 'failed')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  published_at TIMESTAMPTZ
);

-- Create ai_suggestions table
CREATE TABLE IF NOT EXISTS ai_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES contents(id) ON DELETE CASCADE,
  suggestion_type ai_suggestion_type NOT NULL,
  original_text TEXT,
  suggested_text TEXT NOT NULL,
  confidence_score DECIMAL DEFAULT 0,
  applied BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;

-- Policies for user_roles
CREATE POLICY "Users can view their own role"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON user_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Policies for content_tags
CREATE POLICY "Everyone can view tags"
  ON content_tags FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Editors and admins can manage tags"
  ON content_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'editor')
    )
  );

-- Policies for content_comments
CREATE POLICY "Users can view comments on accessible content"
  ON content_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM contents c 
      WHERE c.id = content_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create comments on accessible content"
  ON content_comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM contents c 
      WHERE c.id = content_id AND c.user_id = auth.uid()
    )
  );

-- Policies for content_analytics
CREATE POLICY "Users can view analytics for their content"
  ON content_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM contents c 
      WHERE c.id = content_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert analytics"
  ON content_analytics FOR INSERT
  WITH CHECK (true);

-- Policies for scheduled_posts
CREATE POLICY "Users can manage scheduled posts for their content"
  ON scheduled_posts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM contents c 
      WHERE c.id = content_id AND c.user_id = auth.uid()
    )
  );

-- Policies for ai_suggestions
CREATE POLICY "Users can view suggestions for their content"
  ON ai_suggestions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM contents c 
      WHERE c.id = content_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "System can create suggestions"
  ON ai_suggestions FOR INSERT
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contents_tags ON contents USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_contents_scheduled_at ON contents (scheduled_at);
CREATE INDEX IF NOT EXISTS idx_contents_status_created ON contents (status, created_at);
CREATE INDEX IF NOT EXISTS idx_content_comments_content_id ON content_comments (content_id);
CREATE INDEX IF NOT EXISTS idx_content_analytics_content_id ON content_analytics (content_id);
CREATE INDEX IF NOT EXISTS idx_content_analytics_event_type ON content_analytics (event_type);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_at ON scheduled_posts (scheduled_at);

-- Function to update engagement score
CREATE OR REPLACE FUNCTION update_engagement_score()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE contents 
  SET engagement_score = (
    SELECT COALESCE(COUNT(*), 0) * 
    CASE 
      WHEN NEW.event_type = 'view' THEN 1
      WHEN NEW.event_type = 'like' THEN 3
      WHEN NEW.event_type = 'share' THEN 5
      WHEN NEW.event_type = 'comment' THEN 4
      ELSE 1
    END
    FROM content_analytics 
    WHERE content_id = NEW.content_id
  )
  WHERE id = NEW.content_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update engagement score
CREATE TRIGGER update_engagement_score_trigger
  AFTER INSERT ON content_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_engagement_score();

-- Insert default admin role for the first user (you'll need to update this with your user ID)
-- INSERT INTO user_roles (user_id, role) 
-- VALUES ('your-user-id-here', 'admin')
-- ON CONFLICT (user_id) DO NOTHING;