-- Phase 7 Migration: Habits
-- Run this script in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.habits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    frequency TEXT DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly')),
    streak INTEGER DEFAULT 0,
    color TEXT DEFAULT 'bg-blue-500',
    last_completed TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS for Habits
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own habits."
    ON public.habits FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own habits."
    ON public.habits FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own habits."
    ON public.habits FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habits."
    ON public.habits FOR DELETE
    USING (auth.uid() = user_id);

-- Create a trigger for updated_at
CREATE TRIGGER update_habits_modtime
    BEFORE UPDATE ON public.habits
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
