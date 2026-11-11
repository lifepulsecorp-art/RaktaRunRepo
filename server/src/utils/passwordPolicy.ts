export const PASSWORD_POLICY_MESSAGE =
  'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character.';

export function getPasswordPolicyError(password: string): string | null {
  if (password.length < 8) return PASSWORD_POLICY_MESSAGE;
  if (!/[A-Z]/.test(password)) return PASSWORD_POLICY_MESSAGE;
  if (!/[a-z]/.test(password)) return PASSWORD_POLICY_MESSAGE;
  if (!/\d/.test(password)) return PASSWORD_POLICY_MESSAGE;
  if (!/[^A-Za-z0-9\s]/.test(password)) return PASSWORD_POLICY_MESSAGE;
  if (Buffer.byteLength(password, 'utf8') > 72) return 'Password must be no more than 72 bytes.';
  return null;
}
