export type BookCategory =
  | "novel"
  | "light_novel"
  | "manga"
  | "non_fiction"
  | "academic";

export type BookStatus =
  | "reading"
  | "completed"
  | "on_hold"
  | "plan_to_read";

export interface Book {
  id: string;
  user_id: string;
  title: string;
  volume: string | null;
  author: string | null;
  category: BookCategory;
  current_page: number;
  total_pages: number;
  status: BookStatus;
  rating: number | null;
  notes: string | null;
  cover_url: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReadingSession {
  id: string;
  book_id: string;
  user_id: string;
  start_page: number;
  end_page: number;
  pages_read: number;
  duration_minutes: number;
  speed_pages_per_hour: number;
  session_date: string;
  notes: string | null;
  created_at: string;
}

export interface ReadingStats {
  pagesRead: number;
  durationMinutes: number;
  currentSpeedPerHour: number;
  rollingAvgSpeedPerHour: number;
  remainingPages: number;
  estimatedRemainingHours: number;
  projectedFinishDate: string | null;
}
