import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/image_helper.dart';
import '../../../l10n/generated/app_localizations.dart';
import '../../auth/presentation/providers/auth_provider.dart';
import 'provider/community_provider.dart';
import '../data/models/community_models.dart';

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
      if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 200) {
        context.read<CommunityProvider>().loadMore();
      }
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _showCommentSheet(Post post, CommunityProvider provider, AppLocalizations l10n) {
    final TextEditingController commentController = TextEditingController();
    provider.fetchComments(post.id);
    
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Consumer<CommunityProvider>(
        builder: (context, provider, _) {
          final comments = provider.getCommentsForPost(post.id);
          final isLoading = provider.isCommentsLoading(post.id);

          return Container(
            height: MediaQuery.of(context).size.height * 0.8,
            decoration: const BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: Column(
              children: [
                Container(
                  margin: const EdgeInsets.symmetric(vertical: 12),
                  width: 40, height: 4,
                  decoration: BoxDecoration(color: AppColors.divider, borderRadius: BorderRadius.circular(2)),
                ),
                Text(l10n.petCareForum, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                const Divider(height: 24),
                Expanded(
                  child: isLoading 
                    ? const Center(child: CircularProgressIndicator())
                    : comments.isEmpty 
                      ? const Center(child: Text('Chưa có bình luận nào.', style: TextStyle(color: AppColors.textGrey)))
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: comments.length,
                          itemBuilder: (context, index) => _buildCommentItem(comments[index]),
                        ),
                ),
                Container(
                  padding: EdgeInsets.fromLTRB(16, 8, 16, MediaQuery.of(context).viewInsets.bottom + 16),
                  decoration: const BoxDecoration(color: AppColors.surface, border: Border(top: BorderSide(color: AppColors.divider))),
                  child: Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: commentController,
                          decoration: InputDecoration(
                            hintText: 'Viết bình luận...',
                            filled: true,
                            fillColor: AppColors.background,
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: BorderSide.none),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          ),
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.send, color: AppColors.primary),
                        onPressed: () async {
                          if (commentController.text.trim().isNotEmpty) {
                            final success = await provider.sendComment(post.id, commentController.text.trim());
                            if (success) commentController.clear();
                          }
                        },
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildCommentItem(Comment comment) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: 16,
            backgroundImage: (comment.user.avatarUrl != null) ? NetworkImage(comment.user.avatarUrl!) : null,
            child: (comment.user.avatarUrl == null) ? const Icon(Icons.person, size: 16) : null,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(16)),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(comment.user.fullName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                      const SizedBox(height: 4),
                      Text(comment.content, style: const TextStyle(fontSize: 14)),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(left: 8, top: 4),
                  child: Text(DateFormat('dd/MM HH:mm').format(comment.createdAt), style: const TextStyle(color: AppColors.textGrey, fontSize: 11)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final provider = context.watch<CommunityProvider>();

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
                    ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
                    : ListView.builder(
                        controller: _scrollController,
                        padding: const EdgeInsets.only(bottom: 20),
                        itemCount: provider.posts.length + 1,
                        itemBuilder: (context, index) {
                          if (index == 0) return _buildPostInput(l10n);
                          return _buildPostCard(provider.posts[index - 1], provider, l10n);
                        },
                      ),
              ),
            ),
          ],
        ),
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
              decoration: BoxDecoration(color: AppColors.formFillDisabled, borderRadius: BorderRadius.circular(12)),
              child: Row(
                children: [
                  const Icon(Icons.search, color: AppColors.iconGrey, size: 20),
                  const SizedBox(width: 8),
                  Text(l10n.searchHint, style: const TextStyle(color: AppColors.textGrey, fontSize: 13)),
                ],
              ),
            ),
          ),
          const SizedBox(width: 12),
          IconButton(icon: const Icon(Icons.notifications_none_outlined, color: AppColors.textDark, size: 28), onPressed: () {}),
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
            backgroundImage: (user?.avatarUrl != null && user!.avatarUrl!.isNotEmpty) 
                ? CachedNetworkImageProvider(ImageHelper.getThumbnailUrl(user.avatarUrl!)) 
                : null,
            child: (user?.avatarUrl == null) ? const Icon(Icons.person, color: AppColors.iconGrey) : null,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: GestureDetector(
              onTap: () {
                // Logic mở trang tạo bài viết
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(20)),
                child: Text(l10n.shareSomething, style: const TextStyle(color: AppColors.textGrey, fontSize: 14)),
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
      decoration: const BoxDecoration(color: AppColors.appBarBackground, border: Border(bottom: BorderSide(color: AppColors.divider))),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: provider.topics.length + 1,
        itemBuilder: (context, index) {
          final isAllTab = index == 0;
          final topic = isAllTab ? null : provider.topics[index - 1];
          final isSelected = isAllTab ? provider.selectedTopicId == null : provider.selectedTopicId == topic?.id;
          return GestureDetector(
            onTap: () => provider.selectTopic(topic?.id),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              decoration: BoxDecoration(border: Border(bottom: BorderSide(color: isSelected ? AppColors.primary : Colors.transparent, width: 2))),
              alignment: Alignment.center,
              child: Text(isAllTab ? l10n.all : topic!.name, style: TextStyle(color: isSelected ? AppColors.textDark : AppColors.textGrey, fontWeight: isSelected ? FontWeight.bold : FontWeight.normal)),
            ),
          );
        },
      ),
    );
  }

  Widget _buildPostCard(Post post, CommunityProvider provider, AppLocalizations l10n) {
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
                backgroundImage: (post.user.avatarUrl != null && post.user.avatarUrl!.isNotEmpty) 
                    ? CachedNetworkImageProvider(ImageHelper.getThumbnailUrl(post.user.avatarUrl!)) 
                    : null,
                child: (post.user.avatarUrl == null) ? const Icon(Icons.person, color: AppColors.iconGrey) : null,
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start, 
                children: [
                  Text(post.user.fullName, style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.textDark)),
                  Text('${DateFormat('dd/MM HH:mm').format(post.createdAt)} ${post.topic != null ? "• ${post.topic!.name}" : ""}', style: const TextStyle(color: AppColors.textGrey, fontSize: 12))
                ]
              ),
              const Spacer(),
              const Icon(Icons.more_horiz, color: AppColors.iconGrey),
            ]
          ),
          const SizedBox(height: 16),
          Text(post.content, style: const TextStyle(fontSize: 15, color: AppColors.textDark, height: 1.4)),
          if (post.images.isNotEmpty) ...[
            const SizedBox(height: 16),
            ClipRRect(
              borderRadius: BorderRadius.circular(16), 
              child: CachedNetworkImage(imageUrl: post.images[0], width: double.infinity, height: 220, fit: BoxFit.cover)
            ),
          ],
          const SizedBox(height: 16),
          const Divider(color: AppColors.divider),
          Row(
            children: [
              _buildInteractionItem(
                icon: post.isLiked ? Icons.favorite : Icons.favorite_border,
                label: '${post.likesCount}',
                color: post.isLiked ? Colors.red : AppColors.textGrey,
                onTap: () => provider.toggleLike(post.id),
              ),
              const SizedBox(width: 24),
              _buildInteractionItem(
                icon: Icons.chat_bubble_outline,
                label: '${post.commentsCount}',
                color: AppColors.textGrey,
                onTap: () => _showCommentSheet(post, provider, l10n),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildInteractionItem({required IconData icon, required String label, required Color color, required VoidCallback onTap}) {
    return InkWell(
      onTap: onTap,
      child: Row(
        children: [
          Icon(icon, size: 22, color: color),
          const SizedBox(width: 6),
          Text(label, style: TextStyle(color: color, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }
}
