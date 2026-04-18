import bcrypt from 'bcryptjs';

/**
 * Password를 해시하여 저장
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * 입력한 password와 저장된 해시 비교
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!hash || hash === '') {
    // 해시가 없으면 OAuth 계정이므로 false
    return false;
  }
  return bcrypt.compare(password, hash);
}
