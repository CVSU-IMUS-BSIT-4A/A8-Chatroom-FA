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
import { CreateMessageDto } from './dto/create-message.dto';
import { JoinRoomDto } from './dto/join-room.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() joinRoomDto: JoinRoomDto,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(joinRoomDto.roomId);
    console.log(`Client ${client.id} joined room ${joinRoomDto.roomId}`);
    // Ideally, emit a 'userJoined' event to the room
    this.server.to(joinRoomDto.roomId).emit('userJoined', {
      userId: joinRoomDto.userId,
      message: `${joinRoomDto.userId} joined the room.`,
    });
  }

  @SubscribeMessage('sendMessage')
  handleSendMessage(@MessageBody() createMessageDto: CreateMessageDto) {
    const message = this.chatService.addMessage(createMessageDto);
    // Broadcast to the specific room
    this.server.to(createMessageDto.roomId).emit('receiveMessage', message);
    return message;
  }
}
