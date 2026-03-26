import {
  forwardRef,
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
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
    });

    this.socket.on('connect', () => {
      console.log('Connected to AI:', this.socket.id);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnect to AI', this.socket.id);
    });

    this.socket.on('chat_response', (data) => {
      this.chatBotGateway.sendMessageToClient(data.user_id, data);
    });
  }

  onModuleDestroy() {
    this.socket.disconnect();
  }

  sendMessage(data) {
    const payload = {
      message: data.content,
      user_id: data.roomId,
      room_id: '',
    };

    this.socket.emit('chat_event', payload);
  }
}
