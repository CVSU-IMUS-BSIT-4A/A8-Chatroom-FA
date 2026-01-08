import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { Room } from './entities/room.entity';
import { Message } from './entities/message.entity';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('rooms')
  @ApiOperation({ summary: 'Create a new chat room' })
  @ApiResponse({ status: 201, description: 'The room has been successfully created.', type: Room })
  createRoom(@Body() createRoomDto: CreateRoomDto): Room {
    return this.chatService.createRoom(createRoomDto);
  }

  @Get('rooms')
  @ApiOperation({ summary: 'List all chat rooms' })
  @ApiResponse({ status: 200, description: 'Return all rooms.', type: [Room] })
  getRooms(): Room[] {
    return this.chatService.getRooms();
  }

  @Get('rooms/:roomId/messages')
  @ApiOperation({ summary: 'Get message history for a room' })
  @ApiResponse({ status: 200, description: 'Return messages for the room.', type: [Message] })
  getMessages(@Param('roomId') roomId: string): Message[] {
    return this.chatService.getMessagesForRoom(roomId);
  }
}
