import type { RoleName } from "./role";

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author_id: string;
  target_role: RoleName | "all";
  published_at: string;
  is_active: boolean;
}

export interface CreateAnnouncementInput {
  title: string;
  content: string;
  author_id: string;
  target_role: RoleName | "all";
}
