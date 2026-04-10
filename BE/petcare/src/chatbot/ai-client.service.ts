import {
  forwardRef,
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { io, Socket as ClientSocket } from 'socket.io-client';
import { ChatBotGateway } from 'src/chatbot/chatBot.gateway';

@Injectable()
export class AiClientService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AiClientService.name);
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
      reconnectionDelay: 3000,
    });

    this.socket.on('connect', () => {
      this.logger.log(`Connected to AI: ${this.socket.id}`);
    });

    this.socket.on('disconnect', () => {
      this.logger.warn(`Disconnect to AI: ${this.socket.id}`);
    });

    this.socket.on('connect_error', (error) => {
      this.logger.error(`AI connection error: ${error.message}`, error.stack);
    });

    this.socket.io.on('reconnect_failed', () => {
      this.logger.error('AI server unreachable after 3 attempts');
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

    this.socket.emit('chat_event', data);
  }
}
