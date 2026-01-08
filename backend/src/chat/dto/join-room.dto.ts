import { ApiProperty } from '@nestjs/swagger';

export class JoinRoomDto {
  @ApiProperty({ example: 'room-1', description: 'ID of the room to join' })
  roomId: string;

  @ApiProperty({ example: 'User123', description: 'Name or ID of the user joining' })
  userId: string;
}
