import 'package:flutter/foundation.dart';

import '../../../../core/services/notification_socket_service.dart';
import '../../data/models/notification_model.dart';
import '../../data/repositories/notification_repository.dart';

class NotificationProvider extends ChangeNotifier {
  final NotificationRepository _repository = NotificationRepository();
  final NotificationSocketService _socketService =
      NotificationSocketService();

  List<NotificationModel> _notifications = [];
  int _totalUnread = 0;
  bool _isLoading = false;
  bool _hasMore = true;
  String _filter = 'ALL';

  List<NotificationModel> get notifications => _notifications;
  int get totalUnread => _totalUnread;
  bool get isLoading => _isLoading;
  bool get hasMore => _hasMore;
  String get filter => _filter;

  /// Connect socket + load initial data
  Future<void> init() async {
    _setupSocket();
    await fetchNotifications(refresh: true);
  }

  void _setupSocket() {
    _socketService.onNewNotification = (notification) {
      // Prepend new notification at top
      _notifications.insert(0, notification);
      _totalUnread++;
      notifyListeners();
    };
    _socketService.connect();
  }

  /// Fetch notifications from REST API
  Future<void> fetchNotifications({bool refresh = false}) async {
    if (_isLoading) return;

    _isLoading = true;
    if (refresh) notifyListeners();

    DateTime? cursor;
    if (!refresh && _notifications.isNotEmpty) {
      cursor = _notifications.last.createdAt;
    }

    final result = await _repository.getNotifications(
      limit: 20,
      filter: _filter,
      createdAt: refresh ? null : cursor,
    );

    if (refresh) {
      _notifications = result.data;
    } else {
      // Deduplicate
      final existingIds = _notifications.map((n) => n.id).toSet();
      final newItems =
          result.data.where((n) => !existingIds.contains(n.id)).toList();
      _notifications.addAll(newItems);
    }

    _totalUnread = result.totalUnread;
    _hasMore = result.data.length >= 20;
    _isLoading = false;
    notifyListeners();
  }

  /// Load more (cursor-based pagination)
  Future<void> loadMore() async {
    if (!_hasMore || _isLoading) return;
    await fetchNotifications(refresh: false);
  }

  /// Change filter (ALL / UNREAD)
  Future<void> setFilter(String newFilter) async {
    if (_filter == newFilter) return;
    _filter = newFilter;
    _hasMore = true;
    await fetchNotifications(refresh: true);
  }

  /// Mark one notification as read
  Future<void> markAsRead(String notificationId) async {
    // Optimistic update
    final idx = _notifications.indexWhere((n) => n.id == notificationId);
    if (idx != -1 && !_notifications[idx].isRead) {
      _notifications[idx] = _notifications[idx].copyWith(isRead: true);
      _totalUnread = (_totalUnread - 1).clamp(0, _totalUnread);
      notifyListeners();
    }

    await _repository.markOneAsRead(notificationId);
  }

  /// Mark all as read
  Future<void> markAllAsRead() async {
    // Optimistic update
    _notifications = _notifications
        .map((n) => n.isRead ? n : n.copyWith(isRead: true))
        .toList();
    _totalUnread = 0;
    notifyListeners();

    await _repository.markAllAsRead();
  }

  /// Cleanup on logout
  void clear() {
    _socketService.disconnect();
    _notifications = [];
    _totalUnread = 0;
    _isLoading = false;
    _hasMore = true;
    _filter = 'ALL';
    notifyListeners();
  }

  @override
  void dispose() {
    _socketService.disconnect();
    super.dispose();
  }
}
