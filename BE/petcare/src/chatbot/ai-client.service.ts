import {
  forwardRef,
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { io, Socket as ClientSocket } from 'socket.io-client';
import { ChatBotGateway } from 'src/chatbot/chatBot.gateway';

@Injectable()
export class AiClientService implements OnModuleInit, OnModuleDestroy {
  private socket: ClientSocket;

  constructor(
    @Inject(forwardRef(() => ChatBotGateway))
    private readonly chatBotGateway: ChatBotGateway,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    this.socket = io(this.configService.get<string>('LINK_CONNECT_AI'), {
      transports: ['websocket'],
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Connected to AI:', this.socket.id);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnect to AI', this.socket.id);
    });

    this.socket.on('connect_error', (error) => {
      console.error('AI connection error:', error.message);
    });

    this.socket.io.on('reconnect_failed', () => {
      console.error('AI server unreachable after 3 attempts');
    });

    this.socket.on('chat_response', (data) => {
      this.chatBotGateway.sendMessageToClient(data.room_id, data);
    });
  }

  onModuleDestroy() {
    this.socket.disconnect();
  }

  stopStream() {
    this.socket.emit('stop_chat');
  }

  sendMessage(data: any) {
    if (!this.socket) {
      throw new ServiceUnavailableException('Chưa khởi tạo kết nối tới AI');
    }

    if (!this.socket.connected) {
      throw new ServiceUnavailableException(
        'AI server chưa sẵn sàng. Vui lòng thử lại',
      );
    }

    console.log(data);
    this.socket.emit('chat_event', data);
  }
}
