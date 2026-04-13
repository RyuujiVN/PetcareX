import 'dart:async';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;

import '../../../core/configs/app_config.dart';
import 'models/chat_models.dart';

class ChatSocketService {
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  io.Socket? _socket;

  void Function()? onConnected;
  void Function()? onDisconnected;
  void Function(ChatRoom room)? onNewRoom;
  void Function(ChatMessage message)? onUserMessage;
  void Function(String chunk)? onAiChunk;
  void Function()? onAiStreamDone;
  void Function(ChatMessage message)? onAiFinalMessage;
  void Function(dynamic error)? onError;

  bool get isConnected => _socket?.connected ?? false;

  Future<void> connect() async {
    final token = await _storage.read(key: 'accessToken');
    final socketUrl = '${AppConfig.baseUrl}/chat';
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
          .setReconnectionAttempts(20)
          .setReconnectionDelay(1000)
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
      ..on('serverResponseNewRoom', (data) {
        if (data is Map) {
          onNewRoom?.call(ChatRoom.fromJson(Map<String, dynamic>.from(data)));
        }
      })
      ..on('serverResponseMessage', (data) {
        if (data is Map) {
          onUserMessage?.call(
            ChatMessage.fromJson(Map<String, dynamic>.from(data)),
          );
        }
      })
      ..on('newMessage', (data) {
        if (data is Map) {
          onUserMessage?.call(
            ChatMessage.fromJson(Map<String, dynamic>.from(data)),
          );
        }
      })
      ..on('messageCreated', (data) {
        if (data is Map) {
          onUserMessage?.call(
            ChatMessage.fromJson(Map<String, dynamic>.from(data)),
          );
        }
      })
      ..on('aiResponse', (data) {
        if (data is Map) {
          final map = Map<String, dynamic>.from(data);
          final responseType = (map['type']?.toString().toLowerCase() ?? '');
          final answer =
              (map['token'] ?? map['answer'] ?? map['content'] ?? '').toString();
          if (responseType == 'token' ||
              responseType == 'chunk' ||
              responseType.isEmpty) {
            if (answer.isNotEmpty) onAiChunk?.call(answer);
          } else if (responseType == 'done') {
            if (answer.isNotEmpty) onAiChunk?.call(answer);
            onAiStreamDone?.call();
          }
        } else if (data is String && data.trim().isNotEmpty) {
          onAiChunk?.call(data);
        }
      })
      ..on('ai_message', (data) {
        if (data is Map) {
          final map = Map<String, dynamic>.from(data);
          final text =
              (map['token'] ?? map['answer'] ?? map['content'] ?? '').toString();
          if (text.isNotEmpty) {
            onAiChunk?.call(text);
          }
        }
      })
      ..on('serverResponseAIMessage', (data) {
        if (data is Map) {
          onAiFinalMessage?.call(
            ChatMessage.fromJson(Map<String, dynamic>.from(data)),
          );
        }
      })
      ..on('aiFinalMessage', (data) {
        if (data is Map) {
          onAiFinalMessage?.call(
            ChatMessage.fromJson(Map<String, dynamic>.from(data)),
          );
        }
      })
      ..onConnectError((error) {
        onError?.call(error);
      })
      ..onError((error) {
        onError?.call(error);
      })
      ..on('connect_error', (error) {
        onError?.call(error);
      })
      ..on('exception', (error) {
        onError?.call(error);
      })
      ..on('error', (error) {
        onError?.call(error);
      });

    _socket!.connect();
  }

  Future<bool> ensureConnected(
      {Duration timeout = const Duration(seconds: 5)}) async {
    await connect();
    if (isConnected) return true;
    final socket = _socket;
    if (socket == null) return false;

    final completer = Completer<bool>();
    late void Function(dynamic) onConnectHandler;
    late void Function(dynamic) onErrorHandler;

    onConnectHandler = (_) {
      if (!completer.isCompleted) completer.complete(true);
    };
    onErrorHandler = (_) {
      if (!completer.isCompleted) completer.complete(false);
    };

    socket.on('connect', onConnectHandler);
    socket.on('connect_error', onErrorHandler);

    try {
      final result =
          await completer.future.timeout(timeout, onTimeout: () => false);
      return result;
    } finally {
      socket.off('connect', onConnectHandler);
      socket.off('connect_error', onErrorHandler);
    }
  }

  void joinRoom(String roomId) {
    _socket?.emit('joinRoom', {'roomId': roomId});
  }

  void leaveRoom(String roomId) {
    _socket?.emit('leaveRoom', {'roomId': roomId});
  }

  void sendMessage({
    required String content,
    String? roomId,
  }) {
    if (!isConnected) {
      throw Exception('Socket is not connected');
    }
    if (roomId != null && roomId.trim().isNotEmpty) {
      _socket?.emit('joinRoom', {'roomId': roomId});
    }
    final payload = {'roomId': roomId, 'content': content, 'sendBy': 'USER'};
    _socket?.emit('message', payload);
    _socket?.emit('sendMessage', payload);
  }

  void stopStream() {
    _socket?.emit('stopStream');
  }

  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
  }
}
