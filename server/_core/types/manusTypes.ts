export type ExchangeTokenRequest = {
  clientId: string;
  grantType: "authorization_code";
  code: string;
  redirectUri: string;
};

export type ExchangeTokenResponse = {
  accessToken: string;
};

export type GetUserInfoResponse = {
  openId?: string;
  email?: string | null;
  name?: string | null;
  phone?: string | null;
  platform?: string | null;
  loginMethod?: string | null;
  platforms?: string[];
};

export type GetUserInfoWithJwtRequest = {
  jwtToken: string;
  projectId: string;
};

export type GetUserInfoWithJwtResponse = GetUserInfoResponse;
