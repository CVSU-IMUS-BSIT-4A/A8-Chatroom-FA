import { ApiProperty } from '@nestjs/swagger';

export class CreateRoomDto {
  @ApiProperty({ example: 'General', description: 'The name of the chat room' })
  name: string;

  @ApiProperty({ example: 'General discussion', description: 'Description of the room', required: false })
  description?: string;
}
