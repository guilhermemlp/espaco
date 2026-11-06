-- =========================================================================
-- BANCO DE DADOS ESPAÇO - SCHEMA COMPLETO PARA SUPABASE
-- Execute este script no SQL Editor do seu projeto Supabase
-- =========================================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA DE PERFIS DE USUÁRIOS
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    display_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. PREFERÊNCIAS DO USUÁRIO
CREATE TABLE IF NOT EXISTS public.user_preferences (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    timezone TEXT DEFAULT 'America/Sao_Paulo' NOT NULL,
    active_modules JSONB DEFAULT '{"mood": true, "sleep": true, "behaviors": true, "journal": true, "recovery": true}'::jsonb NOT NULL,
    notifications_enabled BOOLEAN DEFAULT FALSE NOT NULL,
    notification_time TEXT DEFAULT '20:00',
    pin_code TEXT,
    privacy_blur_enabled BOOLEAN DEFAULT FALSE NOT NULL,
    theme TEXT DEFAULT 'light' NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. CHECK-INS DE HUMOR, ENERGIA E EMOÇÕES
CREATE TABLE IF NOT EXISTS public.check_ins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    mood SMALLINT NOT NULL CHECK (mood >= 1 AND mood <= 5),
    energy SMALLINT CHECK (energy >= 1 AND energy <= 5),
    anxiety SMALLINT CHECK (anxiety >= 1 AND anxiety <= 5),
    emotions TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE (user_id, date)
);

-- 4. REGISTROS DE SONO
CREATE TABLE IF NOT EXISTS public.sleep_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes >= 0),
    perceived_quality SMALLINT NOT NULL CHECK (perceived_quality >= 1 AND perceived_quality <= 5),
    bedtime TEXT,
    wake_time TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE (user_id, date)
);

-- 5. CATEGORIAS DE IMPULSOS
CREATE TABLE IF NOT EXISTS public.behavior_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_custom BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. REGISTROS DE IMPULSOS E COMPORTAMENTOS
CREATE TABLE IF NOT EXISTS public.behavior_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.behavior_categories(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    urge_intensity SMALLINT NOT NULL CHECK (urge_intensity >= 0 AND urge_intensity <= 10),
    behavior_occurrence TEXT NOT NULL CHECK (behavior_occurrence IN ('nao_ocorreu', 'uma_vez', 'repetidamente', 'prefiro_nao_informar')),
    perceived_control TEXT NOT NULL CHECK (perceived_control IN ('controle', 'alguma_dificuldade', 'perda_controle', 'nao_sei_avaliar')),
    triggers TEXT,
    consequences TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. DIÁRIO PESSOAL
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    title TEXT,
    content TEXT NOT NULL,
    tag TEXT DEFAULT 'livre' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 8. JORNADA DE RECUPERAÇÃO
CREATE TABLE IF NOT EXISTS public.recovery_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    label TEXT DEFAULT 'Minha jornada' NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 9. TERMO DE CONSENTIMENTO
CREATE TABLE IF NOT EXISTS public.consent_records (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    accepted_terms BOOLEAN NOT NULL,
    accepted_privacy BOOLEAN NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) - PRIVACIDADE E SEGURANÇA
-- =========================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sleep_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.behavior_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.behavior_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recovery_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS otimizadas com (select auth.uid()) para evitar reavaliação por linha
DROP POLICY IF EXISTS "Acesso próprio perfil" ON public.profiles;
CREATE POLICY "Acesso próprio perfil" ON public.profiles FOR ALL USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Acesso próprias preferências" ON public.user_preferences;
CREATE POLICY "Acesso próprias preferências" ON public.user_preferences FOR ALL USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Acesso próprios check-ins" ON public.check_ins;
CREATE POLICY "Acesso próprios check-ins" ON public.check_ins FOR ALL USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Acesso próprio sono" ON public.sleep_entries;
CREATE POLICY "Acesso próprio sono" ON public.sleep_entries FOR ALL USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Acesso próprias categorias" ON public.behavior_categories;
CREATE POLICY "Acesso próprias categorias" ON public.behavior_categories FOR ALL USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Acesso próprios impulsos" ON public.behavior_entries;
CREATE POLICY "Acesso próprios impulsos" ON public.behavior_entries FOR ALL USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Acesso próprio diário" ON public.journal_entries;
CREATE POLICY "Acesso próprio diário" ON public.journal_entries FOR ALL USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Acesso próprios períodos" ON public.recovery_periods;
CREATE POLICY "Acesso próprios períodos" ON public.recovery_periods FOR ALL USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Acesso próprio consentimento" ON public.consent_records;
CREATE POLICY "Acesso próprio consentimento" ON public.consent_records FOR ALL USING ((select auth.uid()) = user_id);

-- Trigger para criar perfil e preferências automaticamente após cadastro
-- Protegido com search_path imutável e execução restrita apenas ao sistema
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name)
    VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));

    INSERT INTO public.user_preferences (user_id)
    VALUES (new.id);

    -- Categorias padrão de impulsos para o novo usuário
    INSERT INTO public.behavior_categories (user_id, name, is_custom) VALUES
    (new.id, 'Álcool', false),
    (new.id, 'Compras impulsivas', false),
    (new.id, 'Comer emocional', false),
    (new.id, 'Tempo excessivo de tela', false),
    (new.id, 'Nicotina', false);

    RETURN new;
END;
$$;

-- Revogar permissão de chamada externa direta via RPC / API pública
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
