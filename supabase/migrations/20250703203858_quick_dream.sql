/*
  # Enhanced Content Management System Schema

  1. New Tables
    - Enhanced `contents` table with additional fields for analytics and scheduling
    - `content_analytics` for tracking user interactions and engagement
    - `ai_suggestions` for storing AI-generated content suggestions
    - `scheduled_posts` for managing scheduled content publishing
    - `content_comments` for user collaboration and feedback
    - `user_roles` for role-based access control

  2. Security
    - Enable RLS on all tables
    - Add comprehensive policies for data access control
    - Ensure users can only access their own content and related data

  3. Performance
    - Add indexes for frequently queried columns
    - Optimize for dashboard and analytics queries

  4. Automation
    - Triggers for updating timestamps
    - Automatic user role creation on signup
*/

-- Create enum types only if they don't exist
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'editor', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enhanced contents table (drop and recreate if exists to ensure all columns)
DROP TABLE IF EXISTS contents CASCADE;
CREATE TABLE contents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  type content_type DEFAULT 'post',
  media jsonb DEFAULT '[]'::jsonb,
  tags text[] DEFAULT '{}',
  status content_status DEFAULT 'draft',
  scheduled_at timestamptz,
  published_at timestamptz,
  view_count integer DEFAULT 0,
  engagement_score real DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Content analytics table
CREATE TABLE IF NOT EXISTS content_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid REFERENCES contents(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- AI suggestions table
CREATE TABLE IF NOT EXISTS ai_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid REFERENCES contents(id) ON DELETE CASCADE,
  suggestion_type text NOT NULL,
  original_text text,
  suggested_text text NOT NULL,
  confidence_score real DEFAULT 0,
  applied boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Scheduled posts table
CREATE TABLE IF NOT EXISTS scheduled_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid REFERENCES contents(id) ON DELETE CASCADE,
  scheduled_at timestamptz NOT NULL,
  status text DEFAULT 'pending',
  published_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Content comments table
CREATE TABLE IF NOT EXISTS content_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid REFERENCES contents(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  comment text NOT NULL,
  parent_id uuid REFERENCES content_comments(id),
  created_at timestamptz DEFAULT now()
);

-- User roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  role user_role DEFAULT 'viewer',
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own contents" ON contents;
DROP POLICY IF EXISTS "Users can insert their own contents" ON contents;
DROP POLICY IF EXISTS "Users can update their own contents" ON contents;
DROP POLICY IF EXISTS "Users can delete their own contents" ON contents;

-- RLS Policies for contents
CREATE POLICY "Users can view their own contents"
  ON contents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contents"
  ON contents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contents"
  ON contents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contents"
  ON contents FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for content_analytics
CREATE POLICY "Users can view analytics for their contents"
  ON content_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM contents 
      WHERE contents.id = content_analytics.content_id 
      AND contents.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can insert analytics"
  ON content_analytics FOR INSERT
  WITH CHECK (true);

-- RLS Policies for ai_suggestions
CREATE POLICY "Users can view suggestions for their contents"
  ON ai_suggestions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM contents 
      WHERE contents.id = ai_suggestions.content_id 
      AND contents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert suggestions for their contents"
  ON ai_suggestions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contents 
      WHERE contents.id = ai_suggestions.content_id 
      AND contents.user_id = auth.uid()
    )
  );

-- RLS Policies for scheduled_posts
CREATE POLICY "Users can view their scheduled posts"
  ON scheduled_posts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM contents 
      WHERE contents.id = scheduled_posts.content_id 
      AND contents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their scheduled posts"
  ON scheduled_posts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM contents 
      WHERE contents.id = scheduled_posts.content_id 
      AND contents.user_id = auth.uid()
    )
  );

-- RLS Policies for content_comments
CREATE POLICY "Users can view comments on their contents"
  ON content_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM contents 
      WHERE contents.id = content_comments.content_id 
      AND contents.user_id = auth.uid()
    ) OR auth.uid() = user_id
  );

CREATE POLICY "Authenticated users can insert comments"
  ON content_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own role"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Functions and triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_contents_updated_at ON contents;
CREATE TRIGGER update_contents_updated_at 
  BEFORE UPDATE ON contents 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create user role on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_roles (user_id, role)
  VALUES (NEW.id, 'viewer')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_contents_user_id ON contents(user_id);
CREATE INDEX IF NOT EXISTS idx_contents_status ON contents(status);
CREATE INDEX IF NOT EXISTS idx_contents_created_at ON contents(created_at);
CREATE INDEX IF NOT EXISTS idx_contents_tags ON contents USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_contents_scheduled_at ON contents(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_content_analytics_content_id ON content_analytics(content_id);
CREATE INDEX IF NOT EXISTS idx_content_analytics_event_type ON content_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_at ON scheduled_posts(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_content_comments_content_id ON content_comments(content_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);

-- Function to update engagement score based on analytics
CREATE OR REPLACE FUNCTION update_engagement_score()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE contents 
  SET engagement_score = (
    SELECT COALESCE(
      SUM(
        CASE 
          WHEN event_type = 'view' THEN 1
          WHEN event_type = 'like' THEN 3
          WHEN event_type = 'share' THEN 5
          WHEN event_type = 'comment' THEN 4
          ELSE 1
        END
      ), 0
    )
    FROM content_analytics 
    WHERE content_id = NEW.content_id
  )
  WHERE id = NEW.content_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update engagement score when analytics are added
DROP TRIGGER IF EXISTS update_engagement_score_trigger ON content_analytics;
CREATE TRIGGER update_engagement_score_trigger
  AFTER INSERT ON content_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_engagement_score();