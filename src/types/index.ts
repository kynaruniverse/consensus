export interface Profile {
  id: string;
  username: string;
  email?: string;
  age_range?: string;
  gender?: string;
  role: 'user' | 'client';
  created_at?: string;
}

export interface Question {
  id: string;
  question_text: string;
  options: string[];
  category: string;
  created_by?: string;
  created_at: string;
}

export interface Vote {
  id: string;
  question_id: string;
  option_index: number;
  user_id?: string;
  country_code: string;
  age_range?: string;
  gender?: string;
  created_at: string;
}

export interface Comment {
  id: string;
  question_id: string;
  user_id: string;
  username: string;
  body: string;
  vote_index?: number;
  likes: number;
  created_at: string;
  likedByMe?: boolean;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'milestone' | 'comment' | 'new_vote';
  question_id: string;
  question_text: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  label: string;
  color: string;
}
