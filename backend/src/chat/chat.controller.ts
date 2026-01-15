import { Controller, Get, Post, Body, Param, Patch, Delete, HttpCode, HttpStatus, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiExcludeEndpoint } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { Room } from './entities/room.entity';
import { Message } from './entities/message.entity';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('rooms')
  @ApiOperation({ summary: 'Create a new chat room' })
  @ApiResponse({ status: 201, description: 'The room has been successfully created.', type: Room })
  async createRoom(@Body() createRoomDto: CreateRoomDto): Promise<Room> {
    return this.chatService.createRoom(createRoomDto);
  }

  @Get('rooms')
  @ApiOperation({ summary: 'List all chat rooms' })
  @ApiResponse({ status: 200, description: 'Return all rooms.', type: [Room] })
  async getRooms(): Promise<Room[]> {
    return this.chatService.getRooms();
  }

  @Get('rooms/:roomId/messages')
  @ApiExcludeEndpoint()
  async getMessages(@Param('roomId') roomId: string): Promise<Message[]> {
    return this.chatService.getMessagesForRoom(roomId);
  }

  @Patch('rooms/:roomId')
  @ApiOperation({ summary: 'Update a chat room' })
  @ApiResponse({ status: 200, description: 'The room has been successfully updated.', type: Room })
  async updateRoom(@Param('roomId') roomId: string, @Body() updateRoomDto: UpdateRoomDto): Promise<Room> {
    const room = await this.chatService.updateRoom(roomId, updateRoomDto);
    if (!room) throw new NotFoundException('Room not found');
    return room;
  }

  @Delete('rooms/:roomId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a chat room' })
  @ApiResponse({ status: 204, description: 'The room has been successfully deleted.' })
  async deleteRoom(@Param('roomId') roomId: string): Promise<void> {
    const success = await this.chatService.deleteRoom(roomId);
    if (!success) throw new NotFoundException('Room not found');
  }
}
