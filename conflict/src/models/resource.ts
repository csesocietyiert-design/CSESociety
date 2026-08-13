// resource

export interface Resource {
  id: string;
  title: string;
  file_url: string;
  uploaded_by: string;
  category: string;
  created_at: string;
}

export interface CreateResourceInput {
  title: string;
  file_url: string;
  uploaded_by: string;
  category: string;
}
