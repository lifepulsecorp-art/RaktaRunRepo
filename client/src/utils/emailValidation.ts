export function getEmailValidationMessage(email: string): string {
  const value = email.trim();

  if (!value) return 'Enter your email address.';
  if (/\s/.test(value)) return 'Email addresses cannot contain spaces.';

  const atIndex = value.indexOf('@');
  if (atIndex === -1) return 'Add an @ symbol, for example name@example.com.';
  if (value.indexOf('@', atIndex + 1) !== -1) return 'Use only one @ symbol in the email address.';
  if (atIndex === 0) return 'Add a name before the @ symbol.';

  const domain = value.slice(atIndex + 1);
  if (!domain) return 'Add a domain after the @ symbol, for example example.com.';
  if (!domain.includes('.')) return 'The domain needs an ending such as .com or .in.';
  if (domain.startsWith('.') || domain.endsWith('.') || domain.includes('..')) {
    return 'Check the domain after @; it contains a misplaced or repeated dot.';
  }

  const localPart = value.slice(0, atIndex);
  if (localPart.startsWith('.') || localPart.endsWith('.') || localPart.includes('..')) {
    return 'Check the name before @; it contains a misplaced or repeated dot.';
  }
  if (!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(localPart)) {
    return 'Use a valid name before @; remove punctuation or symbols that are not allowed.';
  }
  const domainParts = domain.split('.');
  if (domainParts.some((part) => !part || part.startsWith('-') || part.endsWith('-') || !/^[a-zA-Z0-9-]+$/.test(part))) {
    return 'Check the domain after @; each part must use letters, numbers, or hyphens.';
  }

  return '';
}
