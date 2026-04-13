/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessageService } from './message/message.service';
import { CreateMessageDTO } from './message/dtos/create-message.dto';
import { AiClientService } from './ai-client.service';
import { forwardRef, Inject, Logger } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import { SenderEnum } from 'src/common/enums/sender.enum';
import { ChatbotRoom } from './entities/chatbot-room.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { MessageSend } from './message/types/message-send.type';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/chat',
})
export class ChatBotGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private server: Server;
  private readonly logger = new Logger(ChatBotGateway.name);

  constructor(
    private readonly messageService: MessageService,
    @InjectRepository(ChatbotRoom)
    private readonly roomRepository: Repository<ChatbotRoom>,
    private readonly authService: AuthService,
    @Inject(forwardRef(() => AiClientService))
    private readonly aiClientService: AiClientService,
  ) {}

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);

    try {
      const accessToken = client.handshake.auth?.accessToken;

      const user = await this.authService.verifyToken(accessToken);

      client.data.user = user;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.warn(`Client disconnected: ${client.id}`);
    client.disconnect();
  }

  @SubscribeMessage('message')
  async handleMessage(client: Socket, payload: CreateMessageDTO) {
    try {
      const isFirstMessageNewRoom = !payload.roomId;

      // Tạo mới message
      const userId = client.data.user?.id;
      const message = await this.messageService.createMessage(payload, userId);

      // Nếu client chưa có `roomId` (tin nhắn đầu tiên) thì sẽ tạo room mới và sau đó để client join room lại.
      if (isFirstMessageNewRoom) {
        const roomId = message.roomId;
        const room = await this.roomRepository.findOne({
          where: { id: roomId },
        });

        await client.join(roomId);
        client.emit('serverResponseNewRoom', room);
      }

      // Gửi lại message về client
      client.emit('serverResponseMessage', message);

      const messageSend: MessageSend = {
        message: payload.content,
        user_id: userId,
        room_id: payload.roomId,
      };

      // Gọi api message
      if (payload.image) {
        const response = await axios.get(payload.image, {
          responseType: 'arraybuffer',
        });

        const image = response.data;

        messageSend.image = Buffer.from(image).toString('base64');
      }

      // Gửi message cho AI
      this.aiClientService.sendMessage(messageSend);
    } catch (error: any) {
      const errorPayload = {
        message:
          error?.message ||
          'Có lỗi xảy ra khi gửi tin nhắn. Vui lòng thử lại sau.',
        code: error?.code,
        stage: 'handleMessage',
      };

      this.logger.error(error.message, error.stack);

      client.emit('serverResponseError', errorPayload);
    }
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(client: Socket, payload: any) {
    if (!payload?.roomId) return;
    await client.join(payload.roomId);
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(client: Socket, payload: any) {
    if (!payload?.roomId) return;
    await client.leave(payload.roomId);
  }

  @SubscribeMessage('stopStream')
  handleStopStream() {
    this.aiClientService.stopStream();
  }

  async sendMessageToClient(roomId: string, data: any) {
    // Kiểm tra AI gửi done thì lưu message đó vào database
    if (data?.type === 'done') {
      const payload: CreateMessageDTO = {
        content: data.answer,
        roomId: roomId,
        sendBy: SenderEnum.AI,
      };

      const message = await this.messageService.createMessage(payload);

      this.server.to(roomId).emit('serverResponseAIMessage', message);
    }

    this.server.to(roomId).emit('aiResponse', data);
  }
}
