import { ApiProperty } from '@nestjs/swagger';

export class CreateMessageDto {
  @ApiProperty({ example: 'room-1', description: 'ID of the room' })
  roomId: string;

  @ApiProperty({ example: 'User123', description: 'Name or ID of the sender' })
  sender: string;

  @ApiProperty({ example: 'Hello world!', description: 'Message content' })
  content: string;
}
