import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const sendOTP = async (phoneNumber) => {
  const response = await api.post('/auth/send-otp', { phone_number: phoneNumber });
  return response.data;
};

export const verifyOTP = async (phoneNumber, otp) => {
  const response = await api.post('/auth/verify-otp', { phone_number: phoneNumber, otp });
  return response.data;
};

export const getLoans = async (token) => {
  const response = await api.get('/loans', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const addLoan = async (token, loanData) => {
  const response = await api.post('/loans', loanData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const markAsRepaid = async (token, loanId) => {
  const response = await api.patch(`/loans/${loanId}/repaid`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getSummary = async (token) => {
  const response = await api.get('/loans/summary', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const uploadReceipt = async (token, formData) => {
  const response = await api.post('/loans/upload-receipt', formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export default api;
