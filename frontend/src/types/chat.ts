export interface Room {
  id: string;
  name: string;
}

export interface Message {
  id: string;
  roomId: string;
  sender: string;
  content: string;
  createdAt: string; // Dates often come as strings from JSON
}

export interface CreateRoomDto {
  name: string;
}

export interface CreateMessageDto {
  roomId: string;
  sender?: string;
  content: string;
}

export interface JoinRoomDto {
  roomId: string;
  userId: string;
}

export interface AuthUser {
  id: string;
  username: string;
}

export interface RegisterDto {
  username: string;
  password: string;
}

export interface LoginDto {
  username: string;
  password: string;
}
