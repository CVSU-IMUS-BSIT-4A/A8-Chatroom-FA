import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { AuthService } from '../auth/auth.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { JoinRoomDto } from './dto/join-room.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Track active users per room: roomId -> Set of usernames
  private activeUsers: Map<string, Set<string>> = new Map();

  // Track socket to user mapping for authentication + spoofing prevention
  private socketToUser: Map<string, { userId: string; username: string; roomId: string }> = new Map();

  constructor(
    private readonly chatService: ChatService,
    private readonly authService: AuthService,
  ) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    
    // Clean up user from active users when they disconnect
    const userData = this.socketToUser.get(client.id);
    if (userData) {
      const { username, roomId } = userData;
      if (this.activeUsers.has(roomId)) {
        this.activeUsers.get(roomId).delete(username);
        
        // Emit updated active users list
        this.server.to(roomId).emit('activeUsers', {
          roomId,
          users: Array.from(this.activeUsers.get(roomId)),
        });
      }
      this.socketToUser.delete(client.id);
    }
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() joinRoomDto: JoinRoomDto,
    @ConnectedSocket() client: Socket,
  ) {
    const user = await this.authService.findById(joinRoomDto.userId);
    if (!user) {
      client.emit('error', { message: 'Invalid user. Please log in again.' });
      return { error: 'Invalid user' };
    }

    client.join(joinRoomDto.roomId);
    console.log(`Client ${client.id} joined room ${joinRoomDto.roomId}`);

    // Store socket-to-user mapping for auth and spoofing prevention
    this.socketToUser.set(client.id, {
      userId: user.id,
      username: user.username,
      roomId: joinRoomDto.roomId,
    });
    
    // Track active user
    if (!this.activeUsers.has(joinRoomDto.roomId)) {
      this.activeUsers.set(joinRoomDto.roomId, new Set());
    }
    this.activeUsers.get(joinRoomDto.roomId).add(user.username);
    
    // Emit user joined event
    this.server.to(joinRoomDto.roomId).emit('userJoined', {
      userId: user.id,
      username: user.username,
      message: `${user.username} joined the room.`,
    });
    
    // Emit updated active users list
    this.server.to(joinRoomDto.roomId).emit('activeUsers', {
      roomId: joinRoomDto.roomId,
      users: Array.from(this.activeUsers.get(joinRoomDto.roomId)),
    });
  }

  @SubscribeMessage('updateRoom')
  async handleUpdateRoom(@MessageBody() data: { roomId: string; updates: UpdateRoomDto }) {
    const updatedRoom = await this.chatService.updateRoom(data.roomId, data.updates);
    if (updatedRoom) {
      // Broadcast to all clients
      this.server.emit('roomUpdated', updatedRoom);
      return updatedRoom;
    }
    return null;
  }

  @SubscribeMessage('deleteRoom')
  async handleDeleteRoom(@MessageBody() data: { roomId: string }) {
    const success = await this.chatService.deleteRoom(data.roomId);
    if (success) {
      // Broadcast to all clients
      this.server.emit('roomDeleted', { roomId: data.roomId });
      // Clean up active users
      this.activeUsers.delete(data.roomId);
      return { success: true };
    }
    return { success: false };
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @MessageBody() data: { roomId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(data.roomId);
    
    // Remove socket-to-user mapping
    const userData = this.socketToUser.get(client.id);
    this.socketToUser.delete(client.id);
    
    // Remove from active users
    if (this.activeUsers.has(data.roomId) && userData) {
      this.activeUsers.get(data.roomId).delete(userData.username);
      
      // Emit updated active users list
      this.server.to(data.roomId).emit('activeUsers', {
        roomId: data.roomId,
        users: Array.from(this.activeUsers.get(data.roomId)),
      });
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() createMessageDto: CreateMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    // Username spoofing prevention (#5): Verify the sender matches the registered user
    const userData = this.socketToUser.get(client.id);
    if (!userData) {
      return { error: 'Not authenticated. Please join a room again.' };
    }

    // Force sender to authenticated username
    createMessageDto.sender = userData.username;

    const message = await this.chatService.addMessage(createMessageDto);
    console.log(`[WebSocket] Broadcasting message ${message.id} to room ${message.roomId}`);
    // Broadcast to the specific room
    this.server.to(createMessageDto.roomId).emit('receiveMessage', message);
    return message;
  }
}
