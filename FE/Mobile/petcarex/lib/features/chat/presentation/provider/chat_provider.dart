import 'package:flutter/material.dart';

import '../../../../core/utils/logger.dart';
import '../../data/chat_repository.dart';
import '../../data/chat_socket_service.dart';
import '../../data/models/chat_models.dart';

class ChatProvider extends ChangeNotifier {
  final ChatRepository _repository = ChatRepository();
  final ChatSocketService _socketService = ChatSocketService();

  List<ChatRoom> _rooms = [];
  List<ChatMessage> _messages = [];
  String? _currentRoomId;
  String? _errorMessage;
  bool _isLoadingRooms = false;
  bool _isLoadingMessages = false;
  bool _isLoadingMoreMessages = false;
  bool _hasMoreMessages = true;
  String? _oldestMessageCursor;
  String? _streamingMessageId;
  int _localMessageSeed = 0;
  final Map<String, DateTime> _pendingMessageDeadline = {};

  List<ChatRoom> get rooms => _rooms;
  List<ChatMessage> get messages => _messages;
  String? get currentRoomId => _currentRoomId;
  String? get errorMessage => _errorMessage;
  bool get isLoadingRooms => _isLoadingRooms;
  bool get isLoadingMessages => _isLoadingMessages;
  bool get isLoadingMoreMessages => _isLoadingMoreMessages;
  bool get isConnected => _socketService.isConnected;

  ChatProvider() {
    _bindSocketEvents();
  }

  void _bindSocketEvents() {
    _socketService.onConnected = () {
      if (_currentRoomId != null && _currentRoomId!.isNotEmpty) {
        _socketService.joinRoom(_currentRoomId!);
      }
      notifyListeners();
    };

    _socketService.onDisconnected = () {
      AppLogger.logError('[CHAT][PROVIDER] socket disconnected');
      notifyListeners();
    };

    _socketService.onError = (error) {
      AppLogger.logError('[CHAT][PROVIDER] socket error', error);
      _errorMessage = error?.toString() ?? 'Socket error';
      notifyListeners();
    };

    _socketService.onNewRoom = (room) {
      _currentRoomId ??= room.id;
      _upsertRoom(room);
      if (_currentRoomId == room.id) {
        _socketService.joinRoom(room.id);
      }
      notifyListeners();
    };

    _socketService.onUserMessage = (serverMessage) {
      AppLogger.logError(
        '[CHAT][PROVIDER] received serverResponseMessage roomId=${serverMessage.roomId}',
      );
      _replacePendingUserMessage(serverMessage);
      notifyListeners();
    };

    _socketService.onAiChunk = (chunk) {
      _appendAiChunk(chunk);
      notifyListeners();
    };

    _socketService.onAiFinalMessage = (serverAiMessage) {
      AppLogger.logError(
        '[CHAT][PROVIDER] received serverResponseAIMessage roomId=${serverAiMessage.roomId}',
      );
      _finalizeAiMessage(serverAiMessage);
      _upsertRoomWithMessage(serverAiMessage);
      notifyListeners();
    };
  }

  Future<void> initialize() async {
    AppLogger.logError('[CHAT][PROVIDER] initialize');
    await connectSocket();
    await fetchRooms();
  }

  Future<void> connectSocket() async {
    AppLogger.logError('[CHAT][PROVIDER] connectSocket');
    await _socketService.connect();
  }

  Future<void> fetchRooms() async {
    AppLogger.logError('[CHAT][PROVIDER] fetchRooms start');
    _isLoadingRooms = true;
    _errorMessage = null;
    notifyListeners();
    try {
      final result = await _repository.getRooms(limit: 20);
      AppLogger.logError(
        '[CHAT][PROVIDER] fetchRooms success count=${result.data.length}',
      );
      _rooms = result.data;
      _rooms.sort(_roomSortComparer);
      if (_currentRoomId == null && _rooms.isNotEmpty) {
        _currentRoomId = _rooms.first.id;
        await fetchMessages(roomId: _currentRoomId, refresh: true);
        _socketService.joinRoom(_currentRoomId!);
      }
    } catch (e) {
      AppLogger.logError('[CHAT][PROVIDER] fetchRooms error', e);
      _errorMessage = e.toString();
    } finally {
      _isLoadingRooms = false;
      notifyListeners();
    }
  }

  Future<void> selectRoom(String roomId) async {
    if (roomId.isEmpty) return;
    if (_currentRoomId == roomId && _messages.isNotEmpty) return;

    if (_currentRoomId != null && _currentRoomId != roomId) {
      _socketService.leaveRoom(_currentRoomId!);
    }
    _currentRoomId = roomId;
    _socketService.joinRoom(roomId);
    await fetchMessages(roomId: roomId, refresh: true);
  }

  Future<void> fetchMessages({
    String? roomId,
    bool refresh = false,
  }) async {
    final targetRoomId = roomId ?? _currentRoomId;
    if (targetRoomId == null || targetRoomId.isEmpty) return;

    _isLoadingMessages = true;
    _errorMessage = null;
    if (refresh) {
      _messages = [];
      _oldestMessageCursor = null;
      _hasMoreMessages = true;
    }
    notifyListeners();

    try {
      final result = await _repository.getMessages(targetRoomId, limit: 20);
      AppLogger.logError(
        '[CHAT][PROVIDER] fetchMessages roomId=$targetRoomId count=${result.data.length}',
      );
      _messages = result.data;
      _hasMoreMessages = result.meta.hasMore;
      if (_messages.isNotEmpty) {
        _oldestMessageCursor = _messages.first.createdAt.toIso8601String();
      }
    } catch (e) {
      AppLogger.logError('[CHAT][PROVIDER] fetchMessages error', e);
      _errorMessage = e.toString();
    } finally {
      _isLoadingMessages = false;
      notifyListeners();
    }
  }

  Future<void> loadOlderMessages() async {
    final roomId = _currentRoomId;
    if (roomId == null ||
        roomId.isEmpty ||
        _isLoadingMoreMessages ||
        !_hasMoreMessages) {
      return;
    }

    _isLoadingMoreMessages = true;
    notifyListeners();
    try {
      final result = await _repository.getMessages(
        roomId,
        limit: 20,
        createdAt: _oldestMessageCursor,
      );

      if (result.data.isNotEmpty) {
        _messages = [...result.data, ..._messages];
        _messages.sort((a, b) => a.createdAt.compareTo(b.createdAt));
        _oldestMessageCursor = _messages.first.createdAt.toIso8601String();
      }

      _hasMoreMessages = result.meta.hasMore;
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoadingMoreMessages = false;
      notifyListeners();
    }
  }

  Future<void> sendUserMessage(String content) async {
    final trimmed = content.trim();
    if (trimmed.isEmpty) return;

    if (_currentRoomId == null || _currentRoomId!.isEmpty) {
      AppLogger.logError('[CHAT][PROVIDER] currentRoomId empty, creating room via REST');
      final createdRoom = await _repository.createRoom(
        name: trimmed.length > 24 ? '${trimmed.substring(0, 24)}...' : trimmed,
      );
      if (createdRoom == null) {
        _errorMessage = 'Khong tao duoc doan chat moi';
        notifyListeners();
        return;
      }
      _currentRoomId = createdRoom.id;
      _upsertRoom(createdRoom);
      _socketService.joinRoom(createdRoom.id);
    }

    final localMessage = ChatMessage(
      id: _nextLocalMessageId(),
      roomId: _currentRoomId!,
      role: 'user',
      content: trimmed,
      createdAt: DateTime.now(),
      status: ChatMessageStatus.sending,
      isStreaming: false,
    );

    _messages = [..._messages, localMessage];
    _pendingMessageDeadline[localMessage.id] = DateTime.now().add(
      const Duration(seconds: 15),
    );
    _upsertRoomWithMessage(localMessage);
    notifyListeners();

    try {
      if (!_socketService.isConnected) {
        AppLogger.logError('[CHAT][PROVIDER] socket not connected, reconnect');
      }
      final connected = await _socketService.ensureConnected();
      if (!connected) {
        AppLogger.logError('[CHAT][PROVIDER] socket connect timeout/fail');
        _markMessageAsError(localMessage.id);
        _errorMessage = 'Socket khong ket noi duoc';
        notifyListeners();
        return;
      }
      AppLogger.logError(
        '[CHAT][PROVIDER] sendUserMessage roomId=$_currentRoomId text="$trimmed"',
      );
      _socketService.sendMessage(content: trimmed, roomId: _currentRoomId);
      _schedulePendingTimeout(localMessage.id);
    } catch (e) {
      AppLogger.logError('[CHAT][PROVIDER] sendUserMessage error', e);
      _markMessageAsError(localMessage.id);
      notifyListeners();
    }
  }

  Future<void> retryMessage(String messageId) async {
    final idx = _messages.indexWhere((m) => m.id == messageId);
    if (idx == -1) return;
    final message = _messages[idx];
    if (message.status != ChatMessageStatus.error || !message.isUser) return;

    _messages[idx] = message.copyWith(status: ChatMessageStatus.sending);
    _pendingMessageDeadline[messageId] = DateTime.now().add(
      const Duration(seconds: 15),
    );
    notifyListeners();
    try {
      final connected = await _socketService.ensureConnected();
      if (!connected) {
        _messages[idx] = message.copyWith(status: ChatMessageStatus.error);
        _errorMessage = 'Socket khong ket noi duoc';
        notifyListeners();
        return;
      }
      _socketService.sendMessage(content: message.content, roomId: _currentRoomId);
      _schedulePendingTimeout(messageId);
    } catch (_) {
      _messages[idx] = message.copyWith(status: ChatMessageStatus.error);
      notifyListeners();
    }
  }

  void startNewConversation() {
    if (_currentRoomId != null) {
      _socketService.leaveRoom(_currentRoomId!);
    }
    _currentRoomId = null;
    _messages = [];
    _streamingMessageId = null;
    _oldestMessageCursor = null;
    _hasMoreMessages = true;
    notifyListeners();
  }

  void _replacePendingUserMessage(ChatMessage serverMessage) {
    final pendingIndex = _messages.lastIndexWhere(
      (msg) => msg.isUser && msg.status == ChatMessageStatus.sending,
    );
    if (pendingIndex != -1) {
      _pendingMessageDeadline.remove(_messages[pendingIndex].id);
      _messages[pendingIndex] = serverMessage.copyWith(
        status: ChatMessageStatus.sent,
      );
    } else {
      _messages = [..._messages, serverMessage.copyWith(status: ChatMessageStatus.sent)];
    }

    _currentRoomId = serverMessage.roomId.isNotEmpty ? serverMessage.roomId : _currentRoomId;
    _upsertRoomWithMessage(serverMessage);
  }

  void _appendAiChunk(String chunk) {
    if (_streamingMessageId == null) {
      final aiMessage = ChatMessage(
        id: _nextLocalMessageId(prefix: 'ai_stream'),
        roomId: _currentRoomId ?? '',
        role: 'assistant',
        content: chunk,
        createdAt: DateTime.now(),
        status: ChatMessageStatus.sent,
        isStreaming: true,
      );
      _streamingMessageId = aiMessage.id;
      _messages = [..._messages, aiMessage];
      return;
    }

    final idx = _messages.indexWhere((m) => m.id == _streamingMessageId);
    if (idx == -1) return;
    final current = _messages[idx];
    _messages[idx] = current.copyWith(
      content: '${current.content}$chunk',
      isStreaming: true,
    );
  }

  void _finalizeAiMessage(ChatMessage finalMessage) {
    if (_streamingMessageId != null) {
      final idx = _messages.indexWhere((m) => m.id == _streamingMessageId);
      if (idx != -1) {
        _messages[idx] = finalMessage.copyWith(
          status: ChatMessageStatus.sent,
          isStreaming: false,
        );
      } else {
        _messages = [..._messages, finalMessage.copyWith(isStreaming: false)];
      }
    } else {
      _messages = [..._messages, finalMessage.copyWith(isStreaming: false)];
    }
    _streamingMessageId = null;
    _messages.sort((a, b) => a.createdAt.compareTo(b.createdAt));
  }

  void _markMessageAsError(String localId) {
    final idx = _messages.indexWhere((msg) => msg.id == localId);
    if (idx == -1) return;
    _pendingMessageDeadline.remove(localId);
    _messages[idx] = _messages[idx].copyWith(status: ChatMessageStatus.error);
  }

  void _schedulePendingTimeout(String localMessageId) {
    Future.delayed(const Duration(seconds: 16), () {
      final deadline = _pendingMessageDeadline[localMessageId];
      if (deadline == null) return;
      if (DateTime.now().isBefore(deadline)) return;

      final idx = _messages.indexWhere((m) => m.id == localMessageId);
      if (idx == -1) {
        _pendingMessageDeadline.remove(localMessageId);
        return;
      }
      if (_messages[idx].status == ChatMessageStatus.sending) {
        _messages[idx] = _messages[idx].copyWith(status: ChatMessageStatus.error);
        _pendingMessageDeadline.remove(localMessageId);
        notifyListeners();
      }
    });
  }

  void _upsertRoomWithMessage(ChatMessage message) {
    final roomId = message.roomId;
    if (roomId.isEmpty) return;
    final index = _rooms.indexWhere((r) => r.id == roomId);
    if (index == -1) {
      _rooms = [
        ChatRoom(
          id: roomId,
          name: 'Cuoc tro chuyen',
          createdAt: message.createdAt,
          lastMessage: message.content,
          updatedAt: message.createdAt,
        ),
        ..._rooms,
      ];
    } else {
      final room = _rooms[index];
      _rooms[index] = ChatRoom(
        id: room.id,
        name: room.name,
        userId: room.userId,
        createdAt: room.createdAt,
        lastMessage: message.content,
        updatedAt: message.createdAt,
      );
    }
    _rooms.sort(_roomSortComparer);
  }

  void _upsertRoom(ChatRoom room) {
    final index = _rooms.indexWhere((r) => r.id == room.id);
    if (index == -1) {
      _rooms = [room, ..._rooms];
    } else {
      _rooms[index] = room;
    }
    _rooms.sort(_roomSortComparer);
  }

  int _roomSortComparer(ChatRoom a, ChatRoom b) {
    final left = a.updatedAt ?? a.createdAt;
    final right = b.updatedAt ?? b.createdAt;
    return right.compareTo(left);
  }

  String _nextLocalMessageId({String prefix = 'local'}) {
    _localMessageSeed += 1;
    return '$prefix-${DateTime.now().millisecondsSinceEpoch}-$_localMessageSeed';
  }

  @override
  void dispose() {
    _socketService.disconnect();
    super.dispose();
  }
}
