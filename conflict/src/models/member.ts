// member

export interface Member {
  id: string;
  user_id: string;
  full_name: string;
  roll_number: string;
  year: 1 | 2 | 3 | 4;
  department: string;
  phone: string | null;
  profile_photo_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CreateMemberInput {
  user_id: string;
  full_name: string;
  roll_number: string;
  year: 1 | 2 | 3 | 4;
  department: string;
  phone?: string;
  profile_photo_url?: string;
}

export interface UpdateMemberInput {
  full_name?: string;
  roll_number?: string;
  year?: 1 | 2 | 3 | 4;
  department?: string;
  phone?: string;
  profile_photo_url?: string;
  is_active?: boolean;
}

// society id

export interface SocietyId {
  id: string;
  member_id: string;
  society_id_code: string;
  issued_at: string;
  is_active: boolean;
}
