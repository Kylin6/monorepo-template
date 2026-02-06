export class AuthResponseDto {
  access_token?: string;
  user?: any;
  twoStepRequired?: boolean;
  temp_token?: string;
  temp_token_expires_at?: number;
}
