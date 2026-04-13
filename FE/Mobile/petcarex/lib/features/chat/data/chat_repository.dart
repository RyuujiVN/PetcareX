import 'dart:convert';

import '../../../core/network/api_client.dart';
import '../../../core/network/api_helper.dart';
import 'models/chat_models.dart';

class ChatRepository {
  final ApiClient _apiClient = ApiClient();

  Future<ChatRoom?> createRoom({String? name}) async {
    final response = await _apiClient.post(
      '/api/room',
      {'name': (name == null || name.trim().isEmpty) ? 'Cuoc tro chuyen moi' : name.trim()},
    );
    if (response.statusCode != 200 && response.statusCode != 201) {
      return null;
    }
    final dynamic raw = jsonDecode(response.body);
    if (raw is Map<String, dynamic>) {
      return ChatRoom.fromJson(raw);
    }
    return null;
  }

  Future<PagedResult<ChatRoom>> getRooms({
    int limit = 10,
    String? createdAt,
  }) async {
    final endpoint = ApiHelper.chatRoomsEndpoint(
      limit: limit,
      createdAt: createdAt,
    );
    final response = await _apiClient.get(endpoint);
    if (response.statusCode != 200) {
      return const PagedResult(
        data: [],
        meta: CursorPaginationMeta(limit: 10, hasMore: false),
      );
    }

    final dynamic raw = jsonDecode(response.body);
    final List<ChatRoom> rooms;
    CursorPaginationMeta meta = const CursorPaginationMeta(
      limit: 10,
      hasMore: false,
    );

    if (raw is List) {
      rooms = raw
          .whereType<Map>()
          .map((item) => ChatRoom.fromJson(Map<String, dynamic>.from(item)))
          .toList();
    } else if (raw is Map<String, dynamic>) {
      final dataRaw = raw['data'] ?? raw['items'] ?? raw['rooms'];
      final metaRaw = raw['meta'];
      rooms = dataRaw is List
          ? dataRaw
              .whereType<Map>()
              .map((item) => ChatRoom.fromJson(Map<String, dynamic>.from(item)))
              .toList()
          : <ChatRoom>[];
      if (metaRaw is Map) {
        meta = CursorPaginationMeta.fromJson(Map<String, dynamic>.from(metaRaw));
      } else {
        meta = CursorPaginationMeta(limit: limit, hasMore: rooms.length >= limit);
      }
    } else {
      return const PagedResult(
        data: [],
        meta: CursorPaginationMeta(limit: 10, hasMore: false),
      );
    }

    return PagedResult(data: rooms, meta: meta);
  }

  Future<PagedResult<ChatMessage>> getMessages(
    String roomId, {
    int limit = 10,
    String? createdAt,
  }) async {
    final endpoint = ApiHelper.chatMessagesEndpoint(
      roomId,
      limit: limit,
      createdAt: createdAt,
    );
    final response = await _apiClient.get(endpoint);
    if (response.statusCode != 200) {
      return const PagedResult(
        data: [],
        meta: CursorPaginationMeta(limit: 10, hasMore: false),
      );
    }

    final dynamic raw = jsonDecode(response.body);
    final List<ChatMessage> messages;
    CursorPaginationMeta meta = const CursorPaginationMeta(
      limit: 10,
      hasMore: false,
    );

    if (raw is List) {
      messages = raw
          .whereType<Map>()
          .map((item) => ChatMessage.fromJson(Map<String, dynamic>.from(item)))
          .toList();
      meta = CursorPaginationMeta(limit: limit, hasMore: messages.length >= limit);
    } else if (raw is Map<String, dynamic>) {
      final dataRaw = raw['data'] ?? raw['items'] ?? raw['messages'];
      final metaRaw = raw['meta'];
      messages = dataRaw is List
          ? dataRaw
              .whereType<Map>()
              .map(
                (item) => ChatMessage.fromJson(Map<String, dynamic>.from(item)),
              )
              .toList()
          : <ChatMessage>[];
      if (metaRaw is Map) {
        meta = CursorPaginationMeta.fromJson(Map<String, dynamic>.from(metaRaw));
      } else {
        meta = CursorPaginationMeta(limit: limit, hasMore: messages.length >= limit);
      }
    } else {
      return const PagedResult(
        data: [],
        meta: CursorPaginationMeta(limit: 10, hasMore: false),
      );
    }

    messages.sort((a, b) => a.createdAt.compareTo(b.createdAt));
    return PagedResult(data: messages, meta: meta);
  }

  /// PATCH `/api/room/{id}` — Sửa tên đoạn chat (UpdateRoomDTO).
  /// `(false, null)` = lỗi mạng hoặc HTTP không thành công.
  /// `(true, room)` = parse được body; `(true, null)` = 200 nhưng body trống/không parse (cập nhật tên cục bộ).
  Future<(bool, ChatRoom?)> updateRoomName(String roomId, String name) async {
    final trimmed = name.trim();
    if (trimmed.isEmpty || roomId.isEmpty) {
      return (false, null);
    }
    final response = await _apiClient.patch(
      '/api/room/$roomId',
      {'name': trimmed},
    );
    if (response.statusCode != 200) {
      return (false, null);
    }
    final body = response.body.trim();
    if (body.isEmpty) {
      return (true, null);
    }
    try {
      final dynamic raw = jsonDecode(body);
      if (raw is Map<String, dynamic>) {
        return (true, ChatRoom.fromJson(raw));
      }
    } catch (_) {}
    return (true, null);
  }

  /// DELETE `/api/room/{id}` — Xoá đoạn chat.
  Future<bool> deleteRoom(String roomId) async {
    if (roomId.isEmpty) return false;
    final response = await _apiClient.delete('/api/room/$roomId');
    return response.statusCode == 200 || response.statusCode == 204;
  }
}
