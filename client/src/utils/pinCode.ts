export const PIN_CODE_ERROR_MESSAGE = 'PIN Code must contain exactly 6 digits.';

export function isValidIndianPinCode(pinCode: string): boolean {
  return /^\d{6}$/.test(pinCode);
}
