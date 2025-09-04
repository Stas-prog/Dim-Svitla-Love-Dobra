export type UploadApiResponse = {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  created_at: string;
  folder?: string;
  [key: string]: any;
};
