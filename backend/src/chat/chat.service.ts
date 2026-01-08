import { Injectable } from '@nestjs/common';
import { Room } from './entities/room.entity';
import { Message } from './entities/message.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ChatService {
  // In-memory storage for demonstration purposes. Use a real DB in production.
  private rooms: Room[] = [];
  private messages: Message[] = [];

  constructor() {
    // Seed a default room
    this.createRoom({ name: 'General', description: 'General discussion' });
  }

  createRoom(createRoomDto: CreateRoomDto): Room {
    const room: Room = {
      id: uuidv4(),
      ...createRoomDto,
    };
    this.rooms.push(room);
    return room;
  }

  getRooms(): Room[] {
    return this.rooms;
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.find((r) => r.id === roomId);
  }

  addMessage(createMessageDto: CreateMessageDto): Message {
    const message: Message = {
      id: uuidv4(),
      createdAt: new Date(),
      ...createMessageDto,
    };
    this.messages.push(message);
    return message;
  }

  getMessagesForRoom(roomId: string): Message[] {
    return this.messages.filter((m) => m.roomId === roomId);
  }
}
