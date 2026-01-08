import axios from 'axios';
import { CreateRoomDto, Message, Room } from './types/chat';

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
  }
};
