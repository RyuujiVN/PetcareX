import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../../../core/theme/app_colors.dart';
import '../data/models/chat_models.dart';
import 'provider/chat_provider.dart';

class ChatPage extends StatefulWidget {
  const ChatPage({super.key});

  @override
  State<ChatPage> createState() => _ChatPageState();
}

class _ChatPageState extends State<ChatPage> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  bool _initialized = false;
  int _lastMessageCount = 0;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController
      ..removeListener(_onScroll)
      ..dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final chatProvider = context.watch<ChatProvider>();
    final currentCount = chatProvider.messages.length;
    if (currentCount != _lastMessageCount) {
      _lastMessageCount = currentCount;
      _scrollToBottom();
    }
    if (!_initialized) {
      _initialized = true;
      WidgetsBinding.instance.addPostFrameCallback((_) async {
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
        title: const Text(
          'Trợ lý AI PetCar',
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
          _buildChatHistoryHeader(),
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(16),
              itemCount: chatProvider.messages.length + (chatProvider.isLoadingMoreMessages ? 1 : 0),
              itemBuilder: (context, index) {
                final hasLoadingHeader = chatProvider.isLoadingMoreMessages;
                if (hasLoadingHeader && index == 0) {
                  return const Padding(
                    padding: EdgeInsets.only(bottom: 16),
                    child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
                  );
                }
                if (chatProvider.messages.isEmpty) {
                  return const SizedBox.shrink();
                }
                final messageIndex = hasLoadingHeader ? index - 1 : index;
                final msg = chatProvider.messages[messageIndex];
                return _buildChatBubble(msg);
              },
            ),
          ),
          _buildMessageInput(),
        ],
      ),
    );
  }

  Widget _buildChatHistoryHeader() {
    final chatProvider = context.watch<ChatProvider>();
    final currentRoomIndex = chatProvider.rooms.indexWhere(
      (room) => room.id == chatProvider.currentRoomId,
    );
    final ChatRoom? currentRoom = currentRoomIndex >= 0
        ? chatProvider.rooms[currentRoomIndex]
        : null;
    final roomTitle = currentRoom?.name.trim().isNotEmpty == true
        ? currentRoom!.name
        : 'Cuoc tro chuyen moi';

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
            label: const Text('Cuộc trò chuyện mới', style: TextStyle(fontSize: 12, color: AppColors.primary, fontWeight: FontWeight.bold)),
          )
        ],
      ),
    );
  }

  Widget _buildChatBubble(ChatMessage message) {
    final isMe = message.isUser;
    final time = DateFormat('hh:mm a').format(message.createdAt);
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
                    message.content,
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

  Widget _buildMessageInput() {
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
                    decoration: const InputDecoration(
                      hintText: 'Nhập câu hỏi của bạn về sức khỏe thú cưng...',
                      hintStyle: TextStyle(fontSize: 13, color: AppColors.textGrey),
                      border: InputBorder.none,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Container(
                decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
                child: IconButton(
                  onPressed: _handleSendMessage,
                  icon: const Icon(Icons.send, color: AppColors.onPrimary, size: 20),
                ),
              ),
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
    await provider.fetchRooms();
    if (!mounted) return;
    if (provider.rooms.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Chua co lich su tro chuyen hoac chua tai duoc')),
      );
      return;
    }

    final selectedRoomId = await showModalBottomSheet<String>(
      context: context,
      backgroundColor: AppColors.background,
      showDragHandle: true,
      builder: (sheetContext) {
        return SafeArea(
          child: ListView.separated(
            itemCount: provider.rooms.length,
            separatorBuilder: (_, index) =>
                const Divider(height: 1, color: AppColors.divider),
            itemBuilder: (_, index) {
              final room = provider.rooms[index];
              final isSelected = room.id == provider.currentRoomId;
              final subtitle = room.lastMessage?.trim().isNotEmpty == true
                  ? room.lastMessage!
                  : 'Khong co tin nhan';

              return ListTile(
                onTap: () => Navigator.of(sheetContext).pop(room.id),
                leading: Icon(
                  Icons.chat_bubble_outline_rounded,
                  color: isSelected ? AppColors.primary : AppColors.textGrey,
                ),
                title: Text(
                  room.name.trim().isNotEmpty ? room.name : 'Cuoc tro chuyen',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                subtitle: Text(
                  subtitle,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 12, color: AppColors.textGrey),
                ),
                trailing: isSelected
                    ? const Icon(Icons.check_circle, color: AppColors.primary)
                    : null,
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

  String _statusText(ChatMessageStatus status) {
    switch (status) {
      case ChatMessageStatus.sending:
        return 'Dang gui';
      case ChatMessageStatus.sent:
        return 'Da gui';
      case ChatMessageStatus.error:
        return 'Loi';
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
