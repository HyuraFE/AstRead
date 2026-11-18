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
  author: string | null;
  category: BookCategory;
  current_volume: number;
  total_volumes: number;
  current_page: number;
  total_pages: number;
  cover_url: string | null;
  status: BookStatus;
  created_at: string;
  updated_at: string;
}

export interface ReadingSession {
  id: string;
  book_id: string;
  user_id: string;
  start_page: number;
  end_page: number;
  duration_seconds: number;
  speed_pages_per_hour: number;
  session_date: string;
  created_at: string;
}

export interface ReadingStats {
  pagesRead: number;
  durationSeconds: number;
  currentSpeedPerHour: number;
  rollingAvgSpeedPerHour: number;
  remainingPages: number;
  estimatedRemainingHours: number;
  projectedFinishDate: string | null;
}
