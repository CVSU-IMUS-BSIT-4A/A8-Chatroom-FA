import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, MinLength, IsOptional } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty({ example: 'room-1', description: 'ID of the room' })
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @ApiProperty({ example: 'User123', description: 'Name or ID of the sender', required: false })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(50)
  sender?: string;

  @ApiProperty({ example: 'Hello world!', description: 'Message content' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(2000)
  content: string;
}
