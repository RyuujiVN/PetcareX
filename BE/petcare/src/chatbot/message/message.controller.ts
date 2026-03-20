import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { MessageService } from './message.service';
import { CreateMessageDTO } from './dtos/create-message.dto';

@Controller('message')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo mới message' })
  @ApiBody({
    type: CreateMessageDTO,
  })
  createMessage(@Body() createDTO: CreateMessageDTO, @Req() req) {
    return this.messageService.createMessage(createDTO, req?.user?.id);
  }
}