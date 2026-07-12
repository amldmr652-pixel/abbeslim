-- Phase 9 Migration: Media Tracker
-- Run this script in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.media_tracker (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'series', 'book')),
    status TEXT NOT NULL CHECK (status IN ('planned', 'active', 'completed')),
    rating INTEGER CHECK (rating >= 0 AND rating <= 5),
    poster_url TEXT,
    tmdb_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS for Media Tracker
ALTER TABLE public.media_tracker ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own media."
    ON public.media_tracker FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own media."
    ON public.media_tracker FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own media."
    ON public.media_tracker FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own media."
    ON public.media_tracker FOR DELETE
    USING (auth.uid() = user_id);

-- Create a trigger for updated_at
CREATE TRIGGER update_media_tracker_modtime
    BEFORE UPDATE ON public.media_tracker
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
