export const PASSWORD_POLICY_MESSAGE =
  'Use at least 8 characters with an uppercase letter, a lowercase letter, a number, and a special character. Maximum 72 bytes.';

export function getPasswordPolicyError(password: string): string | null {
  const byteLength = new TextEncoder().encode(password).length;
  if (
    password.length < 8
    || !/[A-Z]/.test(password)
    || !/[a-z]/.test(password)
    || !/\d/.test(password)
    || !/[^A-Za-z0-9\s]/.test(password)
  ) return PASSWORD_POLICY_MESSAGE;
  if (byteLength > 72) return 'Password must be no more than 72 bytes.';
  return null;
}
