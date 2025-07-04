/*
  # Add Content Status History

  1. New Tables
    - `content_status_history`
      - `id` (uuid, primary key)
      - `content_id` (uuid, foreign key to contents)
      - `from_status` (content_status, nullable for initial status)
      - `to_status` (content_status, required)
      - `changed_at` (timestamp)
      - `user_id` (uuid, foreign key to auth.users)

  2. Security
    - Enable RLS on `content_status_history` table
    - Add policies for users to view/insert history for their own content

  3. Functions
    - `calculate_status_time()` - Calculate time spent in each status
    - `log_content_status_change()` - Trigger function to auto-log status changes

  4. Triggers
    - `on_content_status_change` - Automatically log status changes on contents table
*/

-- Clean up any previous implementation
DROP TRIGGER IF EXISTS contents_initial_status ON public.contents;
DROP TRIGGER IF EXISTS contents_status_change ON public.contents;
DROP FUNCTION IF EXISTS record_status_change();
DROP FUNCTION IF EXISTS calculate_status_time(uuid);
DROP TABLE IF EXISTS public.content_status_history CASCADE;

-- Tabela para armazenar o histórico de mudanças de status
CREATE TABLE IF NOT EXISTS public.content_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL REFERENCES public.contents(id) ON DELETE CASCADE,
  from_status content_status,
  to_status content_status NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  CONSTRAINT content_status_history_content_id_fkey FOREIGN KEY (content_id)
    REFERENCES public.contents (id) MATCH SIMPLE
    ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT content_status_history_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES auth.users (id) MATCH SIMPLE
    ON UPDATE NO ACTION ON DELETE SET NULL
);

-- Habilitar Row Level Security
ALTER TABLE public.content_status_history ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança para a tabela de histórico
CREATE POLICY "Users can view history for their own contents"
  ON public.content_status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM contents
      WHERE contents.id = content_status_history.content_id
      AND contents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert history for their own contents"
  ON public.content_status_history FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contents
      WHERE contents.id = content_status_history.content_id
      AND contents.user_id = auth.uid()
    )
  );

-- Índices para otimizar queries
CREATE INDEX IF NOT EXISTS idx_content_status_history_content_id ON public.content_status_history(content_id);
CREATE INDEX IF NOT EXISTS idx_content_status_history_to_status ON public.content_status_history(to_status);

-- Função para calcular a duração em cada status
CREATE OR REPLACE FUNCTION public.calculate_status_time(target_content_id uuid)
RETURNS TABLE(status text, total_duration interval, status_changes bigint)
LANGUAGE 'plpgsql'
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    csh.to_status::text as status,
    COALESCE(
      SUM(
        CASE
          WHEN lead(csh.changed_at) OVER (
            PARTITION BY csh.content_id
            ORDER BY csh.changed_at
          ) IS NOT NULL
          THEN lead(csh.changed_at) OVER (
            PARTITION BY csh.content_id
            ORDER BY csh.changed_at
          ) - csh.changed_at
          ELSE NOW() - csh.changed_at
        END
      ),
      INTERVAL '0'
    ) as total_duration,
    COUNT(*) as status_changes
  FROM public.content_status_history csh
  WHERE csh.content_id = target_content_id
  GROUP BY csh.to_status
  ORDER BY total_duration DESC;
END;
$$;

-- Trigger para popular a tabela de histórico automaticamente
-- Primeiro, a função do trigger
CREATE OR REPLACE FUNCTION public.log_content_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Insere no histórico apenas se o status realmente mudou
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.content_status_history (content_id, from_status, to_status, user_id)
        VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Agora, o trigger na tabela 'contents'
CREATE TRIGGER on_content_status_change
  AFTER UPDATE OF status ON public.contents
  FOR EACH ROW
  EXECUTE FUNCTION public.log_content_status_change();