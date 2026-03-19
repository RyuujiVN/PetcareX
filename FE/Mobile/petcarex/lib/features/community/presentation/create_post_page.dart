import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/logger.dart';
import '../../../l10n/generated/app_localizations.dart';
import '../../auth/presentation/providers/auth_provider.dart';
import 'provider/community_provider.dart';

class CreatePostPage extends StatefulWidget {
  const CreatePostPage({super.key});

  @override
  State<CreatePostPage> createState() => _CreatePostPageState();
}

class _CreatePostPageState extends State<CreatePostPage> {
  final TextEditingController _contentController = TextEditingController();
  String? _selectedTopicId;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _initializeDefaultTopic();
  }

  void _initializeDefaultTopic() {
    final provider = context.read<CommunityProvider>();
    if (provider.topics.isNotEmpty) {
      setState(() {
        _selectedTopicId = provider.topics.first.id;
      });
    } else {
      provider.fetchInitialData().then((_) {
        if (mounted && provider.topics.isNotEmpty) {
          setState(() {
            _selectedTopicId = provider.topics.first.id;
          });
        }
      });
    }
  }

  @override
  void dispose() {
    _contentController.dispose();
    super.dispose();
  }

  Future<void> _handlePost() async {
    final l10n = AppLocalizations.of(context)!;
    final content = _contentController.text.trim();

    if (content.isEmpty) {
      _showQuickSnackBar(l10n.shareSomething);
      return;
    }

    if (_selectedTopicId == null) {
      _showQuickSnackBar(l10n.pleaseChooseTopic);
      return;
    }

    setState(() => _isLoading = true);
    
    try {
      final success = await context.read<CommunityProvider>().createNewPost(
        content: content,
        topicId: _selectedTopicId!,
      );

      if (mounted) {
        setState(() => _isLoading = false);
        if (success) {
          Navigator.pop(context, true);
          _showQuickSnackBar(l10n.success, isError: false);
        } else {
          final error = context.read<CommunityProvider>().errorMessage;
          _showQuickSnackBar(error ?? l10n.failed);
        }
      }
    } catch (e) {
      AppLogger.logError("Error creating post", e); // Đã sửa tên hàm từ .error sang .logError
      if (mounted) {
        setState(() => _isLoading = false);
        _showQuickSnackBar(l10n.failed);
      }
    }
  }

  void _showQuickSnackBar(String message, {bool isError = true}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? AppColors.error : AppColors.success,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final user = context.watch<AuthProvider>().user;
    final topics = context.watch<CommunityProvider>().topics;

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close, color: AppColors.textDark),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          l10n.post, 
          style: const TextStyle(color: AppColors.textDark, fontWeight: FontWeight.bold, fontSize: 18)
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16, top: 10, bottom: 10),
            child: ElevatedButton(
              onPressed: _isLoading ? null : _handlePost,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: AppColors.onPrimary,
                elevation: 0,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              ),
              child: _isLoading 
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.onPrimary))
                : Text(l10n.post, style: const TextStyle(fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          const Divider(height: 1),
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 24,
                  backgroundColor: AppColors.background,
                  backgroundImage: (user?.avatarUrl != null && user!.avatarUrl!.isNotEmpty) 
                      ? NetworkImage(user.avatarUrl!) 
                      : null,
                  child: user?.avatarUrl == null ? const Icon(Icons.person, color: AppColors.iconGrey) : null,
                ),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      user?.fullName ?? l10n.user, 
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.textDark)
                    ),
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppColors.background,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.divider),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: _selectedTopicId,
                          hint: Text(l10n.chooseTopic, style: const TextStyle(fontSize: 12)),
                          isDense: true,
                          icon: const Icon(Icons.keyboard_arrow_down, size: 16, color: AppColors.primary),
                          style: const TextStyle(fontSize: 12, color: AppColors.primary, fontWeight: FontWeight.bold),
                          items: topics.map((t) => DropdownMenuItem(value: t.id, child: Text(t.name))).toList(),
                          onChanged: (val) => setState(() => _selectedTopicId = val),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Expanded(
            child: TextField(
              controller: _contentController,
              maxLines: null,
              autofocus: true,
              style: const TextStyle(fontSize: 18, color: AppColors.textDark, height: 1.5),
              decoration: InputDecoration(
                hintText: l10n.shareSomething,
                hintStyle: const TextStyle(color: AppColors.textGrey),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
