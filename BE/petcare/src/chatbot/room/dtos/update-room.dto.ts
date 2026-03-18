import { PartialType } from '@nestjs/swagger';
import { CreateRoomDTO } from './create-room.dto';

export class UpdateRoomDTO extends PartialType(CreateRoomDTO) {}
