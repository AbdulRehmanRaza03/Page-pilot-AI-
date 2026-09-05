export type User = {
  id: string;
  email: string;
  full_name: string | null;
  email_verified: boolean;
};

export type Workspace = {
  id: string;
  name: string;
  slug: string;
  role?: string | null;
};

export type TokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
};

export type MeResponse = User & {
  workspaces: Workspace[];
};
