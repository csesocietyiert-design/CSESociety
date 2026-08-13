// role names used across the system

export type RoleName =
  | "faculty"
  | "admin"
  | "vice_president"
  | "general_secretary"
  | "treasurer"
  | "technical_secretary"
  | "cultural_secretary"
  | "year_rep_1"
  | "year_rep_2"
  | "year_rep_3"
  | "year_rep_4"
  | "member";

export interface Role {
  id: string;
  name: RoleName;
}

export interface MemberRole {
  id: string;
  member_id: string;
  role_id: string;
  assigned_at: string;
  assigned_by: string;
}

export interface MemberRoleWithDetails extends MemberRole {
  role: Role;
}

// dashboard group mapping

export const DASHBOARD_GROUP: Record<RoleName, string> = {
  faculty: "faculty_admin",
  admin: "faculty_admin",
  vice_president: "executive",
  general_secretary: "executive",
  treasurer: "treasurer",
  technical_secretary: "secretary",
  cultural_secretary: "secretary",
  year_rep_1: "year_representative",
  year_rep_2: "year_representative",
  year_rep_3: "year_representative",
  year_rep_4: "year_representative",
  member: "member",
};

// roles that can send notifications

export const CAN_SEND_NOTIFICATIONS: RoleName[] = [
  "faculty",
  "admin",
  "vice_president",
  "general_secretary",
  "treasurer",
  "technical_secretary",
  "cultural_secretary",
  "year_rep_1",
  "year_rep_2",
  "year_rep_3",
  "year_rep_4",
];
