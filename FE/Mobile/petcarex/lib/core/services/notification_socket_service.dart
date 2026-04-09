import 'dart:async';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;

import '../../features/notification/data/models/notification_model.dart';
import '../configs/app_config.dart';

class NotificationSocketService {
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  io.Socket? _socket;

  void Function(NotificationModel notification)? onNewNotification;
  void Function()? onConnected;
  void Function()? onDisconnected;

  bool get isConnected => _socket?.connected ?? false;

  Future<void> connect() async {
    final token = await _storage.read(key: 'accessToken');
    final socketUrl = '${AppConfig.baseUrl}/notification';
    final normalizedToken = token ?? '';

    if (_socket != null) {
      _socket!.auth = {'accessToken': normalizedToken};
      if (_socket!.connected) return;
      _socket!.connect();
      return;
    }

    _socket = io.io(
      socketUrl,
      io.OptionBuilder()
          .setTransports(['websocket'])
          .disableAutoConnect()
          .enableReconnection()
          .setReconnectionAttempts(15)
          .setReconnectionDelay(3000)
          .setAuth({'accessToken': normalizedToken})
          .build(),
    );

    _socket!
      ..onConnect((_) {
        onConnected?.call();
      })
      ..onDisconnect((_) {
        onDisconnected?.call();
      })
      ..on('severSendNotification', (data) {
        if (data is Map) {
          final notification =
              NotificationModel.fromJson(Map<String, dynamic>.from(data));
          onNewNotification?.call(notification);
        }
      });

    _socket!.connect();
  }

  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
  }
}
