/*
  # Status History Tracking

  Adds table and functions to track status changes for contents.
*/

-- Table to store status change history
CREATE TABLE IF NOT EXISTS content_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid REFERENCES contents(id) ON DELETE CASCADE,
  status content_status NOT NULL,
  changed_at timestamptz DEFAULT now()
);

-- Function to record status changes
CREATE OR REPLACE FUNCTION record_status_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO content_status_history (content_id, status, changed_at)
  VALUES (NEW.id, NEW.status, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Log initial status on insert
CREATE TRIGGER contents_initial_status
  AFTER INSERT ON contents
  FOR EACH ROW EXECUTE FUNCTION record_status_change();

-- Log status updates
CREATE TRIGGER contents_status_change
  AFTER UPDATE OF status ON contents
  FOR EACH ROW WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION record_status_change();

-- Calculate time spent in each status
CREATE OR REPLACE FUNCTION calculate_status_time(p_content_id uuid)
RETURNS TABLE(status content_status, duration interval) AS $$
  SELECT
    status,
    COALESCE(LEAD(changed_at) OVER (ORDER BY changed_at), NOW()) - changed_at AS duration
  FROM content_status_history
  WHERE content_id = p_content_id
  ORDER BY changed_at;
$$ LANGUAGE SQL STABLE;
