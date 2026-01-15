import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { Room } from './entities/room.entity';
import { Message } from './entities/message.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

@Injectable()
export class ChatService implements OnModuleInit {
  constructor(
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
  ) {}

  // In-memory messages (not stored in DB per requirement)
  private messages: Message[] = [];

  async onModuleInit() {
    // Seed a default room if none exist
    const count = await this.roomRepository.count();
    if (count === 0) {
      await this.createRoom({ name: 'General' });
      console.log('Default "General" room created.');
    }
  }

  async createRoom(createRoomDto: CreateRoomDto): Promise<Room> {
    const room = this.roomRepository.create(createRoomDto);
    return this.roomRepository.save(room);
  }

  async getRooms(): Promise<Room[]> {
    return this.roomRepository.find({ order: { createdAt: 'ASC' } });
  }

  async getRoom(roomId: string): Promise<Room | null> {
    return this.roomRepository.findOne({ where: { id: roomId } });
  }

  async addMessage(createMessageDto: CreateMessageDto): Promise<Message> {
    const message: Message = {
      id: randomUUID(),
      roomId: createMessageDto.roomId,
      sender: createMessageDto.sender || 'Unknown',
      content: createMessageDto.content,
      createdAt: new Date(),
    };
    this.messages.push(message);
    console.log(`[Message Created] ID: ${message.id}, Sender: ${message.sender}, Room: ${message.roomId}`);
    return message;
  }

  async getMessagesForRoom(roomId: string): Promise<Message[]> {
    return this.messages.filter((m) => m.roomId === roomId);
  }

  async updateRoom(roomId: string, updateRoomDto: UpdateRoomDto): Promise<Room | null> {
    const room = await this.roomRepository.findOne({ where: { id: roomId } });
    if (!room) return null;

    if (updateRoomDto.name) room.name = updateRoomDto.name;

    return this.roomRepository.save(room);
  }

  async deleteRoom(roomId: string): Promise<boolean> {
    const result = await this.roomRepository.delete(roomId);
    return result.affected > 0;
  }
}
