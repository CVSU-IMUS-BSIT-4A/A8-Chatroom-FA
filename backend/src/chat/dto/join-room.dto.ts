import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export class JoinRoomDto {
  @ApiProperty({ example: 'room-1', description: 'ID of the room to join' })
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @ApiProperty({ example: 'User123', description: 'Name or ID of the user joining' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(50)
  userId: string;
}
