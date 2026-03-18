import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  register: (username: string, password: string, displayName?: string) =>
    api.post('/auth/register', { username, password, displayName }),
  
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  
  getMe: () => api.get('/auth/me'),
  
  logout: () => api.post('/auth/logout'),
  
  updateProfile: (data: { displayName?: string; avatar?: string }) =>
    api.put('/auth/profile', data)
};

// Users API
export const usersAPI = {
  search: (query: string) => api.get(`/users/search?query=${query}`),
  
  getByUsername: (username: string) => api.get(`/users/${username}`),
  
  addContact: (username: string) => api.post('/users/contacts/add', { username }),
  
  getContacts: () => api.get('/users/contacts/list'),
  
  removeContact: (userId: string) => api.post('/users/contacts/remove', { userId }),
  
  blockUser: (userId: string) => api.post('/users/block', { userId }),
  
  getBlockedUsers: () => api.get('/users/blocked/list')
};

// Messages API
export const messagesAPI = {
  getConversation: (userId: string, page = 1, limit = 50) =>
    api.get(`/messages/conversation/${userId}?page=${page}&limit=${limit}`),
  
  getGroupMessages: (groupId: string, page = 1, limit = 50) =>
    api.get(`/messages/group/${groupId}?page=${page}&limit=${limit}`),
  
  editMessage: (messageId: string, content: string) =>
    api.put(`/messages/${messageId}`, { content }),
  
  deleteMessage: (messageId: string) => api.delete(`/messages/${messageId}`),
  
  addReaction: (messageId: string, emoji: string) =>
    api.post(`/messages/${messageId}/react`, { emoji }),
  
  getUnreadCount: () => api.get('/messages/unread/count')
};

// Groups API
export const groupsAPI = {
  create: (data: {
    name: string;
    description?: string;
    members?: string[];
    isPrivate?: boolean;
  }) => api.post('/groups/create', data),
  
  getMyGroups: () => api.get('/groups/my-groups'),
  
  getGroup: (groupId: string) => api.get(`/groups/${groupId}`),
  
  addMember: (groupId: string, userId: string) =>
    api.post(`/groups/${groupId}/add-member`, { userId }),
  
  removeMember: (groupId: string, userId: string) =>
    api.post(`/groups/${groupId}/remove-member`, { userId }),
  
  updateGroup: (groupId: string, data: any) =>
    api.put(`/groups/${groupId}`, data),
  
  joinByLink: (inviteLink: string) => api.post(`/groups/join/${inviteLink}`)
};

// Stickers API
export const stickersAPI = {
  create: (data: {
    name: string;
    url: string;
    pack?: string;
    tags?: string[];
    isAnimated?: boolean;
  }) => api.post('/stickers/create', data),
  
  getAll: (page = 1, limit = 50, search?: string) =>
    api.get(`/stickers/all?page=${page}&limit=${limit}${search ? `&search=${search}` : ''}`),
  
  getByPack: (packName: string) => api.get(`/stickers/pack/${packName}`),
  
  getMyStickers: () => api.get('/stickers/my-stickers'),
  
  incrementUsage: (stickerId: string) => api.post(`/stickers/${stickerId}/use`),
  
  delete: (stickerId: string) => api.delete(`/stickers/${stickerId}`)
};

// Media API
export const mediaAPI = {
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/media/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  uploadVideo: (file: File) => {
    const formData = new FormData();
    formData.append('video', file);
    return api.post('/media/upload-video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  uploadAudio: (file: File) => {
    const formData = new FormData();
    formData.append('audio', file);
    return api.post('/media/upload-audio', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  uploadPDF: (file: File) => {
    const formData = new FormData();
    formData.append('pdf', file);
    return api.post('/media/upload-pdf', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  getInstagramReel: (url: string) =>
    api.post('/media/instagram-reel', { url }),
  
  deleteMedia: (publicId: string, resourceType?: string) =>
    api.delete(`/media/delete/${publicId}?resourceType=${resourceType || 'image'}`)
};

// Calls API
export const callsAPI = {
  getHistory: (page = 1, limit = 20) =>
    api.get(`/calls/history?page=${page}&limit=${limit}`),
  
  getCall: (callId: string) => api.get(`/calls/${callId}`),
  
  updateStatus: (callId: string, status: string, duration?: number) =>
    api.put(`/calls/${callId}/status`, { status, duration })
};

export default api;