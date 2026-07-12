-- Phase 6 Migration: Goals and Pomodoro Sessions
-- Run this script in the Supabase SQL Editor

-- 1. Create Goals Table
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    color TEXT DEFAULT 'bg-green-500',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS for Goals
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own goals."
    ON public.goals FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals."
    ON public.goals FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals."
    ON public.goals FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals."
    ON public.goals FOR DELETE
    USING (auth.uid() = user_id);

-- 2. Create Pomodoro Sessions Table
CREATE TABLE IF NOT EXISTS public.pomodoro_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    duration_minutes INTEGER NOT NULL,
    mode TEXT NOT NULL, -- 'focus', 'shortBreak', 'longBreak'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS for Pomodoro Sessions
ALTER TABLE public.pomodoro_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own pomodoro sessions."
    ON public.pomodoro_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pomodoro sessions."
    ON public.pomodoro_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create a function to update the updated_at column for goals
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_goals_modtime
    BEFORE UPDATE ON public.goals
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
