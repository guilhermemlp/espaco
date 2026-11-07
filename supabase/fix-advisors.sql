-- =========================================================================
-- REPARO DOS AVISOS DO SUPABASE ADVISORS
-- Execute no SQL Editor do Supabase depois de aplicar supabase/schema.sql.
-- É idempotente: pode ser executado mais de uma vez.
-- =========================================================================

-- 1) recovery_activities: garantir RLS + política por usuário
ALTER TABLE public.recovery_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso próprias atividades" ON public.recovery_activities;
CREATE POLICY "Acesso próprias atividades" ON public.recovery_activities
    FOR ALL
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

-- 2) behavior_categories_user_id_fkey: índice de cobertura
-- Cobre tanto o aviso "Unindexed foreign key" quanto consultas por usuário.
CREATE INDEX IF NOT EXISTS idx_behavior_categories_user
    ON public.behavior_categories (user_id);

-- 3) Conferência rápida (opcional)
-- Lista as políticas da tabela de atividades.
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'recovery_activities';

-- Lista os índices da tabela de categorias.
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'behavior_categories';
