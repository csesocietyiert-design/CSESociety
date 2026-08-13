// certificate

export interface Certificate {
  id: string;
  member_id: string;
  event_id: string;
  certificate_url: string;
  issued_at: string;
  issued_by: string;
}

export interface CreateCertificateInput {
  member_id: string;
  event_id: string;
  certificate_url: string;
  issued_by: string;
}
