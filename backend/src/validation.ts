export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
  return phoneRegex.test(phone);
};

export const validateOTP = (otp: string): boolean => {
  return /^\d{6}$/.test(otp);
};

export const validateAmount = (amount: number): boolean => {
  return amount > 0 && amount <= 1000000;
};

export const validateDate = (date: string): boolean => {
  const dateObj = new Date(date);
  return !isNaN(dateObj.getTime()) && dateObj >= new Date();
};

export const validateFriendName = (name: string): boolean => {
  return name.trim().length >= 2 && name.trim().length <= 100;
};
