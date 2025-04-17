export interface ApiResponse {
    message?: string;
    token?: string;
    errors?: { msg: string }[];
  }