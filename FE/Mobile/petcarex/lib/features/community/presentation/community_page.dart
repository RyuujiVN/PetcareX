import 'dart:io';
import 'dart:async';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../../../core/services/camera_service.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/app_notifier.dart';
import '../../../../core/utils/image_helper.dart';
import '../../../l10n/generated/app_localizations.dart';
import '../../auth/presentation/providers/auth_provider.dart';
import '../../notification/presentation/widgets/notification_bell_button.dart';
import '../data/models/community_models.dart';
import '../../report/data/models/report_models.dart';
import '../../report/presentation/widgets/report_reason_sheet.dart';
import 'create_post_page.dart';
import 'provider/community_provider.dart';
import 'widgets/forum_search_bar.dart';
import 'widgets/image_viewer.dart';

class CommunityPage extends StatefulWidget {
  const CommunityPage({super.key});

  @override
  State<CommunityPage> createState() => _CommunityPageState();
}

class _CommunityPageState extends State<CommunityPage> {
  final CameraService _cameraService = CameraService();
  final ScrollController _scrollController = ScrollController();
  int _handledFocusRequestVersion = 0;
  String? _highlightedPostId;
  Timer? _highlightResetTimer;

  List<String> _extractImageUrlsFromHtml(String html) {
    final matches = RegExp(
      "<img[^>]*src=['\\\"]([^'\\\"]+)['\\\"][^>]*>",
      caseSensitive: false,
    ).allMatches(html);

    final seen = <String>{};
    final result = <String>[];
    for (final m in matches) {
      final url = m.group(1)?.trim() ?? '';
      if (url.isEmpty) continue;
      if (seen.add(url)) result.add(url);
    }
    return result;
  }

  String _extractPlainTextFromHtml(String html) {
    var plain = html
        .replaceAll(RegExp(r'<img[^>]*>', caseSensitive: false), '')
        .replaceAll(RegExp(r'<br\s*/?>', caseSensitive: false), '\n')
        .replaceAll(RegExp(r'</p>', caseSensitive: false), '\n')
        .replaceAll(RegExp(r'<p[^>]*>', caseSensitive: false), '')
        .replaceAll(RegExp(r'<[^>]+>'), '');

    plain = plain
        .replaceAll('&nbsp;', ' ')
        .replaceAll('&amp;', '&')
        .replaceAll('&lt;', '<')
        .replaceAll('&gt;', '>')
        .replaceAll('&quot;', '"')
        .replaceAll('&#39;', "'");

    return plain.trim();
  }

  String _escapeHtml(String input) {
    return input
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
  }

  String _composeHtmlContent({
    required String text,
    required List<String> imageUrls,
  }) {
    final trimmed = text.trim();
    final segments = <String>[];

    if (trimmed.isNotEmpty) {
      segments.add('<p>${_escapeHtml(trimmed).replaceAll('\n', '<br/>')}</p>');
    }

    for (final url in imageUrls) {
      if (url.trim().isEmpty) continue;
      segments.add('<img src="${url.trim()}" />');
    }

    return segments.join('\n');
  }

  // ─── Facebook-style image grid ───────────────────────────────────────────

  Widget _buildImageGrid(
    List<String> imageUrls, {
    double totalHeight = 300,
    bool compact = false,
  }) {
    final count = imageUrls.length;
    final h = compact ? totalHeight * 0.75 : totalHeight;
    const gap = 2.0;

    if (count == 0) return const SizedBox.shrink();

    // 1 ảnh: đọc tỉ lệ thực của ảnh, clamp trong dải hợp lý, rồi BoxFit.cover
    // để không có dải letterbox trắng gây cảm giác "nhiều ô ảnh".
    if (count == 1) {
      return _AdaptiveSingleImage(
        url: imageUrls[0],
        allUrls: imageUrls,
        compact: compact,
      );
    }

    // Comment/reply (compact) với nhiều ảnh: grid thumbnail kiểu Facebook,
    // hiển thị tối đa 4 tile, tile cuối có overlay "+N" nếu còn ảnh ẩn.
    // Toàn block là vuông 1:1, rộng 75% bubble, căn trái.
    if (compact) {
      final displayUrls = imageUrls.take(4).toList();
      final displayCount = displayUrls.length;
      final moreCount = count - displayCount;
      const gap = 3.0;

      Widget body;
      if (displayCount == 2) {
        body = Row(
          children: [
            Expanded(child: _fbImage(displayUrls, 0, allUrls: imageUrls)),
            const SizedBox(width: gap),
            Expanded(child: _fbImage(displayUrls, 1, allUrls: imageUrls)),
          ],
        );
      } else if (displayCount == 3) {
        body = Row(
          children: [
            Expanded(child: _fbImage(displayUrls, 0, allUrls: imageUrls)),
            const SizedBox(width: gap),
            Expanded(
              child: Column(
                children: [
                  Expanded(
                    child: _fbImage(displayUrls, 1, allUrls: imageUrls),
                  ),
                  const SizedBox(height: gap),
                  Expanded(
                    child: _fbImage(displayUrls, 2, allUrls: imageUrls),
                  ),
                ],
              ),
            ),
          ],
        );
      } else {
        // displayCount == 4
        body = Column(
          children: [
            Expanded(
              child: Row(
                children: [
                  Expanded(
                    child: _fbImage(displayUrls, 0, allUrls: imageUrls),
                  ),
                  const SizedBox(width: gap),
                  Expanded(
                    child: _fbImage(displayUrls, 1, allUrls: imageUrls),
                  ),
                ],
              ),
            ),
            const SizedBox(height: gap),
            Expanded(
              child: Row(
                children: [
                  Expanded(
                    child: _fbImage(displayUrls, 2, allUrls: imageUrls),
                  ),
                  const SizedBox(width: gap),
                  Expanded(
                    child: _fbImage(
                      displayUrls,
                      3,
                      overlayCount: moreCount > 0 ? moreCount : null,
                      allUrls: imageUrls,
                    ),
                  ),
                ],
              ),
            ),
          ],
        );
      }

      return Align(
        alignment: Alignment.centerLeft,
        child: FractionallySizedBox(
          widthFactor: 0.75,
          alignment: Alignment.centerLeft,
          child: AspectRatio(aspectRatio: 1.0, child: body),
        ),
      );
    }

    // 2 ảnh: hai cột bằng nhau
    if (count == 2) {
      return SizedBox(
        height: h,
        child: Row(
          children: [
            Expanded(child: _fbImage(imageUrls, 0, height: h)),
            const SizedBox(width: gap),
            Expanded(child: _fbImage(imageUrls, 1, height: h)),
          ],
        ),
      );
    }

    // 3 ảnh: ảnh 1 cột trái full, ảnh 2+3 cột phải xếp dọc
    if (count == 3) {
      return SizedBox(
        height: h,
        child: Row(
          children: [
            Expanded(child: _fbImage(imageUrls, 0, height: h)),
            const SizedBox(width: gap),
            Expanded(
              child: Column(
                children: [
                  Expanded(child: _fbImage(imageUrls, 1)),
                  const SizedBox(height: gap),
                  Expanded(child: _fbImage(imageUrls, 2)),
                ],
              ),
            ),
          ],
        ),
      );
    }

    // 4 ảnh: lưới 2x2 đều nhau
    if (count == 4) {
      return SizedBox(
        height: h,
        child: Column(
          children: [
            Expanded(
              child: Row(
                children: [
                  Expanded(child: _fbImage(imageUrls, 0)),
                  const SizedBox(width: gap),
                  Expanded(child: _fbImage(imageUrls, 1)),
                ],
              ),
            ),
            const SizedBox(height: gap),
            Expanded(
              child: Row(
                children: [
                  Expanded(child: _fbImage(imageUrls, 2)),
                  const SizedBox(width: gap),
                  Expanded(child: _fbImage(imageUrls, 3)),
                ],
              ),
            ),
          ],
        ),
      );
    }

    // 5+ ảnh: hàng trên 2 ảnh (cao hơn), hàng dưới 3 ảnh
    // ô thứ 5 hiện overlay "+N" nếu còn ảnh ẩn
    final topH = h * 0.55;
    final botH = h * 0.45 - gap;
    final displayUrls = imageUrls.take(5).toList();
    final moreCount = imageUrls.length - 5;

    return SizedBox(
      height: h,
      child: Column(
        children: [
          SizedBox(
            height: topH,
            child: Row(
              children: [
                Expanded(
                  child: _fbImage(
                    displayUrls,
                    0,
                    height: topH,
                    allUrls: imageUrls,
                  ),
                ),
                const SizedBox(width: gap),
                Expanded(
                  child: _fbImage(
                    displayUrls,
                    1,
                    height: topH,
                    allUrls: imageUrls,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: gap),
          SizedBox(
            height: botH,
            child: Row(
              children: [
                Expanded(
                  child: _fbImage(
                    displayUrls,
                    2,
                    height: botH,
                    allUrls: imageUrls,
                  ),
                ),
                const SizedBox(width: gap),
                Expanded(
                  child: _fbImage(
                    displayUrls,
                    3,
                    height: botH,
                    allUrls: imageUrls,
                  ),
                ),
                const SizedBox(width: gap),
                Expanded(
                  child: _fbImage(
                    displayUrls,
                    4,
                    height: botH,
                    overlayCount: moreCount > 0 ? moreCount : null,
                    allUrls: imageUrls,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  /// Một ô ảnh đơn trong grid, có hỗ trợ overlay "+N"
  Widget _fbImage(
    List<String> urls,
    int index, {
    double? height,
    int? overlayCount,
    List<String>? allUrls,
  }) {
    final url = urls[index];
    final viewerUrls = allUrls ?? urls;

    final img = CachedNetworkImage(
      imageUrl: ImageHelper.getThumbnailUrl(url),
      fit: BoxFit.cover,
      width: double.infinity,
      height: height ?? double.infinity,
    );

    return GestureDetector(
      onTap: () => ImageViewer.show(context, viewerUrls, initialIndex: index),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(4),
        child: SizedBox(
          height: height,
          width: double.infinity,
          child: overlayCount != null && overlayCount > 0
              ? Stack(
                  fit: StackFit.expand,
                  children: [
                    img,
                    Container(
                      color: AppColors.black.withValues(alpha: 0.45),
                      alignment: Alignment.center,
                      child: Text(
                        '+$overlayCount',
                        style: const TextStyle(
                          color: AppColors.white,
                          fontSize: 26,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                )
              : img,
        ),
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────

  Widget _buildHtmlContentView(
    String rawContent, {
    required TextStyle textStyle,
    double imageHeight = 220,
    bool compact = false,
  }) {
    final plainText = _extractPlainTextFromHtml(rawContent);
    final imageUrls = _extractImageUrlsFromHtml(rawContent);

    if (plainText.isEmpty && imageUrls.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (plainText.isNotEmpty) Text(plainText, style: textStyle),
        if (imageUrls.isNotEmpty) ...[
          SizedBox(height: compact ? 8 : 12),
          _buildImageGrid(
            imageUrls,
            totalHeight: compact ? 160 : imageHeight,
            compact: compact,
          ),
        ],
      ],
    );
  }

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
    _highlightResetTimer?.cancel();
    _scrollController.dispose();
    super.dispose();
  }

  void _handleFocusRequest(CommunityProvider provider, String focusedPostId) {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        0,
        duration: const Duration(milliseconds: 260),
        curve: Curves.easeOut,
      );
    }

    setState(() {
      _highlightedPostId = focusedPostId;
    });

    _highlightResetTimer?.cancel();
    _highlightResetTimer = Timer(const Duration(seconds: 3), () {
      if (!mounted) return;
      setState(() {
        _highlightedPostId = null;
      });
    });

    provider.clearFocusRequest();
  }

  void _showCommentSheet(
    Post post,
    CommunityProvider provider,
    AppLocalizations l10n,
    String? currentUserId,
  ) {
    final TextEditingController commentController = TextEditingController();
    final List<_CommentComposerImage> composerImages = [];
    provider.fetchComments(post.id);
    provider.setReplyTarget(null);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.transparent,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) => Consumer<CommunityProvider>(
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
                                style: const TextStyle(
                                  color: AppColors.textGrey,
                                ),
                              ),
                            )
                          : ListView.builder(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 16,
                              ),
                              itemCount: comments.length,
                              itemBuilder: (context, index) =>
                                  _buildCommentItem(
                                    comments[index],
                                    provider,
                                    l10n,
                                    post.id,
                                    currentUserId: currentUserId,
                                  ),
                            ),
                    ),
                    _buildCommentInputSection(
                      commentController,
                      post,
                      provider,
                      replyTarget,
                      l10n,
                      composerImages,
                      onPickImages: () async {
                        final picked = await _cameraService
                            .pickImagesFromGallery();
                        if (picked.isEmpty) return;

                        final incoming = picked
                            .map((file) => _CommentComposerImage(file: file))
                            .toList();

                        setModalState(() {
                          composerImages.addAll(incoming);
                        });

                        final uploadedUrls = await provider.preUploadImages(
                          picked.map((e) => e.path).toList(),
                        );

                        if (!mounted) return;

                        var hasFailedUpload = false;
                        setModalState(() {
                          for (var i = 0; i < incoming.length; i++) {
                            incoming[i].isUploading = false;
                            if (i < uploadedUrls.length &&
                                uploadedUrls[i].trim().isNotEmpty) {
                              incoming[i].uploadedUrl = uploadedUrls[i].trim();
                              incoming[i].isUploadFailed = false;
                            } else {
                              incoming[i].isUploadFailed = true;
                              hasFailedUpload = true;
                            }
                          }
                        });

                        if (hasFailedUpload && mounted) {
                          AppNotifier.showError(
                            this.context,
                            l10n.uploadImageFailed,
                          );
                        }
                      },
                      onRemoveImage: (index) {
                        if (index < 0 || index >= composerImages.length) return;
                        setModalState(() {
                          composerImages.removeAt(index);
                        });
                      },
                      onClearImages: () {
                        setModalState(() {
                          composerImages.clear();
                        });
                      },
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Future<void> _showEditCommentDialog({
    required Comment comment,
    required String postId,
    required CommunityProvider provider,
    required AppLocalizations l10n,
    String? parentId,
  }) async {
    final initialText = _extractPlainTextFromHtml(comment.content);
    final existingImageUrls = _extractImageUrlsFromHtml(comment.content);
    final uploadingImages = <_EditComposerImage>[];
    final controller = TextEditingController(text: initialText);

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            final hasUploading = uploadingImages.any(
              (item) => item.isUploading,
            );
            final hasFailed = uploadingImages.any(
              (item) => item.isUploadFailed,
            );
            return AlertDialog(
              title: Text(l10n.update),
              content: SizedBox(
                width: 360,
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      TextField(
                        controller: controller,
                        maxLines: 5,
                        decoration: InputDecoration(hintText: l10n.commentHint),
                      ),
                      const SizedBox(height: 12),
                      OutlinedButton.icon(
                        onPressed: () async {
                          final picked = await _cameraService
                              .pickImagesFromGallery();
                          if (picked.isEmpty) return;

                          final incoming = picked
                              .map((file) => _EditComposerImage(file: file))
                              .toList();

                          setModalState(() {
                            uploadingImages.addAll(incoming);
                          });

                          final uploadedUrls = await provider.preUploadImages(
                            picked.map((e) => e.path).toList(),
                          );

                          if (!mounted) return;

                          setModalState(() {
                            for (var i = 0; i < incoming.length; i++) {
                              incoming[i].isUploading = false;
                              if (i < uploadedUrls.length &&
                                  uploadedUrls[i].trim().isNotEmpty) {
                                incoming[i].uploadedUrl = uploadedUrls[i]
                                    .trim();
                                incoming[i].isUploadFailed = false;
                              } else {
                                incoming[i].isUploadFailed = true;
                              }
                            }
                          });
                        },
                        icon: const Icon(Icons.photo_library_outlined),
                        label: Text(l10n.uploadPhoto),
                      ),
                      const SizedBox(height: 12),
                      if (existingImageUrls.isNotEmpty ||
                          uploadingImages.isNotEmpty)
                        SizedBox(
                          height: 80,
                          child: ListView(
                            scrollDirection: Axis.horizontal,
                            children: [
                              ...existingImageUrls.asMap().entries.map(
                                (entry) => Padding(
                                  padding: const EdgeInsets.only(right: 8),
                                  child: Stack(
                                    children: [
                                      ClipRRect(
                                        borderRadius: BorderRadius.circular(8),
                                        child: CachedNetworkImage(
                                          imageUrl: ImageHelper.getThumbnailUrl(
                                            entry.value,
                                          ),
                                          width: 80,
                                          height: 80,
                                          fit: BoxFit.cover,
                                        ),
                                      ),
                                      Positioned(
                                        top: 4,
                                        right: 4,
                                        child: GestureDetector(
                                          onTap: () {
                                            setModalState(() {
                                              existingImageUrls.removeAt(
                                                entry.key,
                                              );
                                            });
                                          },
                                          child: Container(
                                            width: 18,
                                            height: 18,
                                            decoration: const BoxDecoration(
                                              color: AppColors.black,
                                              shape: BoxShape.circle,
                                            ),
                                            child: const Icon(
                                              Icons.close,
                                              size: 12,
                                              color: AppColors.white,
                                            ),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                              ...uploadingImages.asMap().entries.map(
                                (entry) => Padding(
                                  padding: const EdgeInsets.only(right: 8),
                                  child: Stack(
                                    children: [
                                      ClipRRect(
                                        borderRadius: BorderRadius.circular(8),
                                        child: Image.file(
                                          entry.value.file,
                                          width: 80,
                                          height: 80,
                                          fit: BoxFit.cover,
                                        ),
                                      ),
                                      if (entry.value.isUploading)
                                        Positioned.fill(
                                          child: Container(
                                            decoration: BoxDecoration(
                                              color: AppColors.black.withValues(
                                                alpha: 0.35,
                                              ),
                                              borderRadius:
                                                  BorderRadius.circular(8),
                                            ),
                                            alignment: Alignment.center,
                                            child: const SizedBox(
                                              width: 16,
                                              height: 16,
                                              child: CircularProgressIndicator(
                                                strokeWidth: 2,
                                                color: AppColors.white,
                                              ),
                                            ),
                                          ),
                                        ),
                                      if (entry.value.isUploadFailed)
                                        Positioned.fill(
                                          child: Container(
                                            decoration: BoxDecoration(
                                              color: AppColors.error.withValues(
                                                alpha: 0.3,
                                              ),
                                              borderRadius:
                                                  BorderRadius.circular(8),
                                            ),
                                            alignment: Alignment.center,
                                            child: const Icon(
                                              Icons.error_outline,
                                              color: AppColors.white,
                                              size: 18,
                                            ),
                                          ),
                                        ),
                                      Positioned(
                                        top: 4,
                                        right: 4,
                                        child: GestureDetector(
                                          onTap: () {
                                            setModalState(() {
                                              uploadingImages.removeAt(
                                                entry.key,
                                              );
                                            });
                                          },
                                          child: Container(
                                            width: 18,
                                            height: 18,
                                            decoration: const BoxDecoration(
                                              color: AppColors.black,
                                              shape: BoxShape.circle,
                                            ),
                                            child: const Icon(
                                              Icons.close,
                                              size: 12,
                                              color: AppColors.white,
                                            ),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(dialogContext, false),
                  child: Text(l10n.cancel),
                ),
                ElevatedButton(
                  onPressed: () {
                    if (hasUploading) {
                      AppNotifier.showError(this.context, l10n.uploadingImage);
                      return;
                    }

                    if (hasFailed) {
                      AppNotifier.showError(
                        this.context,
                        l10n.uploadImageFailed,
                      );
                      return;
                    }

                    final newImageUrls = uploadingImages
                        .where((item) => item.uploadedUrl != null)
                        .map((item) => item.uploadedUrl!)
                        .toList();

                    final candidateHtml = _composeHtmlContent(
                      text: controller.text.trim(),
                      imageUrls: [...existingImageUrls, ...newImageUrls],
                    );

                    if (candidateHtml.trim().isEmpty) {
                      AppNotifier.showError(this.context, l10n.shareSomething);
                      return;
                    }

                    Navigator.pop(dialogContext, true);
                  },
                  child: Text(l10n.update),
                ),
              ],
            );
          },
        );
      },
    );

    if (confirmed != true) return;

    final newImageUrls = uploadingImages
        .where((item) => item.uploadedUrl != null)
        .map((item) => item.uploadedUrl!)
        .toList();

    final updatedHtml = _composeHtmlContent(
      text: controller.text.trim(),
      imageUrls: [...existingImageUrls, ...newImageUrls],
    );

    final success = await provider.updateComment(
      commentId: comment.id,
      postId: postId,
      content: updatedHtml,
      parentId: parentId,
    );

    if (!mounted) return;
    if (success) {
      AppNotifier.showSuccess(context, l10n.success);
      return;
    }

    AppNotifier.showError(context, provider.errorMessage ?? l10n.failed);
  }

  Future<void> _showDeleteCommentConfirm({
    required Comment comment,
    required String postId,
    required CommunityProvider provider,
    required AppLocalizations l10n,
    String? parentId,
  }) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text(l10n.confirmDelete),
        content: Text(l10n.deletePostConfirm),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: Text(l10n.cancel),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            child: Text(l10n.delete),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    final success = await provider.deleteComment(
      commentId: comment.id,
      postId: postId,
      parentId: parentId,
    );

    if (!mounted) return;
    if (success) {
      AppNotifier.showSuccess(context, l10n.success);
      return;
    }

    AppNotifier.showError(context, provider.errorMessage ?? l10n.failed);
  }

  Future<void> _showEditPostDialog(
    Post post,
    CommunityProvider provider,
    AppLocalizations l10n,
  ) async {
    final controller = TextEditingController(
      text: _extractPlainTextFromHtml(post.content),
    );
    final existingImageUrls = _extractImageUrlsFromHtml(post.content);
    final uploadingImages = <_EditComposerImage>[];

    final updated = await showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return AlertDialog(
              title: Text(
                l10n.editPost,
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              content: SizedBox(
                width: 360,
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      TextField(
                        controller: controller,
                        maxLines: 6,
                        decoration: InputDecoration(hintText: l10n.commentHint),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          OutlinedButton.icon(
                            onPressed: () async {
                              final picked = await _cameraService
                                  .pickImagesFromGallery();
                              if (picked.isEmpty) return;

                              final incoming = picked
                                  .map((file) => _EditComposerImage(file: file))
                                  .toList();

                              setModalState(() {
                                uploadingImages.addAll(incoming);
                              });

                              final uploadedUrls = await provider
                                  .preUploadImages(
                                    picked.map((e) => e.path).toList(),
                                  );

                              if (!mounted) return;

                              setModalState(() {
                                for (var i = 0; i < incoming.length; i++) {
                                  incoming[i].isUploading = false;
                                  if (i < uploadedUrls.length &&
                                      uploadedUrls[i].trim().isNotEmpty) {
                                    incoming[i].uploadedUrl = uploadedUrls[i]
                                        .trim();
                                    incoming[i].isUploadFailed = false;
                                  } else {
                                    incoming[i].isUploadFailed = true;
                                  }
                                }
                              });
                            },
                            icon: const Icon(Icons.photo_library_outlined),
                            label: Text(l10n.uploadPhoto),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      if (existingImageUrls.isNotEmpty ||
                          uploadingImages.isNotEmpty)
                        SizedBox(
                          height: 80,
                          child: ListView(
                            scrollDirection: Axis.horizontal,
                            children: [
                              ...existingImageUrls.asMap().entries.map(
                                (entry) => Padding(
                                  padding: const EdgeInsets.only(right: 8),
                                  child: Stack(
                                    children: [
                                      ClipRRect(
                                        borderRadius: BorderRadius.circular(8),
                                        child: CachedNetworkImage(
                                          imageUrl: ImageHelper.getThumbnailUrl(
                                            entry.value,
                                          ),
                                          width: 80,
                                          height: 80,
                                          fit: BoxFit.cover,
                                        ),
                                      ),
                                      Positioned(
                                        top: 4,
                                        right: 4,
                                        child: GestureDetector(
                                          onTap: () {
                                            setModalState(() {
                                              existingImageUrls.removeAt(
                                                entry.key,
                                              );
                                            });
                                          },
                                          child: Container(
                                            width: 18,
                                            height: 18,
                                            decoration: const BoxDecoration(
                                              color: AppColors.black,
                                              shape: BoxShape.circle,
                                            ),
                                            child: const Icon(
                                              Icons.close,
                                              size: 12,
                                              color: AppColors.white,
                                            ),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                              ...uploadingImages.asMap().entries.map(
                                (entry) => Padding(
                                  padding: const EdgeInsets.only(right: 8),
                                  child: Stack(
                                    children: [
                                      ClipRRect(
                                        borderRadius: BorderRadius.circular(8),
                                        child: Image.file(
                                          entry.value.file,
                                          width: 80,
                                          height: 80,
                                          fit: BoxFit.cover,
                                        ),
                                      ),
                                      if (entry.value.isUploading)
                                        Positioned.fill(
                                          child: Container(
                                            decoration: BoxDecoration(
                                              color: AppColors.black.withValues(
                                                alpha: 0.35,
                                              ),
                                              borderRadius:
                                                  BorderRadius.circular(8),
                                            ),
                                            alignment: Alignment.center,
                                            child: const SizedBox(
                                              width: 16,
                                              height: 16,
                                              child: CircularProgressIndicator(
                                                strokeWidth: 2,
                                                color: AppColors.white,
                                              ),
                                            ),
                                          ),
                                        ),
                                      if (entry.value.isUploadFailed)
                                        Positioned.fill(
                                          child: Container(
                                            decoration: BoxDecoration(
                                              color: AppColors.error.withValues(
                                                alpha: 0.3,
                                              ),
                                              borderRadius:
                                                  BorderRadius.circular(8),
                                            ),
                                            alignment: Alignment.center,
                                            child: const Icon(
                                              Icons.error_outline,
                                              color: AppColors.white,
                                              size: 18,
                                            ),
                                          ),
                                        ),
                                      Positioned(
                                        top: 4,
                                        right: 4,
                                        child: GestureDetector(
                                          onTap: () {
                                            setModalState(() {
                                              uploadingImages.removeAt(
                                                entry.key,
                                              );
                                            });
                                          },
                                          child: Container(
                                            width: 18,
                                            height: 18,
                                            decoration: const BoxDecoration(
                                              color: AppColors.black,
                                              shape: BoxShape.circle,
                                            ),
                                            child: const Icon(
                                              Icons.close,
                                              size: 12,
                                              color: AppColors.white,
                                            ),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(dialogContext, false),
                  child: Text(l10n.cancel),
                ),
                ElevatedButton(
                  onPressed: () {
                    Navigator.pop(dialogContext, true);
                  },
                  child: Text(l10n.update),
                ),
              ],
            );
          },
        );
      },
    );

    if (updated == true) {
      final hasUploading = uploadingImages.any((item) => item.isUploading);
      if (hasUploading) {
        if (!mounted) return;
        AppNotifier.showError(context, l10n.uploadingImage);
        return;
      }

      final newImageUrls = uploadingImages
          .where((item) => item.uploadedUrl != null)
          .map((item) => item.uploadedUrl!)
          .toList();

      final updatedHtml = _composeHtmlContent(
        text: controller.text.trim(),
        imageUrls: [...existingImageUrls, ...newImageUrls],
      );

      if (updatedHtml.trim().isEmpty) {
        if (!mounted) return;
        AppNotifier.showError(context, l10n.shareSomething);
        return;
      }

      final success = await provider.updatePost(
        post.id,
        updatedHtml,
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
    List<_CommentComposerImage> composerImages, {
    required VoidCallback onPickImages,
    required ValueChanged<int> onRemoveImage,
    VoidCallback? onClearImages,
  }) {
    final clearImages = onClearImages ?? () {};
    final uploadedImageUrls = composerImages
        .where((item) => (item.uploadedUrl ?? '').trim().isNotEmpty)
        .map((item) => item.uploadedUrl!.trim())
        .toList();
    final hasUploadingImages = composerImages.any((item) => item.isUploading);
    final hasFailedImages = composerImages.any((item) => item.isUploadFailed);

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
              IconButton(
                onPressed: onPickImages,
                icon: const Icon(Icons.photo_library_outlined),
                color: AppColors.primary,
              ),
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
                    final hasText = controller.text.trim().isNotEmpty;
                    final hasImages = uploadedImageUrls.isNotEmpty;
                    if (!hasText && !hasImages) return;

                    if (hasUploadingImages) {
                      AppNotifier.showError(context, l10n.uploadingImage);
                      return;
                    }

                    if (hasFailedImages) {
                      AppNotifier.showError(context, l10n.uploadImageFailed);
                      return;
                    }

                    final success = await provider.sendComment(
                      post.id,
                      controller.text.trim(),
                      uploadedImageUrls: uploadedImageUrls,
                    );

                    if (!mounted) return;

                    if (success) {
                      controller.clear();
                      clearImages();
                    } else if (provider.errorMessage == 'uploadImageFailed') {
                      AppNotifier.showError(context, l10n.uploadImageFailed);
                    }
                  },
                ),
              ),
            ],
          ),
          if (composerImages.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SizedBox(
                    height: 64,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: composerImages.length,
                      separatorBuilder: (_, separatorIndex) =>
                          const SizedBox(width: 8),
                      itemBuilder: (context, index) {
                        final image = composerImages[index];
                        return Stack(
                          children: [
                            Opacity(
                              opacity: image.isUploading ? 0.45 : 1,
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(8),
                                child: Image.file(
                                  image.file,
                                  width: 64,
                                  height: 64,
                                  fit: BoxFit.cover,
                                ),
                              ),
                            ),
                            if (image.isUploading)
                              Positioned.fill(
                                child: Container(
                                  decoration: BoxDecoration(
                                    color: AppColors.black.withValues(
                                      alpha: 0.25,
                                    ),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  alignment: Alignment.center,
                                  child: const SizedBox(
                                    width: 14,
                                    height: 14,
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
                                    color: AppColors.error.withValues(
                                      alpha: 0.3,
                                    ),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  alignment: Alignment.center,
                                  child: const Icon(
                                    Icons.error_outline,
                                    color: AppColors.white,
                                    size: 16,
                                  ),
                                ),
                              ),
                            Positioned(
                              top: 2,
                              right: 2,
                              child: GestureDetector(
                                onTap: () => onRemoveImage(index),
                                child: Container(
                                  width: 18,
                                  height: 18,
                                  decoration: const BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: AppColors.black,
                                  ),
                                  child: const Icon(
                                    Icons.close,
                                    color: AppColors.white,
                                    size: 12,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    '${uploadedImageUrls.length}/${composerImages.length}',
                    style: const TextStyle(
                      color: AppColors.textGrey,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
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
    String? currentUserId,
    String? parentCommentId,
  }) {
    final isMyComment =
        currentUserId != null && currentUserId == comment.author.id;
    final replies = provider.getRepliesForComment(comment.id);
    final isRepliesLoading = provider.isRepliesLoading(comment.id);
    final hasHiddenReplies = comment.replyCount > 0 && replies.isEmpty;
    final hiddenReplyLabel = '${l10n.viewReplies} (${comment.replyCount})';

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
                      padding: EdgeInsets.fromLTRB(
                        isReply ? 0 : 12,
                        12,
                        isReply ? 0 : 12,
                        12,
                      ),
                      decoration: BoxDecoration(
                        color: isReply
                            ? AppColors.transparent
                            : AppColors.background,
                        borderRadius: isReply
                            ? BorderRadius.zero
                            : BorderRadius.circular(16),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.center,
                            children: [
                              Expanded(
                                child: Text(
                                  comment.author.fullName,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 13,
                                    color: AppColors.textDark,
                                  ),
                                ),
                              ),
                              // Hiển thị menu cho cả comment chính chủ lẫn comment người khác
                              if (currentUserId != null)
                                SizedBox(
                                  width: 28,
                                  height: 24,
                                  child: PopupMenuButton<String>(
                                    tooltip: '',
                                    padding: EdgeInsets.zero,
                                    constraints: const BoxConstraints(
                                      minWidth: 110,
                                    ),
                                    icon: const Icon(
                                      Icons.more_vert,
                                      size: 16,
                                      color: AppColors.textGrey,
                                    ),
                                    onSelected: (value) {
                                      if (value == 'edit') {
                                        _showEditCommentDialog(
                                          comment: comment,
                                          postId: postId,
                                          provider: provider,
                                          l10n: l10n,
                                          parentId: parentCommentId,
                                        );
                                      } else if (value == 'delete') {
                                        _showDeleteCommentConfirm(
                                          comment: comment,
                                          postId: postId,
                                          provider: provider,
                                          l10n: l10n,
                                          parentId: parentCommentId,
                                        );
                                      } else if (value == 'report') {
                                        // Kiểm tra đã tố cáo comment này chưa trong phiên
                                        if (provider.isCommentReported(comment.id)) {
                                          AppNotifier.showInfo(
                                            context,
                                            l10n.reportAlreadyReported,
                                          );
                                          return;
                                        }
                                        showModalBottomSheet(
                                          context: context,
                                          isScrollControlled: true,
                                          backgroundColor: Colors.transparent,
                                          builder: (_) => ReportReasonSheet(
                                            targetId: comment.id,
                                            targetType: ReportTargetType.comment,
                                            onReported: () =>
                                                provider.markCommentReported(comment.id),
                                          ),
                                        );
                                      }
                                    },
                                    itemBuilder: (_) => isMyComment
                                        ? [
                                            // Comment chính chủ: Edit & Delete
                                            PopupMenuItem(
                                              value: 'edit',
                                              child: Text(l10n.update),
                                            ),
                                            PopupMenuItem(
                                              value: 'delete',
                                              child: Text(l10n.delete),
                                            ),
                                          ]
                                        : [
                                            // Comment người khác: Tố cáo
                                            PopupMenuItem(
                                              value: 'report',
                                              child: Row(
                                                children: [
                                                  const Icon(
                                                    Icons.flag_outlined,
                                                    size: 18,
                                                    color: AppColors.textGrey,
                                                  ),
                                                  const SizedBox(width: 8),
                                                  Text(l10n.reportAction),
                                                ],
                                              ),
                                            ),
                                          ],
                                  ),
                                ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          _buildHtmlContentView(
                            comment.content,
                            textStyle: const TextStyle(
                              fontSize: 14,
                              color: AppColors.textDark,
                            ),
                            imageHeight: isReply ? 130 : 170,
                            compact: true,
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
                  currentUserId: currentUserId,
                  parentCommentId: comment.id,
                ),
              )
            else if (!isRepliesLoading && hasHiddenReplies)
              Padding(
                padding: const EdgeInsets.only(left: 50, top: 8),
                child: GestureDetector(
                  onTap: () => provider.fetchReplies(comment.id),
                  child: Text(
                    hiddenReplyLabel,
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
    final languageCode = Localizations.localeOf(context).languageCode;
    final provider = context.watch<CommunityProvider>();
    final currentUser = context.watch<AuthProvider>().user;

    if (provider.focusRequestVersion > _handledFocusRequestVersion &&
        provider.focusedPostId != null) {
      final focusedPostId = provider.focusedPostId!;
      _handledFocusRequestVersion = provider.focusRequestVersion;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        _handleFocusRequest(provider, focusedPostId);
      });
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            _buildSearchBar(l10n),
            if (provider.isSearching) _buildSearchStatusChip(provider, l10n),
            _buildCategoryTabs(provider, l10n, languageCode),
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
                    : (provider.isSearching && provider.posts.isEmpty && !provider.isLoading)
                        ? ListView(
                            controller: _scrollController,
                            children: [_buildSearchEmptyState(l10n)],
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
                                languageCode,
                                currentUser?.id,
                                provider.posts[index - 1].id == _highlightedPostId,
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
    final provider = context.watch<CommunityProvider>();
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      decoration: const BoxDecoration(
        color: AppColors.appBarBackground,
        border: Border(bottom: BorderSide(color: AppColors.divider)),
      ),
      child: Row(
        children: [
          Expanded(
            child: ForumSearchBar(
              value: provider.searchKeyword,
              hintText: l10n.forumSearchPlaceholder,
              onSearch: (keyword) =>
                  context.read<CommunityProvider>().setSearchKeyword(keyword),
            ),
          ),
          const SizedBox(width: 12),
          const NotificationBellButton(
            iconColor: AppColors.textDark,
            iconSize: 28,
          ),
        ],
      ),
    );
  }

  Widget _buildSearchStatusChip(CommunityProvider provider, AppLocalizations l10n) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      color: AppColors.appBarBackground,
      child: Row(
        children: [
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Text(
                l10n.forumSearchActive(provider.searchKeyword),
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppColors.primary,
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: () => context.read<CommunityProvider>().setSearchKeyword(''),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: Text(
                l10n.forumSearchClear,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppColors.primary,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchEmptyState(AppLocalizations l10n) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 60),
      child: Column(
        children: [
          const Icon(Icons.search_off, size: 56, color: AppColors.iconGrey),
          const SizedBox(height: 12),
          Text(
            l10n.forumSearchEmptyTitle,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: AppColors.textDark,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            l10n.forumSearchEmptyHint,
            style: const TextStyle(
              fontSize: 13,
              color: AppColors.textGrey,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPostInput(AppLocalizations l10n) {
    final user = context.watch<AuthProvider>().user;
    return Container(
      margin: const EdgeInsets.fromLTRB(12, 10, 12, 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.cardBackground,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.divider),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 18,
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
                height: 40,
                padding: const EdgeInsets.symmetric(horizontal: 14),
                alignment: Alignment.centerLeft,
                decoration: BoxDecoration(
                  color: AppColors.formFillDisabled,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.divider),
                ),
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: Alignment.centerLeft,
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
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryTabs(
    CommunityProvider provider,
    AppLocalizations l10n,
    String languageCode,
  ) {
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
                isAllTab ? l10n.all : topic!.displayName(languageCode),
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
    String languageCode,
    String? currentUserId,
    bool isHighlighted,
  ) {
    return Container(
      margin: const EdgeInsets.fromLTRB(12, 12, 12, 0),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.cardBackground,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isHighlighted ? AppColors.primary : AppColors.divider,
          width: isHighlighted ? 1.6 : 1,
        ),
        boxShadow: [
          BoxShadow(
            color: isHighlighted
                ? AppColors.primary.withValues(alpha: 0.18)
                : Colors.black.withValues(alpha: 0.04),
            blurRadius: isHighlighted ? 14 : 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
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
                    '${DateFormat('dd/MM HH:mm').format(post.createdAt)} ${post.topic != null ? "• ${post.topic!.displayName(languageCode)}" : ""}',
                    style: const TextStyle(
                      color: AppColors.textGrey,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
              const Spacer(),
              if (currentUserId != null)
                PopupMenuButton<String>(
                  tooltip: '',
                  icon: const Icon(Icons.more_horiz, color: AppColors.iconGrey),
                  onSelected: (value) {
                    if (value == 'edit') {
                      _showEditPostDialog(post, provider, l10n);
                    } else if (value == 'delete') {
                      _showDeletePostConfirm(post, provider, l10n);
                    } else if (value == 'report') {
                      if (provider.isPostReported(post.id)) {
                        AppNotifier.showInfo(
                          context,
                          l10n.reportPostAlreadyReported,
                        );
                        return;
                      }
                      showModalBottomSheet(
                        context: context,
                        isScrollControlled: true,
                        backgroundColor: Colors.transparent,
                        builder: (_) => ReportReasonSheet(
                          targetId: post.id,
                          targetType: ReportTargetType.post,
                          onReported: () => provider.markPostReported(post.id),
                        ),
                      );
                    }
                  },
                  itemBuilder: (context) =>
                      currentUserId == post.author.id
                          ? [
                              // Bài viết chính chủ: Edit & Delete
                              PopupMenuItem(
                                value: 'edit',
                                child: Text(l10n.editPost),
                              ),
                              PopupMenuItem(
                                value: 'delete',
                                child: Text(l10n.delete),
                              ),
                            ]
                          : [
                              // Bài viết người khác: Tố cáo
                              PopupMenuItem(
                                value: 'report',
                                child: Row(
                                  children: [
                                    const Icon(
                                      Icons.flag_outlined,
                                      size: 18,
                                      color: AppColors.textGrey,
                                    ),
                                    const SizedBox(width: 8),
                                    Text(l10n.reportAction),
                                  ],
                                ),
                              ),
                            ],
                )
              else
                const Icon(Icons.more_horiz, color: AppColors.iconGrey),
            ],
          ),
          const SizedBox(height: 16),
          _buildHtmlContentView(
            post.content,
            textStyle: const TextStyle(
              fontSize: 15,
              color: AppColors.textDark,
              height: 1.4,
            ),
            imageHeight: 220,
          ),
          if (_extractImageUrlsFromHtml(post.content).isEmpty &&
              post.images.isNotEmpty) ...[
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
                onTap: provider.isLikeUpdating(post.id)
                    ? null
                    : () => provider.toggleLike(post.id),
              ),
              const SizedBox(width: 24),
              _buildInteractionItem(
                icon: Icons.chat_bubble_outline,
                label: '${post.commentCount}',
                color: AppColors.textGrey,
                onTap: () =>
                    _showCommentSheet(post, provider, l10n, currentUserId),
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
    required VoidCallback? onTap,
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

class _EditComposerImage {
  final File file;
  String? uploadedUrl;
  bool isUploading = true;
  bool isUploadFailed = false;

  _EditComposerImage({required this.file});
}

class _CommentComposerImage {
  final File file;
  String? uploadedUrl;
  bool isUploading = true;
  bool isUploadFailed = false;

  _CommentComposerImage({required this.file});
}

class _AdaptiveSingleImage extends StatefulWidget {
  final String url;
  final List<String> allUrls;
  final bool compact;

  const _AdaptiveSingleImage({
    required this.url,
    required this.allUrls,
    required this.compact,
  });

  @override
  State<_AdaptiveSingleImage> createState() => _AdaptiveSingleImageState();
}

class _AdaptiveSingleImageState extends State<_AdaptiveSingleImage> {
  double? _aspectRatio;
  ImageStream? _stream;
  ImageStreamListener? _listener;

  @override
  void initState() {
    super.initState();
    _resolveDimensions();
  }

  @override
  void dispose() {
    if (_stream != null && _listener != null) {
      _stream!.removeListener(_listener!);
    }
    super.dispose();
  }

  void _resolveDimensions() {
    final provider = CachedNetworkImageProvider(
      ImageHelper.getThumbnailUrl(widget.url),
    );
    _stream = provider.resolve(const ImageConfiguration());
    _listener = ImageStreamListener(
      (info, _) {
        if (!mounted) return;
        final w = info.image.width.toDouble();
        final h = info.image.height.toDouble();
        if (w <= 0 || h <= 0) return;

        final minR = widget.compact ? 4.0 / 3.0 : 4.0 / 5.0;
        const maxR = 16.0 / 9.0;
        double ratio = w / h;
        if (ratio < minR) ratio = minR;
        if (ratio > maxR) ratio = maxR;

        setState(() => _aspectRatio = ratio);
      },
      onError: (_, _) {},
    );
    _stream!.addListener(_listener!);
  }

  @override
  Widget build(BuildContext context) {
    final ratio = _aspectRatio ?? (widget.compact ? 4.0 / 3.0 : 4.0 / 3.0);

    final imageWidget = GestureDetector(
      onTap: () =>
          ImageViewer.show(context, widget.allUrls, initialIndex: 0),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: AspectRatio(
          aspectRatio: ratio,
          child: CachedNetworkImage(
            imageUrl: ImageHelper.getThumbnailUrl(widget.url),
            fit: BoxFit.cover,
            placeholder: (_, _) =>
                Container(color: AppColors.background),
            errorWidget: (_, _, _) =>
                Container(color: AppColors.background),
          ),
        ),
      ),
    );

    // Ở comment (compact) căn ảnh về trái và thu hẹp bề ngang
    // để không bị "trôi" vào giữa bubble bình luận.
    if (widget.compact) {
      return Align(
        alignment: Alignment.centerLeft,
        child: FractionallySizedBox(
          widthFactor: 0.75,
          alignment: Alignment.centerLeft,
          child: imageWidget,
        ),
      );
    }

    return imageWidget;
  }
}
