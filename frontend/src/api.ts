import axios from 'axios';
import { CreateRoomDto, Message, Room, RegisterDto, LoginDto, AuthUser } from './types/chat';

const API_URL = 'http://localhost:3000'; // Adjust if backend port differs

export const api = {
  getRooms: async (): Promise<Room[]> => {
    const response = await axios.get<Room[]>(`${API_URL}/chat/rooms`);
    return response.data;
  },

  createRoom: async (room: CreateRoomDto): Promise<Room> => {
    const response = await axios.post<Room>(`${API_URL}/chat/rooms`, room);
    return response.data;
  },

  getMessages: async (roomId: string): Promise<Message[]> => {
    const response = await axios.get<Message[]>(`${API_URL}/chat/rooms/${roomId}/messages`);
    return response.data;
  },

  updateRoom: async (roomId: string, updates: { name?: string }): Promise<Room> => {
    const response = await axios.patch<Room>(`${API_URL}/chat/rooms/${roomId}`, updates);
    return response.data;
  },

  deleteRoom: async (roomId: string): Promise<void> => {
    await axios.delete(`${API_URL}/chat/rooms/${roomId}`);
  },

  register: async (payload: RegisterDto): Promise<AuthUser> => {
    const response = await axios.post<AuthUser>(`${API_URL}/auth/register`, payload);
    return response.data;
  },

  login: async (payload: LoginDto): Promise<AuthUser> => {
    const response = await axios.post<AuthUser>(`${API_URL}/auth/login`, payload);
    return response.data;
  }
};
