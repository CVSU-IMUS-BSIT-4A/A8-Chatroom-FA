export interface Room {
  id: string;
  name: string;
  description?: string;
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
  description?: string;
}

export interface CreateMessageDto {
  roomId: string;
  sender: string;
  content: string;
}

export interface JoinRoomDto {
  roomId: string;
  userId: string;
}
