import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/app_notifier.dart';
import '../../../../core/utils/image_helper.dart';
import '../../../l10n/generated/app_localizations.dart';
import '../../auth/presentation/providers/auth_provider.dart';
import '../data/models/community_models.dart';
import 'create_post_page.dart';
import 'provider/community_provider.dart';

class CommunityPage extends StatefulWidget {
  const CommunityPage({super.key});

  @override
  State<CommunityPage> createState() => _CommunityPageState();
}

class _CommunityPageState extends State<CommunityPage> {
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CommunityProvider>().fetchInitialData();
    });

    _scrollController.addListener(() {
      if (_scrollController.position.pixels >=
          _scrollController.position.maxScrollExtent - 200) {
        context.read<CommunityProvider>().loadMore();
      }
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _showCommentSheet(
    Post post,
    CommunityProvider provider,
    AppLocalizations l10n,
  ) {
    final TextEditingController commentController = TextEditingController();
    provider.fetchComments(post.id);
    provider.setReplyTarget(null);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.transparent,
      builder: (context) => Consumer<CommunityProvider>(
        builder: (context, provider, _) {
          final comments = provider.getCommentsForPost(post.id);
          final isLoading = provider.isCommentsLoading(post.id);
          final replyTarget = provider.activeReplyTarget;

          return Padding(
            padding: EdgeInsets.only(
              bottom: MediaQuery.of(context).viewInsets.bottom,
            ),
            child: Container(
              height: MediaQuery.of(context).size.height * 0.7,
              decoration: const BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
              ),
              child: Column(
                children: [
                  _buildSheetHeader(l10n),
                  Expanded(
                    child: isLoading
                        ? const Center(child: CircularProgressIndicator())
                        : comments.isEmpty
                        ? Center(
                            child: Text(
                              l10n.noCommentsYet,
                              style: const TextStyle(color: AppColors.textGrey),
                            ),
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            itemCount: comments.length,
                            itemBuilder: (context, index) => _buildCommentItem(
                              comments[index],
                              provider,
                              l10n,
                              post.id,
                            ),
                          ),
                  ),
                  _buildCommentInputSection(
                    commentController,
                    post,
                    provider,
                    replyTarget,
                    l10n,
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Future<void> _showEditPostDialog(
    Post post,
    CommunityProvider provider,
    AppLocalizations l10n,
  ) async {
    final controller = TextEditingController(text: post.content);
    final updated = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text(
            l10n.editPost,
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
          content: TextField(
            controller: controller,
            maxLines: null,
            decoration: InputDecoration(hintText: l10n.commentHint),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: Text(l10n.cancel),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context, true);
              },
              child: Text(l10n.update),
            ),
          ],
        );
      },
    );

    if (updated == true && controller.text.trim().isNotEmpty) {
      final success = await provider.updatePost(
        post.id,
        controller.text.trim(),
        post.topic?.id ?? '',
      );
      if (success) {
        if (!mounted) return;
        AppNotifier.showSuccess(context, l10n.success);
      } else {
        if (!mounted) return;
        AppNotifier.showError(context, provider.errorMessage ?? l10n.failed);
      }
    }
  }

  Future<void> _showDeletePostConfirm(
    Post post,
    CommunityProvider provider,
    AppLocalizations l10n,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (adapterContext) {
        return AlertDialog(
          title: Text(
            l10n.confirmDelete,
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
          content: Text(l10n.deletePostConfirm),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(adapterContext, false),
              child: Text(l10n.cancel),
            ),
            ElevatedButton(
              onPressed: () => Navigator.pop(adapterContext, true),
              child: Text(l10n.delete),
            ),
          ],
        );
      },
    );

    if (confirmed == true) {
      final success = await provider.deletePost(post.id);
      if (!mounted) return;
      if (success) {
        AppNotifier.showSuccess(context, l10n.deletePostSuccess);
      } else {
        AppNotifier.showError(context, provider.errorMessage ?? l10n.failed);
      }
    }
  }

  Widget _buildSheetHeader(AppLocalizations l10n) {
    return Column(
      children: [
        Container(
          margin: const EdgeInsets.symmetric(vertical: 12),
          width: 40,
          height: 4,
          decoration: BoxDecoration(
            color: AppColors.divider,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Text(
            l10n.petCareForum,
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
        ),
        const Divider(height: 1),
      ],
    );
  }

  Widget _buildCommentInputSection(
    TextEditingController controller,
    Post post,
    CommunityProvider provider,
    Comment? replyTarget,
    AppLocalizations l10n,
  ) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: const Border(top: BorderSide(color: AppColors.divider)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (replyTarget != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              margin: const EdgeInsets.only(bottom: 12),
              decoration: BoxDecoration(
                color: AppColors.primaryLight,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      l10n.replyingTo(replyTarget.author.fullName),
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.primary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  GestureDetector(
                    onTap: () => provider.setReplyTarget(null),
                    child: const Icon(
                      Icons.close,
                      size: 16,
                      color: AppColors.primary,
                    ),
                  ),
                ],
              ),
            ),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: controller,
                  decoration: InputDecoration(
                    hintText: replyTarget == null
                        ? l10n.commentHint
                        : l10n.replyHint,
                    filled: true,
                    fillColor: AppColors.background,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(24),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 10,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              CircleAvatar(
                backgroundColor: AppColors.primary,
                child: IconButton(
                  icon: const Icon(
                    Icons.send,
                    color: AppColors.onPrimary,
                    size: 20,
                  ),
                  onPressed: () async {
                    if (controller.text.trim().isNotEmpty) {
                      final success = await provider.sendComment(
                        post.id,
                        controller.text.trim(),
                      );
                      if (success) controller.clear();
                    }
                  },
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCommentItem(
    Comment comment,
    CommunityProvider provider,
    AppLocalizations l10n,
    String postId, {
    bool isReply = false,
  }) {
    final replies = provider.getRepliesForComment(comment.id);
    final isRepliesLoading = provider.isRepliesLoading(comment.id);

    return Padding(
      padding: EdgeInsets.only(bottom: 16, left: isReply ? 40 : 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: AppColors.divider, width: 1),
                ),
                child: CircleAvatar(
                  radius: isReply ? 14 : 18,
                  backgroundColor: AppColors.background,
                  backgroundImage:
                      (comment.author.avatarUrl != null &&
                          comment.author.avatarUrl!.isNotEmpty)
                      ? CachedNetworkImageProvider(
                          ImageHelper.getThumbnailUrl(
                            comment.author.avatarUrl!,
                          ),
                        )
                      : null,
                  child:
                      (comment.author.avatarUrl == null ||
                          comment.author.avatarUrl!.isEmpty)
                      ? Icon(
                          Icons.person,
                          size: isReply ? 14 : 18,
                          color: AppColors.iconGrey,
                        )
                      : null,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: isReply ? AppColors.white : AppColors.background,
                        borderRadius: BorderRadius.circular(16),
                        border: isReply
                            ? Border.all(color: AppColors.divider)
                            : null,
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            comment.author.fullName,
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                              color: AppColors.textDark,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            comment.content,
                            style: const TextStyle(
                              fontSize: 14,
                              color: AppColors.textDark,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.only(left: 8, top: 6),
                      child: Row(
                        children: [
                          Text(
                            DateFormat('dd/MM HH:mm').format(comment.createdAt),
                            style: const TextStyle(
                              color: AppColors.textGrey,
                              fontSize: 11,
                            ),
                          ),
                          if (!isReply) ...[
                            const SizedBox(width: 16),
                            GestureDetector(
                              onTap: () => provider.setReplyTarget(comment),
                              child: Text(
                                l10n.reply,
                                style: const TextStyle(
                                  color: AppColors.primary,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (!isReply) ...[
            if (replies.isNotEmpty)
              ...replies.map(
                (reply) => _buildCommentItem(
                  reply,
                  provider,
                  l10n,
                  postId,
                  isReply: true,
                ),
              )
            else if (!isRepliesLoading &&
                comment.replies != null &&
                comment.replies!.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(left: 50, top: 8),
                child: GestureDetector(
                  onTap: () => provider.fetchReplies(comment.id),
                  child: Text(
                    l10n.viewReplies,
                    style: const TextStyle(
                      color: AppColors.textGrey,
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              )
            else if (isRepliesLoading)
              const Padding(
                padding: EdgeInsets.only(left: 50, top: 8),
                child: SizedBox(
                  width: 12,
                  height: 12,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
              ),
          ],
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final provider = context.watch<CommunityProvider>();
    final currentUser = context.watch<AuthProvider>().user;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            _buildSearchBar(l10n),
            _buildCategoryTabs(provider, l10n),
            Expanded(
              child: RefreshIndicator(
                onRefresh: () => provider.fetchInitialData(),
                color: AppColors.primary,
                child: provider.isLoading && provider.posts.isEmpty
                    ? const Center(
                        child: CircularProgressIndicator(
                          color: AppColors.primary,
                        ),
                      )
                    : ListView.builder(
                        controller: _scrollController,
                        padding: const EdgeInsets.only(bottom: 20),
                        itemCount: provider.posts.length + 1,
                        itemBuilder: (context, index) {
                          if (index == 0) return _buildPostInput(l10n);
                          return _buildPostCard(
                            provider.posts[index - 1],
                            provider,
                            l10n,
                            currentUser?.id,
                          );
                        },
                      ),
              ),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () async {
          final result = await Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => const CreatePostPage()),
          );
          if (result == true) provider.fetchInitialData();
        },
        backgroundColor: AppColors.primary,
        child: const Icon(Icons.add, color: AppColors.onPrimary),
      ),
    );
  }

  Widget _buildSearchBar(AppLocalizations l10n) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      decoration: const BoxDecoration(
        color: AppColors.appBarBackground,
        border: Border(bottom: BorderSide(color: AppColors.divider)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              height: 44,
              decoration: BoxDecoration(
                color: AppColors.formFillDisabled,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  const Icon(Icons.search, color: AppColors.iconGrey, size: 20),
                  const SizedBox(width: 8),
                  Text(
                    l10n.searchHint,
                    style: const TextStyle(
                      color: AppColors.textGrey,
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 12),
          IconButton(
            icon: const Icon(
              Icons.notifications_none_outlined,
              color: AppColors.textDark,
              size: 28,
            ),
            onPressed: () {},
          ),
        ],
      ),
    );
  }

  Widget _buildPostInput(AppLocalizations l10n) {
    final user = context.watch<AuthProvider>().user;
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(20),
      color: AppColors.cardBackground,
      child: Row(
        children: [
          CircleAvatar(
            radius: 20,
            backgroundColor: AppColors.background,
            backgroundImage:
                (user?.avatarUrl != null && user!.avatarUrl!.isNotEmpty)
                ? CachedNetworkImageProvider(
                    ImageHelper.getThumbnailUrl(user.avatarUrl!),
                  )
                : null,
            child: (user?.avatarUrl?.isEmpty ?? true)
                ? const Icon(Icons.person, color: AppColors.iconGrey)
                : null,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: GestureDetector(
              onTap: () async {
                final result = await Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const CreatePostPage(),
                  ),
                );
                if (!mounted) return;
                if (result == true) {
                  context.read<CommunityProvider>().fetchInitialData();
                }
              },
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 10,
                ),
                decoration: BoxDecoration(
                  color: AppColors.background,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  l10n.shareSomething,
                  style: const TextStyle(
                    color: AppColors.textGrey,
                    fontSize: 14,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryTabs(CommunityProvider provider, AppLocalizations l10n) {
    return Container(
      height: 50,
      decoration: const BoxDecoration(
        color: AppColors.appBarBackground,
        border: Border(bottom: BorderSide(color: AppColors.divider)),
      ),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: provider.topics.length + 1,
        itemBuilder: (context, index) {
          final isAllTab = index == 0;
          final topic = isAllTab ? null : provider.topics[index - 1];
          final isSelected = isAllTab
              ? provider.selectedTopicId == null
              : provider.selectedTopicId == topic?.id;
          return GestureDetector(
            onTap: () => provider.selectTopic(topic?.id),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              decoration: BoxDecoration(
                border: Border(
                  bottom: BorderSide(
                    color: isSelected
                        ? AppColors.primary
                        : AppColors.transparent,
                    width: 2,
                  ),
                ),
              ),
              alignment: Alignment.center,
              child: Text(
                isAllTab ? l10n.all : topic!.name,
                style: TextStyle(
                  color: isSelected ? AppColors.textDark : AppColors.textGrey,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildPostCard(
    Post post,
    CommunityProvider provider,
    AppLocalizations l10n,
    String? currentUserId,
  ) {
    return Container(
      margin: const EdgeInsets.only(top: 12),
      padding: const EdgeInsets.all(20),
      decoration: const BoxDecoration(color: AppColors.cardBackground),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 20,
                backgroundColor: AppColors.background,
                backgroundImage:
                    (post.author.avatarUrl != null &&
                        post.author.avatarUrl!.isNotEmpty)
                    ? CachedNetworkImageProvider(
                        ImageHelper.getThumbnailUrl(post.author.avatarUrl!),
                      )
                    : null,
                child: (post.author.avatarUrl?.isEmpty ?? true)
                    ? const Icon(Icons.person, color: AppColors.iconGrey)
                    : null,
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    post.author.fullName,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      color: AppColors.textDark,
                    ),
                  ),
                  Text(
                    '${DateFormat('dd/MM HH:mm').format(post.createdAt)} ${post.topic != null ? "• ${post.topic!.name}" : ""}',
                    style: const TextStyle(
                      color: AppColors.textGrey,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
              const Spacer(),
              if (currentUserId != null && currentUserId == post.author.id)
                PopupMenuButton<String>(
                  icon: const Icon(Icons.more_horiz, color: AppColors.iconGrey),
                  onSelected: (value) {
                    if (value == 'edit') {
                      _showEditPostDialog(post, provider, l10n);
                    } else if (value == 'delete') {
                      _showDeletePostConfirm(post, provider, l10n);
                    }
                  },
                  itemBuilder: (context) => [
                    PopupMenuItem(value: 'edit', child: Text(l10n.editPost)),
                    PopupMenuItem(value: 'delete', child: Text(l10n.delete)),
                  ],
                )
              else
                const Icon(Icons.more_horiz, color: AppColors.iconGrey),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            post.content,
            style: const TextStyle(
              fontSize: 15,
              color: AppColors.textDark,
              height: 1.4,
            ),
          ),
          if (post.images.isNotEmpty) ...[
            const SizedBox(height: 16),
            ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: CachedNetworkImage(
                imageUrl: post.images[0],
                width: double.infinity,
                height: 220,
                fit: BoxFit.cover,
              ),
            ),
          ],
          const SizedBox(height: 16),
          const Divider(color: AppColors.divider),
          Row(
            children: [
              _buildInteractionItem(
                icon: post.liked ? Icons.favorite : Icons.favorite_border,
                label: '${post.likeCount}',
                color: post.liked ? AppColors.error : AppColors.textGrey,
                onTap: () => provider.toggleLike(post.id),
              ),
              const SizedBox(width: 24),
              _buildInteractionItem(
                icon: Icons.chat_bubble_outline,
                label: '${post.commentCount}',
                color: AppColors.textGrey,
                onTap: () => _showCommentSheet(post, provider, l10n),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildInteractionItem({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      child: Row(
        children: [
          Icon(icon, size: 22, color: color),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(color: color, fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }
}
