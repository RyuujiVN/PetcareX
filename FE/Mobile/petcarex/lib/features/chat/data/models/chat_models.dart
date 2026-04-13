enum ChatMessageStatus { sending, sent, error }

class ChatRoom {
  final String id;
  final String? userId;
  final String name;
  final DateTime createdAt;
  final String? lastMessage;
  final DateTime? updatedAt;

  const ChatRoom({
    required this.id,
    required this.name,
    required this.createdAt,
    this.userId,
    this.lastMessage,
    this.updatedAt,
  });

  factory ChatRoom.fromJson(Map<String, dynamic> json) {
    return ChatRoom(
      id: (json['id'] ?? '').toString(),
      userId: json['userId']?.toString(),
      name: (json['name'] ?? 'Cuoc tro chuyen').toString(),
      createdAt: _parseDateTime(json['createdAt']) ?? DateTime.now(),
      lastMessage: json['lastMessage']?.toString(),
      updatedAt: _parseDateTime(json['updatedAt']),
    );
  }

  ChatRoom copyWith({
    String? id,
    String? userId,
    String? name,
    DateTime? createdAt,
    String? lastMessage,
    DateTime? updatedAt,
  }) {
    return ChatRoom(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      name: name ?? this.name,
      createdAt: createdAt ?? this.createdAt,
      lastMessage: lastMessage ?? this.lastMessage,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

class ChatMessage {
  final String id;
  final String roomId;
  final String role;
  final String content;
  final DateTime createdAt;
  final ChatMessageStatus status;
  final bool isStreaming;

  const ChatMessage({
    required this.id,
    required this.roomId,
    required this.role,
    required this.content,
    required this.createdAt,
    this.status = ChatMessageStatus.sent,
    this.isStreaming = false,
  });

  bool get isUser => role == 'user';

  ChatMessage copyWith({
    String? id,
    String? roomId,
    String? role,
    String? content,
    DateTime? createdAt,
    ChatMessageStatus? status,
    bool? isStreaming,
  }) {
    return ChatMessage(
      id: id ?? this.id,
      roomId: roomId ?? this.roomId,
      role: role ?? this.role,
      content: content ?? this.content,
      createdAt: createdAt ?? this.createdAt,
      status: status ?? this.status,
      isStreaming: isStreaming ?? this.isStreaming,
    );
  }

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: (json['id'] ?? '').toString(),
      roomId: (json['roomId'] ?? '').toString(),
      role: _mapRole(json['sendBy']),
      content: (json['content'] ?? '').toString(),
      createdAt: _parseDateTime(json['createdAt']) ?? DateTime.now(),
      status: ChatMessageStatus.sent,
      isStreaming: false,
    );
  }
}

class CursorPaginationMeta {
  final int limit;
  final bool hasMore;

  const CursorPaginationMeta({
    required this.limit,
    required this.hasMore,
  });

  factory CursorPaginationMeta.fromJson(Map<String, dynamic> json) {
    return CursorPaginationMeta(
      limit: _parseInt(json['limit']),
      hasMore: _parseBool(json['hasMore']),
    );
  }
}

class PagedResult<T> {
  final List<T> data;
  final CursorPaginationMeta meta;

  const PagedResult({
    required this.data,
    required this.meta,
  });
}

String _mapRole(dynamic sendByRaw) {
  final normalized = (sendByRaw ?? '').toString().toLowerCase();
  if (normalized == 'user') return 'user';
  if (normalized == 'bot' || normalized == 'assistant' || normalized == 'ai') {
    return 'assistant';
  }
  return 'assistant';
}

DateTime? _parseDateTime(dynamic value) {
  if (value == null) return null;
  if (value is DateTime) return value;
  return DateTime.tryParse(value.toString());
}

int _parseInt(dynamic value) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  if (value is String) return int.tryParse(value) ?? 0;
  return 0;
}

bool _parseBool(dynamic value) {
  if (value is bool) return value;
  if (value is String) return value.toLowerCase() == 'true';
  if (value is num) return value != 0;
  return false;
}
