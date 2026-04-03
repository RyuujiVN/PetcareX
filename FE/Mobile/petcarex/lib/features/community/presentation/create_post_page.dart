import 'dart:io';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../core/services/camera_service.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/app_notifier.dart';
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
  final CameraService _cameraService = CameraService();
  final TextEditingController _contentController = TextEditingController();
  final List<_ComposerImage> _composerImages = [];
  String? _selectedTopicId;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _initializeDefaultTopic();
  }

  Future<void> _pickImages() async {
    final l10n = AppLocalizations.of(context)!;
    final picked = await _cameraService.pickImagesFromGallery();
    if (picked.isEmpty) return;
    if (!mounted) return;

    final incoming = picked.map((file) => _ComposerImage(file: file)).toList();
    setState(() {
      _composerImages.addAll(incoming);
    });

    final uploadedUrls = await context
        .read<CommunityProvider>()
        .preUploadImages(picked.map((e) => e.path).toList());

    if (!mounted) return;

    var successCount = 0;
    setState(() {
      for (var i = 0; i < incoming.length; i++) {
        incoming[i].isUploading = false;
        if (i < uploadedUrls.length && uploadedUrls[i].trim().isNotEmpty) {
          incoming[i].uploadedUrl = uploadedUrls[i].trim();
          incoming[i].isUploadFailed = false;
          successCount++;
        } else {
          incoming[i].isUploadFailed = true;
        }
      }
    });

    if (successCount == 0) {
      _showQuickSnackBar(l10n.uploadImageFailed);
      return;
    }

    if (successCount == incoming.length) {
      _showQuickSnackBar(l10n.uploadImageSuccess, isError: false);
      return;
    }

    _showQuickSnackBar(l10n.uploadImageFailed);
  }

  void _removeSelectedImage(int index) {
    if (index < 0 || index >= _composerImages.length) return;
    setState(() {
      _composerImages.removeAt(index);
    });
  }

  void _initializeDefaultTopic() {
    final provider = context.read<CommunityProvider>();
    if (provider.topics.isNotEmpty) {
      setState(() {
        _selectedTopicId = provider.topics.first.id;
      });
    } else {
      provider.fetchTopics().then((_) {
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
    final hasUploadingImages = _composerImages.any((image) => image.isUploading);
    final uploadedImageUrls = _composerImages
        .where((image) => image.uploadedUrl != null)
        .map((image) => image.uploadedUrl!)
        .toList();
    final hasFailedImages = _composerImages.any((image) => image.isUploadFailed);

    if (content.isEmpty && uploadedImageUrls.isEmpty) {
      _showQuickSnackBar(l10n.shareSomething);
      return;
    }

    if (hasUploadingImages) {
      _showQuickSnackBar(l10n.uploadingImage);
      return;
    }

    if (hasFailedImages) {
      _showQuickSnackBar(l10n.uploadImageFailed);
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
        uploadedImageUrls: uploadedImageUrls,
      );

      if (mounted) {
        setState(() => _isLoading = false);
        if (success) {
          Navigator.pop(context, true);
          _showQuickSnackBar(l10n.success, isError: false);
        } else {
          final error = context.read<CommunityProvider>().errorMessage;
          if (error == 'uploadImageFailed') {
            _showQuickSnackBar(l10n.uploadImageFailed);
          } else {
            _showQuickSnackBar(error ?? l10n.failed);
          }
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
    if (isError) {
      AppNotifier.showError(context, message);
      return;
    }
    AppNotifier.showSuccess(context, message);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final languageCode = Localizations.localeOf(context).languageCode;
    final user = context.watch<AuthProvider>().user;
    final topics = context.watch<CommunityProvider>().topics;
    final hasSelectedTopic =
        _selectedTopicId != null && topics.any((t) => t.id == _selectedTopicId);

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
                          value: hasSelectedTopic ? _selectedTopicId : null,
                          hint: Text(l10n.chooseTopic, style: const TextStyle(fontSize: 12)),
                          isDense: true,
                          icon: const Icon(Icons.keyboard_arrow_down, size: 16, color: AppColors.primary),
                          style: const TextStyle(fontSize: 12, color: AppColors.primary, fontWeight: FontWeight.bold),
                          items: topics
                              .map(
                                (t) => DropdownMenuItem(
                                  value: t.id,
                                  child: Text(t.displayName(languageCode)),
                                ),
                              )
                              .toList(),
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
            child: Column(
              children: [
                if (_composerImages.isNotEmpty)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: const BoxDecoration(
                      border: Border(top: BorderSide(color: AppColors.divider)),
                    ),
                    child: GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: _composerImages.length,
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 3,
                        crossAxisSpacing: 8,
                        mainAxisSpacing: 8,
                        childAspectRatio: 1,
                      ),
                      itemBuilder: (context, index) {
                        final image = _composerImages[index];
                        return Stack(
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(10),
                              child: Image.file(
                                image.file,
                                width: double.infinity,
                                height: double.infinity,
                                fit: BoxFit.cover,
                              ),
                            ),
                            if (image.isUploading)
                              Positioned.fill(
                                child: Container(
                                  decoration: BoxDecoration(
                                    color: AppColors.black.withValues(alpha: 0.35),
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  alignment: Alignment.center,
                                  child: const SizedBox(
                                    width: 18,
                                    height: 18,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: AppColors.white,
                                    ),
                                  ),
                                ),
                              ),
                            if (image.isUploadFailed)
                              Positioned.fill(
                                child: Container(
                                  decoration: BoxDecoration(
                                    color: AppColors.error.withValues(alpha: 0.3),
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  alignment: Alignment.center,
                                  child: const Icon(
                                    Icons.error_outline,
                                    color: AppColors.white,
                                    size: 20,
                                  ),
                                ),
                              ),
                            Positioned(
                              top: 4,
                              right: 4,
                              child: GestureDetector(
                                onTap: () => _removeSelectedImage(index),
                                child: Container(
                                  width: 20,
                                  height: 20,
                                  decoration: const BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: AppColors.black,
                                  ),
                                  child: const Icon(
                                    Icons.close,
                                    color: AppColors.white,
                                    size: 14,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        );
                      },
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
                      enabledBorder: InputBorder.none,
                      focusedBorder: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                    ),
                  ),
                ),
              ],
            ),
          ),
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
              child: Row(
                children: [
                  OutlinedButton.icon(
                    onPressed: _isLoading ? null : _pickImages,
                    icon: const Icon(Icons.photo_library_outlined),
                    label: Text(l10n.uploadPhoto),
                  ),
                  const SizedBox(width: 8),
                  if (_composerImages.isNotEmpty)
                    Text(
                      '${_composerImages.where((image) => image.uploadedUrl != null).length}/${_composerImages.length}',
                      style: const TextStyle(
                        color: AppColors.textGrey,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ComposerImage {
  final File file;
  String? uploadedUrl;
  bool isUploading = true;
  bool isUploadFailed = false;

  _ComposerImage({
    required this.file,
  });
}
