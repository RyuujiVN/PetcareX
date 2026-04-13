import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../l10n/generated/app_localizations.dart';
import '../data/models/chat_models.dart';
import 'provider/chat_provider.dart';

class ChatPage extends StatefulWidget {
  const ChatPage({super.key});

  @override
  State<ChatPage> createState() => _ChatPageState();
}

class _ChatPageState extends State<ChatPage> with SingleTickerProviderStateMixin {
  late final AnimationController _thinkingController;

  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  bool _initialized = false;
  int _lastMessageCount = 0;
  bool _scrollPostFrameQueued = false;

  @override
  void initState() {
    super.initState();
    _thinkingController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _thinkingController.dispose();
    _messageController.dispose();
    _scrollController
      ..removeListener(_onScroll)
      ..dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final chatProvider = context.watch<ChatProvider>();
    final l10n = AppLocalizations.of(context)!;
    final currentCount = chatProvider.messages.length;
    final hasStreaming = chatProvider.messages.any((m) => m.isStreaming);
    // Không được đổi state trong build; tối đa 1 post-frame scroll mỗi frame (tránh spam khi streaming).
    if ((currentCount != _lastMessageCount || hasStreaming) &&
        !_scrollPostFrameQueued) {
      _scrollPostFrameQueued = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _scrollPostFrameQueued = false;
        if (!mounted) return;
        _lastMessageCount = context.read<ChatProvider>().messages.length;
        _scrollToBottom();
      });
    }
    if (!_initialized) {
      _initialized = true;
      WidgetsBinding.instance.addPostFrameCallback((_) async {
        if (!mounted) return;
        await context.read<ChatProvider>().initialize();
      });
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.appBarBackground,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.textDark),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          l10n.chatAssistantTitle,
          style: TextStyle(color: AppColors.textDark, fontWeight: FontWeight.bold, fontSize: 18),
        ),
        actions: [
          IconButton(
            onPressed: () {},
            icon: const Icon(Icons.notifications_none, color: AppColors.textDark),
          ),
        ],
      ),
      body: Column(
        children: [
          _buildChatHistoryHeader(l10n, chatProvider),
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(16),
              itemCount: chatProvider.messages.length
                  + (chatProvider.isLoadingMoreMessages ? 1 : 0)
                  + (chatProvider.isWaitingAi ? 1 : 0),
              itemBuilder: (context, index) {
                final hasLoadingHeader = chatProvider.isLoadingMoreMessages;
                if (hasLoadingHeader && index == 0) {
                  return const Padding(
                    padding: EdgeInsets.only(bottom: 16),
                    child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
                  );
                }
                final adjustedIndex = hasLoadingHeader ? index - 1 : index;
                // Thinking indicator at the very end
                if (adjustedIndex == chatProvider.messages.length && chatProvider.isWaitingAi) {
                  return _buildThinkingBubble();
                }
                if (chatProvider.messages.isEmpty) {
                  return const SizedBox.shrink();
                }
                final msg = chatProvider.messages[adjustedIndex];
                return _buildChatBubble(msg);
              },
            ),
          ),
          _buildMessageInput(l10n),
        ],
      ),
    );
  }

  Widget _buildChatHistoryHeader(
    AppLocalizations l10n,
    ChatProvider chatProvider,
  ) {
    final currentRoomIndex = chatProvider.rooms.indexWhere(
      (room) => room.id == chatProvider.currentRoomId,
    );
    final ChatRoom? currentRoom = currentRoomIndex >= 0
        ? chatProvider.rooms[currentRoomIndex]
        : null;
    final roomTitle = currentRoom?.name.trim().isNotEmpty == true
        ? currentRoom!.name
        : l10n.chatNewConversation;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.formFillDisabled,
        border: const Border(bottom: BorderSide(color: AppColors.divider)),
      ),
      child: Row(
        children: [
          const Icon(Icons.history, size: 18, color: AppColors.textGrey),
          const SizedBox(width: 8),
          Expanded(
            child: GestureDetector(
              onTap: _showRoomHistorySheet,
              child: Row(
                children: [
                  Flexible(
                    child: Text(
                      roomTitle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppColors.textGrey,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                  const SizedBox(width: 4),
                  const Icon(
                    Icons.keyboard_arrow_down_rounded,
                    size: 18,
                    color: AppColors.textGrey,
                  ),
                ],
              ),
            ),
          ),
          TextButton.icon(
            onPressed: () {
              context.read<ChatProvider>().startNewConversation();
            },
            icon: const Icon(Icons.add, size: 16, color: AppColors.primary),
            label: Text(
              l10n.chatNewConversation,
              style: const TextStyle(
                fontSize: 12,
                color: AppColors.primary,
                fontWeight: FontWeight.bold,
              ),
            ),
          )
        ],
      ),
    );
  }

  Widget _buildThinkingBubble() {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            margin: const EdgeInsets.only(right: 8),
            padding: const EdgeInsets.all(6),
            decoration: const BoxDecoration(
                color: AppColors.primary, shape: BoxShape.circle),
            child: const Icon(Icons.smart_toy_outlined,
                color: AppColors.onPrimary, size: 16),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: AppColors.background,
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(16),
                topRight: Radius.circular(16),
                bottomLeft: Radius.circular(4),
                bottomRight: Radius.circular(16),
              ),
            ),
            child: AnimatedBuilder(
              animation: _thinkingController,
              builder: (context, child) {
                return Row(
                  mainAxisSize: MainAxisSize.min,
                  children: List.generate(3, (i) {
                    // Stagger each dot by 0.2
                    final delay = i * 0.2;
                    final t = (_thinkingController.value + delay) % 1.0;
                    final opacity = (t < 0.5 ? t : 1.0 - t) * 2.0;
                    return Padding(
                      padding: EdgeInsets.only(right: i < 2 ? 4 : 0),
                      child: Opacity(
                        opacity: opacity.clamp(0.2, 1.0),
                        child: Container(
                          width: 8,
                          height: 8,
                          decoration: BoxDecoration(
                            color: AppColors.primary,
                            shape: BoxShape.circle,
                          ),
                        ),
                      ),
                    );
                  }),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildChatBubble(ChatMessage message) {
    final isMe = message.isUser;
    final time = DateFormat('hh:mm a').format(message.createdAt.toLocal());
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(
        crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: isMe ? MainAxisAlignment.end : MainAxisAlignment.start,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (!isMe)
                Container(
                  margin: const EdgeInsets.only(right: 8),
                  padding: const EdgeInsets.all(6),
                  decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
                  child: const Icon(Icons.smart_toy_outlined, color: AppColors.onPrimary, size: 16),
                ),
              Flexible(
                child: Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: isMe ? AppColors.primary : AppColors.background,
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(16),
                      topRight: const Radius.circular(16),
                      bottomLeft: Radius.circular(isMe ? 16 : 4),
                      bottomRight: Radius.circular(isMe ? 4 : 16),
                    ),
                  ),
                  child: Text(
                    message.isStreaming
                        ? '${message.content}▍'
                        : message.content,
                    style: TextStyle(color: isMe ? AppColors.onPrimary : AppColors.textDark, fontSize: 14, height: 1.4),
                  ),
                ),
              ),
              if (isMe)
                Container(
                  margin: const EdgeInsets.only(left: 8),
                  width: 30,
                  height: 30,
                  decoration: BoxDecoration(
                    color: AppColors.petAccent.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.person, size: 20, color: AppColors.petAccent),
                ),
            ],
          ),
          Padding(
            padding: EdgeInsets.only(top: 4, left: isMe ? 0 : 40, right: isMe ? 40 : 0),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(time, style: const TextStyle(fontSize: 10, color: AppColors.iconGrey)),
                if (isMe) ...[
                  const SizedBox(width: 6),
                  Text(
                    _statusText(message.status),
                    style: TextStyle(
                      fontSize: 10,
                      color: message.status == ChatMessageStatus.error
                          ? Colors.red
                          : AppColors.iconGrey,
                    ),
                  ),
                  if (message.status == ChatMessageStatus.error) ...[
                    const SizedBox(width: 6),
                    GestureDetector(
                      onTap: () {
                        context.read<ChatProvider>().retryMessage(message.id);
                      },
                      child: const Icon(
                        Icons.refresh,
                        size: 13,
                        color: Colors.red,
                      ),
                    ),
                  ],
                ],
              ],
            ),
          )
        ],
      ),
    );
  }

  Widget _buildMessageInput(AppLocalizations l10n) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: const BoxDecoration(
        color: AppColors.secondary,
        border: Border(top: BorderSide(color: AppColors.divider)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  decoration: BoxDecoration(
                    color: AppColors.background,
                    borderRadius: BorderRadius.circular(24),
                  ),
                  child: TextField(
                    controller: _messageController,
                    decoration: InputDecoration(
                      hintText: l10n.chatInputHint,
                      hintStyle: const TextStyle(fontSize: 13, color: AppColors.textGrey),
                      border: InputBorder.none,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Builder(builder: (ctx) {
                final isResponding = ctx.watch<ChatProvider>().isAiResponding;
                return Container(
                  decoration: BoxDecoration(
                    color: isResponding ? AppColors.error : AppColors.primary,
                    shape: BoxShape.circle,
                  ),
                  child: IconButton(
                    onPressed: isResponding
                        ? () => ctx.read<ChatProvider>().stopAiResponse()
                        : _handleSendMessage,
                    icon: Icon(
                      isResponding ? Icons.stop_rounded : Icons.send,
                      color: AppColors.onPrimary,
                      size: 20,
                    ),
                  ),
                );
              }),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'PetCar AI chỉ hỗ trợ trao đổi các vấn đề mà thú cưng hay gặp phải. Hãy cân nhắc các thông tin sức khỏe trong app và tư vấn bác sĩ.',
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 10, color: AppColors.iconGrey),
          )
        ],
      ),
    );
  }

  void _handleSendMessage() {
    final text = _messageController.text.trim();
    if (text.isEmpty) return;
    context.read<ChatProvider>().sendUserMessage(text);
    _messageController.clear();
    _scrollToBottom(force: true);
  }

  Future<void> _showRoomHistorySheet() async {
    final provider = context.read<ChatProvider>();
    final l10n = AppLocalizations.of(context)!;
    await provider.fetchRooms();
    if (!mounted) return;
    if (provider.rooms.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(l10n.chatHistoryEmptyOrLoadFailed)),
      );
      return;
    }

    final selectedRoomId = await showModalBottomSheet<String>(
      context: context,
      backgroundColor: AppColors.background,
      showDragHandle: true,
      builder: (sheetContext) {
        return SafeArea(
          child: provider.rooms.isEmpty
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Text(
                      l10n.chatHistoryEmptyOrLoadFailed,
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: AppColors.textGrey),
                    ),
                  ),
                )
              : ListView.separated(
                  itemCount: provider.rooms.length,
                  separatorBuilder: (_, index) =>
                      const Divider(height: 1, color: AppColors.divider),
                  itemBuilder: (_, index) {
                    final room = provider.rooms[index];
                    final isSelected = room.id == provider.currentRoomId;
                    final subtitle = room.lastMessage?.trim().isNotEmpty == true
                        ? room.lastMessage!
                        : l10n.chatNoMessages;

                    return ListTile(
                      key: ValueKey<String>('room_tile_${room.id}'),
                      onTap: () => Navigator.of(sheetContext).pop(room.id),
                      leading: Icon(
                        Icons.chat_bubble_outline_rounded,
                        color:
                            isSelected ? AppColors.primary : AppColors.textGrey,
                      ),
                      title: Text(
                        room.name.trim().isNotEmpty
                            ? room.name
                            : l10n.chatConversationDefault,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      subtitle: Text(
                        subtitle,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                            fontSize: 12, color: AppColors.textGrey),
                      ),
                      trailing: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (isSelected)
                            const Padding(
                              padding: EdgeInsets.only(right: 4),
                              child: Icon(Icons.check_circle,
                                  color: AppColors.primary),
                            ),
                          PopupMenuButton<String>(
                            key: ValueKey<String>('room_menu_${room.id}'),
                            onSelected: (value) {
                              // Quan trọng: đẩy xử lý sang frame kế tiếp để popup route đóng hẳn.
                              WidgetsBinding.instance.addPostFrameCallback((_) async {
                                if (!mounted) return;

                                if (value == 'rename') {
                                  await _showRenameRoomDialog(context, room);
                                } else if (value == 'delete') {
                                  await _confirmDeleteRoom(context, room);

                                  if (!mounted) return;
                                  final provider = context.read<ChatProvider>();
                                  if (provider.rooms.isEmpty && sheetContext.mounted) {
                                    await Navigator.of(sheetContext).maybePop(); // đóng bottom sheet an toàn
                                  }
                                }
                              });
                            },
                            itemBuilder: (ctx) => [
                              PopupMenuItem(
                                value: 'rename',
                                child: Text(l10n.chatMenuRename),
                              ),
                              PopupMenuItem(
                                value: 'delete',
                                child: Text(l10n.chatMenuDelete),
                              ),
                            ],
                          ),
                        ],
                      ),
                    );
                  },
                ),
        );
      },
    );

    if (selectedRoomId != null && selectedRoomId != provider.currentRoomId) {
      await provider.selectRoom(selectedRoomId);
      if (!mounted) return;
      _scrollToBottom(force: true);
    }
  }

  Future<void> _showRenameRoomDialog(BuildContext pageContext, ChatRoom room) async {
    final l10n = AppLocalizations.of(pageContext)!;
    final chat = pageContext.read<ChatProvider>();
    final controller = TextEditingController(text: room.name);

    try {
      final newName = await showDialog<String>(
        context: pageContext,
        builder: (ctx) => AlertDialog(
          title: Text(l10n.chatRenameDialogTitle),
          content: TextField(
            controller: controller,
            decoration: InputDecoration(
              labelText: l10n.chatRenameDisplayNameLabel,
              hintText: l10n.chatRenameNewNameHint,
            ),
            onSubmitted: (v) => Navigator.pop(ctx, v.trim()),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: Text(l10n.cancel),
            ),
            TextButton(
              onPressed: () => Navigator.pop(ctx, controller.text.trim()),
              child: Text(l10n.save),
            ),
          ],
        ),
      );

      if (!mounted) return;
      final trimmed = (newName ?? '').trim();
      if (trimmed.isEmpty) return;
      if (trimmed == room.name.trim()) return;

      final ok = await chat.renameRoom(room.id, trimmed);
      if (!mounted) return;

      if (ok) {
        ScaffoldMessenger.maybeOf(pageContext)
            ?..hideCurrentSnackBar()
            ..showSnackBar(SnackBar(content: Text(l10n.chatRenamedSuccess)));
      }
    } finally {
      controller.dispose();
    }
  }

  Future<void> _confirmDeleteRoom(
    BuildContext dialogContext,
    ChatRoom room,
  ) async {
    final l10n = AppLocalizations.of(context)!;
    final provider = context.read<ChatProvider>();
    final title =
        room.name.trim().isNotEmpty ? room.name : l10n.chatConversationDefault;
    final confirm = await showDialog<bool>(
      context: dialogContext,
      useRootNavigator: true,
      builder: (ctx) => AlertDialog(
        title: Text(l10n.chatDeleteDialogTitle),
        content: Text(l10n.chatDeleteDialogContent(title)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(l10n.cancel),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(
              l10n.delete,
              style: TextStyle(color: Theme.of(ctx).colorScheme.error),
            ),
          ),
        ],
      ),
    );

    if (!mounted || confirm != true) return;

    final ok = await provider.deleteRoom(room.id);
    if (!mounted) return;
    if (ok) {
      ScaffoldMessenger.maybeOf(context)
        ?..hideCurrentSnackBar()
        ..showSnackBar(SnackBar(content: Text(l10n.chatDeletedSuccess)));
    } else {
      final err = provider.errorMessage ?? 'Không xóa được';
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(err)));
    }
  }

  String _statusText(ChatMessageStatus status) {
    final l10n = AppLocalizations.of(context)!;
    switch (status) {
      case ChatMessageStatus.sending:
        return l10n.chatStatusSending;
      case ChatMessageStatus.sent:
        return l10n.chatStatusSent;
      case ChatMessageStatus.error:
        return l10n.chatStatusError;
    }
  }

  void _onScroll() {
    if (!_scrollController.hasClients) return;
    if (_scrollController.offset <= 100) {
      context.read<ChatProvider>().loadOlderMessages();
    }
  }

  void _scrollToBottom({bool force = false}) {
    if (!_scrollController.hasClients) return;
    final position = _scrollController.position;
    final nearBottom = position.maxScrollExtent - position.pixels < 160;
    if (force || nearBottom) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!_scrollController.hasClients) return;
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOut,
        );
      });
    }
  }
}
