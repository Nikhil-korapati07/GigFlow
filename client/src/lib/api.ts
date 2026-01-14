import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface User {
  id: string;
  email: string;
  role: 'client' | 'freelancer';
  name: string;
}

export interface Gig {
  _id: string;
  title: string;
  description: string;
  budget: number;
  deadline: string;
  skills: string[];
  status: 'open' | 'assigned' | 'completed';
  clientId: string;
  assignedFreelancerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Bid {
  _id: string;
  gigId: string | Gig;
  freelancerId: string | User;
  amount: number;
  message: string;
  status: 'pending' | 'hired' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export const authApi = {
  register: async (data: { email: string; password: string; role: 'client' | 'freelancer'; name: string }) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },
  login: async (data: { email: string; password: string }) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export const gigApi = {
  create: async (data: { title: string; description: string; budget: number; deadline: string; skills: string[] }) => {
    const response = await api.post('/gigs', data);
    return response.data;
  },
  getMine: async () => {
    const response = await api.get('/gigs/mine');
    return response.data;
  },
  getOpen: async () => {
    const response = await api.get('/gigs/open');
    return response.data;
  },
  getBids: async (gigId: string) => {
    const response = await api.get(`/gigs/${gigId}/bids`);
    return response.data;
  },
  hire: async (gigId: string, bidId: string) => {
    const response = await api.post(`/gigs/${gigId}/hire/${bidId}`);
    return response.data;
  },
};

export const bidApi = {
  create: async (gigId: string, data: { amount: number; message: string }) => {
    const response = await api.post(`/gigs/${gigId}/bids`, data);
    return response.data;
  },
  getMine: async () => {
    const response = await api.get('/bids/mine');
    return response.data;
  },
};

export default api;
