-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUMS
DO $$ BEGIN
  CREATE TYPE public.book_category AS ENUM ('novel', 'light_novel', 'manga', 'non_fiction', 'academic');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.book_status AS ENUM ('reading', 'completed', 'on_hold', 'plan_to_read');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. TABLE: books
CREATE TABLE IF NOT EXISTS public.books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  author TEXT,
  category public.book_category NOT NULL DEFAULT 'light_novel',
  current_volume INT NOT NULL DEFAULT 1 CHECK (current_volume >= 1),
  total_volumes INT NOT NULL DEFAULT 1 CHECK (total_volumes >= 1),
  current_page INT NOT NULL DEFAULT 0 CHECK (current_page >= 0),
  total_pages INT NOT NULL CHECK (total_pages > 0),
  cover_url TEXT,
  status public.book_status NOT NULL DEFAULT 'reading',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_current_page_le_total CHECK (current_page <= total_pages)
);

-- Index for querying books per user and status
CREATE INDEX IF NOT EXISTS idx_books_user_id ON public.books(user_id);
CREATE INDEX IF NOT EXISTS idx_books_status ON public.books(status);

-- 3. TABLE: reading_sessions
CREATE TABLE IF NOT EXISTS public.reading_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  start_page INT NOT NULL CHECK (start_page >= 0),
  end_page INT NOT NULL CHECK (end_page >= start_page),
  duration_seconds INT NOT NULL CHECK (duration_seconds > 0),
  speed_pages_per_hour NUMERIC(6, 2) GENERATED ALWAYS AS (
    CASE 
      WHEN duration_seconds > 0 THEN ROUND(((end_page - start_page)::numeric / duration_seconds) * 3600, 2)
      ELSE 0
    END
  ) STORED,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for session queries per book and user
CREATE INDEX IF NOT EXISTS idx_reading_sessions_book_id ON public.reading_sessions(book_id);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_user_id ON public.reading_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_created_at ON public.reading_sessions(created_at DESC);

-- 4. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_sessions ENABLE ROW LEVEL SECURITY;

-- Books Policies
DROP POLICY IF EXISTS "Users can read own books" ON public.books;
CREATE POLICY "Users can read own books" ON public.books
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own books" ON public.books;
CREATE POLICY "Users can insert own books" ON public.books
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own books" ON public.books;
CREATE POLICY "Users can update own books" ON public.books
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own books" ON public.books;
CREATE POLICY "Users can delete own books" ON public.books
  FOR DELETE USING (auth.uid() = user_id);

-- Reading Sessions Policies
DROP POLICY IF EXISTS "Users can read own reading sessions" ON public.reading_sessions;
CREATE POLICY "Users can read own reading sessions" ON public.reading_sessions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own reading sessions" ON public.reading_sessions;
CREATE POLICY "Users can insert own reading sessions" ON public.reading_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own reading sessions" ON public.reading_sessions;
CREATE POLICY "Users can update own reading sessions" ON public.reading_sessions
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own reading sessions" ON public.reading_sessions;
CREATE POLICY "Users can delete own reading sessions" ON public.reading_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Auto updated_at trigger for books
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_books_updated_at ON public.books;
CREATE TRIGGER set_books_updated_at
  BEFORE UPDATE ON public.books
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
