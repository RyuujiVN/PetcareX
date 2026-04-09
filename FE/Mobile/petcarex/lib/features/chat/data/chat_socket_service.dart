import 'dart:async';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;

import '../../../core/configs/app_config.dart';
import '../../../core/utils/logger.dart';
import 'models/chat_models.dart';

class ChatSocketService {
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  io.Socket? _socket;

  void Function()? onConnected;
  void Function()? onDisconnected;
  void Function(ChatRoom room)? onNewRoom;
  void Function(ChatMessage message)? onUserMessage;
  void Function(String chunk)? onAiChunk;
  void Function(ChatMessage message)? onAiFinalMessage;
  void Function(dynamic error)? onError;

  bool get isConnected => _socket?.connected ?? false;

  Future<void> connect() async {
    final token = await _storage.read(key: 'accessToken');
    final socketUrl = '${AppConfig.baseUrl}/chat';
    final normalizedToken = token ?? '';
    AppLogger.logError(
      '[CHAT][SOCKET] connect() url=$socketUrl token=${normalizedToken.isNotEmpty ? 'present' : 'missing'}',
    );

    if (_socket != null) {
      // If socket already exists, refresh auth token and force reconnect when needed.
      _socket!.auth = {'accessToken': normalizedToken};
      if (_socket!.connected) {
        AppLogger.logError('[CHAT][SOCKET] already connected');
        return;
      }
      AppLogger.logError('[CHAT][SOCKET] reconnect existing socket');
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
        AppLogger.logError('[CHAT][SOCKET] connected id=${_socket?.id}');
        onConnected?.call();
      })
      ..onDisconnect((_) {
        AppLogger.logError('[CHAT][SOCKET] disconnected');
        onDisconnected?.call();
      })
      ..onAny((event, data) {
        AppLogger.logError('[CHAT][SOCKET] onAny event=$event data=$data');
      })
      ..on('serverResponseNewRoom', (data) {
        AppLogger.logError('[CHAT][SOCKET] event=serverResponseNewRoom data=$data');
        if (data is Map) {
          onNewRoom?.call(ChatRoom.fromJson(Map<String, dynamic>.from(data)));
        }
      })
      ..on('serverResponseMessage', (data) {
        AppLogger.logError('[CHAT][SOCKET] event=serverResponseMessage data=$data');
        if (data is Map) {
          onUserMessage?.call(
            ChatMessage.fromJson(Map<String, dynamic>.from(data)),
          );
        }
      })
      ..on('newMessage', (data) {
        AppLogger.logError('[CHAT][SOCKET] event=newMessage data=$data');
        if (data is Map) {
          onUserMessage?.call(
            ChatMessage.fromJson(Map<String, dynamic>.from(data)),
          );
        }
      })
      ..on('messageCreated', (data) {
        AppLogger.logError('[CHAT][SOCKET] event=messageCreated data=$data');
        if (data is Map) {
          onUserMessage?.call(
            ChatMessage.fromJson(Map<String, dynamic>.from(data)),
          );
        }
      })
      ..on('aiResponse', (data) {
        AppLogger.logError('[CHAT][SOCKET] event=aiResponse data=$data');
        if (data is Map) {
          final map = Map<String, dynamic>.from(data);
          final responseType = (map['type']?.toString().toLowerCase() ?? '');
          final answer = (map['answer'] ?? map['content'] ?? '').toString();
          if (responseType == 'chunk' || responseType.isEmpty) {
            if (answer.isNotEmpty) onAiChunk?.call(answer);
          } else if (responseType == 'done' && answer.isNotEmpty) {
            // Some AI servers only send done with full answer, no final DB event.
            onAiChunk?.call(answer);
          }
        } else if (data is String && data.trim().isNotEmpty) {
          onAiChunk?.call(data);
        }
      })
      ..on('ai_message', (data) {
        AppLogger.logError('[CHAT][SOCKET] event=ai_message data=$data');
        if (data is Map) {
          final map = Map<String, dynamic>.from(data);
          final text = (map['answer'] ?? map['content'] ?? '').toString();
          if (text.isNotEmpty) {
            onAiChunk?.call(text);
          }
        }
      })
      ..on('serverResponseAIMessage', (data) {
        AppLogger.logError('[CHAT][SOCKET] event=serverResponseAIMessage data=$data');
        if (data is Map) {
          onAiFinalMessage?.call(
            ChatMessage.fromJson(Map<String, dynamic>.from(data)),
          );
        }
      })
      ..on('aiFinalMessage', (data) {
        AppLogger.logError('[CHAT][SOCKET] event=aiFinalMessage data=$data');
        if (data is Map) {
          onAiFinalMessage?.call(
            ChatMessage.fromJson(Map<String, dynamic>.from(data)),
          );
        }
      })
      ..onConnectError((error) {
        AppLogger.logError('[CHAT][SOCKET] onConnectError', error);
        onError?.call(error);
      })
      ..onError((error) {
        AppLogger.logError('[CHAT][SOCKET] onError', error);
        onError?.call(error);
      })
      ..on('connect_error', (error) {
        AppLogger.logError('[CHAT][SOCKET] connect_error', error);
        onError?.call(error);
      })
      ..on('exception', (error) {
        AppLogger.logError('[CHAT][SOCKET] exception', error);
        onError?.call(error);
      })
      ..on('error', (error) {
        AppLogger.logError('[CHAT][SOCKET] event=error', error);
        onError?.call(error);
      });

    _socket!.connect();
  }

  Future<bool> ensureConnected({Duration timeout = const Duration(seconds: 5)}) async {
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
      final result = await completer.future.timeout(timeout, onTimeout: () => false);
      return result;
    } finally {
      socket.off('connect', onConnectHandler);
      socket.off('connect_error', onErrorHandler);
    }
  }

  void joinRoom(String roomId) {
    AppLogger.logError('[CHAT][SOCKET] emit joinRoom roomId=$roomId');
    _socket?.emit('joinRoom', {'roomId': roomId});
  }

  void leaveRoom(String roomId) {
    AppLogger.logError('[CHAT][SOCKET] emit leaveRoom roomId=$roomId');
    _socket?.emit('leaveRoom', {'roomId': roomId});
  }

  void sendMessage({
    required String content,
    String? roomId,
  }) {
    if (!isConnected) {
      AppLogger.logError('[CHAT][SOCKET] emit message blocked: not connected');
      throw Exception('Socket is not connected');
    }
    if (roomId != null && roomId.trim().isNotEmpty) {
      AppLogger.logError('[CHAT][SOCKET] auto join before message roomId=$roomId');
      _socket?.emit('joinRoom', {'roomId': roomId});
    }
    AppLogger.logError(
      '[CHAT][SOCKET] emit message roomId=$roomId contentLength=${content.length}',
    );
    final payload = {'roomId': roomId, 'content': content, 'sendBy': 'USER'};
    _socket?.emit('message', payload);
    AppLogger.logError('[CHAT][SOCKET] emit sendMessage fallback');
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
