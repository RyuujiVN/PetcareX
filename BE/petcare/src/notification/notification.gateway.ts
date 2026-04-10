/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';

@WebSocketGateway({
  cors: '*',
  namespace: '/notification',
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private server: Server;
  private readonly logger = new Logger(NotificationGateway.name);

  constructor(private readonly authService: AuthService) {}

  async handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`User connected: ${client.id}`);
    try {
      const accessToken = client.handshake.auth?.accessToken;

      const user = await this.authService.verifyToken(accessToken);

      client.data.user = user;
      await client.join(user.id);
    } catch (error) {
      this.logger.error(error.message, error.stack);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.warn(`User disconnected: ${client.id}`);
    client.disconnect();
  }

  sendNotification(userId: string, data: any) {
    this.server.to(userId).emit('severSendNotification', data);
  }
}
