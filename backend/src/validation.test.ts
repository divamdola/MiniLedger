import {
  validatePhoneNumber,
  validateOTP,
  validateAmount,
  validateDate,
  validateFriendName,
} from './validation';

describe('Validation', () => {
  describe('validatePhoneNumber', () => {
    it('should validate correct phone numbers', () => {
      expect(validatePhoneNumber('1234567890')).toBe(true);
      expect(validatePhoneNumber('(123) 456-7890')).toBe(true);
      expect(validatePhoneNumber('123-456-7890')).toBe(true);
      expect(validatePhoneNumber('+1 123 456 7890')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(validatePhoneNumber('123')).toBe(false);
      expect(validatePhoneNumber('abc')).toBe(false);
      expect(validatePhoneNumber('')).toBe(false);
    });
  });

  describe('validateOTP', () => {
    it('should validate correct OTPs', () => {
      expect(validateOTP('123456')).toBe(true);
      expect(validateOTP('000000')).toBe(true);
      expect(validateOTP('999999')).toBe(true);
    });

    it('should reject invalid OTPs', () => {
      expect(validateOTP('12345')).toBe(false);
      expect(validateOTP('1234567')).toBe(false);
      expect(validateOTP('abcdef')).toBe(false);
      expect(validateOTP('')).toBe(false);
    });
  });

  describe('validateAmount', () => {
    it('should validate correct amounts', () => {
      expect(validateAmount(1)).toBe(true);
      expect(validateAmount(100)).toBe(true);
      expect(validateAmount(1000000)).toBe(true);
    });

    it('should reject invalid amounts', () => {
      expect(validateAmount(0)).toBe(false);
      expect(validateAmount(-100)).toBe(false);
      expect(validateAmount(1000001)).toBe(false);
    });
  });

  describe('validateFriendName', () => {
    it('should validate correct names', () => {
      expect(validateFriendName('John')).toBe(true);
      expect(validateFriendName('John Doe')).toBe(true);
      expect(validateFriendName('AB')).toBe(true);
    });

    it('should reject invalid names', () => {
      expect(validateFriendName('')).toBe(false);
      expect(validateFriendName('A')).toBe(false);
      expect(validateFriendName('  ')).toBe(false);
    });
  });

  describe('validateDate', () => {
    it('should validate future dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      expect(validateDate(futureDate.toISOString().split('T')[0])).toBe(true);
    });

    it('should reject past dates', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      expect(validateDate(pastDate.toISOString().split('T')[0])).toBe(false);
    });

    it('should reject invalid dates', () => {
      expect(validateDate('invalid')).toBe(false);
      expect(validateDate('')).toBe(false);
    });
  });
});
