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
import { forwardRef, Inject } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import { SenderEnum } from 'src/common/enums/sender.enum';
import { ChatbotRoom } from './entities/chatbot-room.entity';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/chat',
})
export class ChatBotGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly messageService: MessageService,
    private readonly authService: AuthService,
    @Inject(forwardRef(() => AiClientService))
    private readonly aiClientService: AiClientService,
  ) {}

  async handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    try {
      const accessToken = client.handshake.auth?.accessToken;

      const user = await this.authService.verifyToken(accessToken);

      client.data.user = user;
    } catch (error) {
      console.log(error);

      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('message')
  async handleMessage(client: Socket, payload: CreateMessageDTO) {
    // Tạo mới message
    const userId = client.data.user?.id;
    const message = await this.messageService.createMessage(payload, userId);

    // Nếu client chưa có `roomId` (tin nhắn đầu tiên) thì sẽ tạo room mới và sau đó để client join room lại.
    const roomId = message?.roomId;
    if (roomId) {
      client.join(roomId);
    }

    // Gửi lại message về client
    client.emit('serverResponseMessage', message);

    const messageSend = {
      message: payload.content,
      user_id: userId,
      room_id: payload.roomId,
    };

    // Gửi message cho AI
    this.aiClientService.sendMessage(messageSend);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(client: Socket, payload: any) {
    if (!payload?.roomId) return;
    client.join(payload.roomId);
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(client: Socket, payload: any) {
    if (!payload?.roomId) return;
    client.leave(payload.roomId);
  }

  @SubscribeMessage('stopStream')
  async handleStopStream(client: Socket, payload: any) {
    const message = await this.messageService.createMessage(payload);
    this.server.to(payload.roomId).emit('serverResponseAIMessage', message);

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
