import 'package:flutter/material.dart';

import '../../data/community_repository.dart';
import '../../data/models/community_models.dart';

class CommunityProvider with ChangeNotifier {
  final CommunityRepository _repository = CommunityRepository();

  List<Post> _posts = [];
  List<Topic> _topics = [];
  final Map<String, List<Comment>> _postComments = {};
  final Map<String, List<Comment>> _commentReplies = {};
  final Map<String, bool> _isCommentsLoading = {};
  final Map<String, bool> _isRepliesLoading = {};
  final Map<String, bool> _isLikeUpdating = {};

  // Theo dõi các comment/bài viết đã tố cáo trong phiên hiện tại (in-memory, reset khi logout)
  final Set<String> _reportedCommentIds = {};
  final Set<String> _reportedPostIds = {};

  bool _isLoading = false;
  bool _isMoreLoading = false;
  String? _errorMessage;
  String? _selectedTopicId;
  String _searchKeyword = '';
  String? _focusedPostId;
  int _focusRequestVersion = 0;

  // BE Elasticsearch RRF có rank_window_size hardcode 50 → khi search limit phải <= 50.
  static const int _searchLimit = 50;

  Comment? _activeReplyTarget;

  List<Post> get posts => _posts;
  List<Topic> get topics => _topics;
  bool get isLoading => _isLoading;
  bool get isMoreLoading => _isMoreLoading;
  String? get errorMessage => _errorMessage;
  String? get selectedTopicId => _selectedTopicId;
  String get searchKeyword => _searchKeyword;
  bool get isSearching => _searchKeyword.isNotEmpty;
  String? get focusedPostId => _focusedPostId;
  int get focusRequestVersion => _focusRequestVersion;
  Comment? get activeReplyTarget => _activeReplyTarget;

  List<Comment> getCommentsForPost(String postId) =>
      _postComments[postId] ?? [];

  List<Comment> getRepliesForComment(String commentId) =>
      _commentReplies[commentId] ?? [];

  bool isCommentsLoading(String postId) => _isCommentsLoading[postId] ?? false;
  bool isRepliesLoading(String commentId) =>
      _isRepliesLoading[commentId] ?? false;
  bool isLikeUpdating(String postId) => _isLikeUpdating[postId] ?? false;
  bool isCommentReported(String commentId) =>
      _reportedCommentIds.contains(commentId);
  bool isPostReported(String postId) => _reportedPostIds.contains(postId);

  void markCommentReported(String commentId) {
    _reportedCommentIds.add(commentId);
    notifyListeners();
  }

  void markPostReported(String postId) {
    _reportedPostIds.add(postId);
    notifyListeners();
  }

  void clearReportState() {
    _reportedCommentIds.clear();
    _reportedPostIds.clear();
  }

  void setReplyTarget(Comment? comment) {
    _activeReplyTarget = comment;
    notifyListeners();
  }

  List<Post> _filterPostsBySelectedTopic(List<Post> source) {
    if (_selectedTopicId == null || _selectedTopicId!.isEmpty) {
      return source;
    }

    return source.where((post) => post.topic?.id == _selectedTopicId).toList();
  }

  void _appendUniquePosts(List<Post> newPosts) {
    if (newPosts.isEmpty) return;

    final existingIds = _posts.map((p) => p.id).toSet();
    for (final post in newPosts) {
      if (!existingIds.contains(post.id)) {
        _posts.add(post);
      }
    }
  }

  String _escapeHtml(String input) {
    return input
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
  }

  String _buildHtmlContent({
    required String text,
    required List<String> imageUrls,
  }) {
    final trimmed = text.trim();
    final parts = <String>[];

    if (trimmed.isNotEmpty) {
      parts.add('<p>${_escapeHtml(trimmed).replaceAll('\n', '<br/>')}</p>');
    }

    for (final url in imageUrls) {
      if (url.trim().isEmpty) continue;
      parts.add('<img src="${url.trim()}" />');
    }

    return parts.join('\n');
  }

  Future<void> fetchTopics() async {
    try {
      _topics = await _repository.getTopics();
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
    }
  }

  // Khi có keyword search → BE đi nhánh ES RRF, bị giới hạn limit <= 50.
  // Khi không search → BE đi nhánh query thường, để default 20 cho consistency với loadMore.
  int? _limitForSearch() => _searchKeyword.isEmpty ? null : _searchLimit;

  Future<void> fetchInitialData() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final limit = _limitForSearch();
      final results = await Future.wait([
        _repository.getTopics(),
        _repository.getPosts(
          topicId: _selectedTopicId,
          keyword: _searchKeyword.isEmpty ? null : _searchKeyword,
          limit: limit ?? 20,
        ),
      ]);

      _topics = results[0] as List<Topic>;
      _posts = _filterPostsBySelectedTopic(results[1] as List<Post>);
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> selectTopic(String? topicId) async {
    if (_selectedTopicId == topicId) return;
    _selectedTopicId = topicId;
    _errorMessage = null;
    _isLoading = true;
    notifyListeners();

    try {
      final limit = _limitForSearch();
      final fetchedPosts = await _repository.getPosts(
        topicId: _selectedTopicId,
        keyword: _searchKeyword.isEmpty ? null : _searchKeyword,
        limit: limit ?? 20,
      );
      _posts = _filterPostsBySelectedTopic(fetchedPosts);
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Đặt keyword (đã debounce ở widget). Reset pagination → fetch lại từ đầu.
  Future<void> setSearchKeyword(String keyword) async {
    final normalized = keyword.trim();
    if (_searchKeyword == normalized) return;
    _searchKeyword = normalized;

    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final limit = _limitForSearch();
      final fetchedPosts = await _repository.getPosts(
        topicId: _selectedTopicId,
        keyword: _searchKeyword.isEmpty ? null : _searchKeyword,
        limit: limit ?? 20,
      );
      _posts = _filterPostsBySelectedTopic(fetchedPosts);
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadMore() async {
    if (_isMoreLoading || _posts.isEmpty) return;
    // Khi đang search BE giới hạn limit=50 và không hỗ trợ pagination ổn định cho RRF →
    // bỏ load thêm trong chế độ search (đồng bộ với Web FE).
    if (_searchKeyword.isNotEmpty) return;

    _isMoreLoading = true;
    notifyListeners();

    try {
      final lastTime = _posts.last.createdAt.toIso8601String();
      final newPosts = await _repository.getPosts(
        lastPostTime: lastTime,
        topicId: _selectedTopicId,
      );
      _appendUniquePosts(_filterPostsBySelectedTopic(newPosts));
    } catch (e) {
      // Log error
    } finally {
      _isMoreLoading = false;
      notifyListeners();
    }
  }

  Future<void> focusPostFromNotification(String postId) async {
    final normalizedId = postId.trim();
    if (normalizedId.isEmpty) return;

    if (_selectedTopicId != null) {
      _selectedTopicId = null;
    }

    final existingIndex = _posts.indexWhere((post) => post.id == normalizedId);
    if (existingIndex > 0) {
      final targetPost = _posts.removeAt(existingIndex);
      _posts.insert(0, targetPost);
    } else if (existingIndex == -1) {
      try {
        final fetchedPost = await _repository.getPostById(normalizedId);
        if (fetchedPost != null) {
          _posts.insert(0, fetchedPost);
        }
      } catch (_) {
        // Keep navigation behavior even if post lookup fails.
      }
    }

    _focusedPostId = normalizedId;
    _focusRequestVersion += 1;
    notifyListeners();
  }

  void clearFocusRequest() {
    if (_focusedPostId == null) return;
    _focusedPostId = null;
    notifyListeners();
  }

  Future<void> toggleLike(String postId) async {
    final postIndex = _posts.indexWhere((p) => p.id == postId);
    if (postIndex == -1) return;
    if (_isLikeUpdating[postId] == true) return;

    _isLikeUpdating[postId] = true;

    final post = _posts[postIndex];
    final originalLiked = post.liked;
    final originalLikeCount = post.likeCount;

    // Optimistic UI Update
    post.liked = !post.liked;
    post.likeCount = post.liked ? post.likeCount + 1 : post.likeCount - 1;
    final optimisticLiked = post.liked;
    final optimisticLikeCount = post.likeCount;
    notifyListeners();

    try {
      PostReactionResult? reaction;
      if (originalLiked) {
        reaction = await _repository.unlikePost(postId);
      } else {
        reaction = await _repository.likePost(postId);
      }

      if (reaction == null) {
        post.liked = originalLiked;
        post.likeCount = originalLikeCount;
        notifyListeners();
      } else {
        // Some BE responses can miss/invalid postId or likeCount (e.g. likeCount=null).
        // Keep optimistic value in that case to avoid UI flicker back to 0.
        final hasInvalidReactionPayload = reaction.postId.isEmpty;
        if (hasInvalidReactionPayload) {
          post.liked = optimisticLiked;
          post.likeCount = optimisticLikeCount;
          notifyListeners();
          return;
        }

        post.liked = reaction.liked;

        final serverLikeCount = reaction.likeCount;
        final shouldKeepOptimisticLikeCount =
            reaction.liked && serverLikeCount == 0 && optimisticLikeCount > 0;

        post.likeCount = shouldKeepOptimisticLikeCount
            ? optimisticLikeCount
            : serverLikeCount;
        notifyListeners();
      }
    } catch (e) {
      post.liked = originalLiked;
      post.likeCount = originalLikeCount;
      notifyListeners();
    } finally {
      _isLikeUpdating[postId] = false;
    }
  }

  Future<void> fetchComments(String postId) async {
    _isCommentsLoading[postId] = true;
    notifyListeners();
    try {
      final comments = await _repository.getComments(postId);
      _postComments[postId] = comments;
    } catch (e) {
      // Log error
    } finally {
      _isCommentsLoading[postId] = false;
      notifyListeners();
    }
  }

  Future<void> fetchReplies(String commentId) async {
    _isRepliesLoading[commentId] = true;
    notifyListeners();
    try {
      final replies = await _repository.getReplies(commentId);
      _commentReplies[commentId] = replies;
    } catch (e) {
      // Log error
    } finally {
      _isRepliesLoading[commentId] = false;
      notifyListeners();
    }
  }

  Future<bool> sendComment(
    String postId,
    String content, {
    List<String> uploadedImageUrls = const [],
    List<String> imagePaths = const [],
  }) async {
    try {
      _errorMessage = null;
      final trimmed = content.trim();
      var finalImageUrls = uploadedImageUrls
          .where((url) => url.trim().isNotEmpty)
          .map((url) => url.trim())
          .toList();

      if (trimmed.isEmpty && finalImageUrls.isEmpty && imagePaths.isEmpty) {
        return false;
      }

      if (finalImageUrls.isEmpty && imagePaths.isNotEmpty) {
        finalImageUrls = await _repository.uploadPostImages(imagePaths);
        if (finalImageUrls.isEmpty) {
          _errorMessage = 'uploadImageFailed';
          return false;
        }
      }

      final htmlContent = _buildHtmlContent(
        text: trimmed,
        imageUrls: finalImageUrls,
      );

      final parentId = _activeReplyTarget?.id;
      final newComment = await _repository.createComment(
        postId,
        htmlContent,
        parentId: parentId,
      );

      if (newComment != null) {
        final postIndex = _posts.indexWhere((p) => p.id == postId);
        if (postIndex != -1) {
          _posts[postIndex].commentCount++;
        }

        if (parentId == null) {
          if (!_postComments.containsKey(postId)) _postComments[postId] = [];
          _postComments[postId]!.insert(0, newComment);
        } else {
          if (!_commentReplies.containsKey(parentId))
            _commentReplies[parentId] = [];
          _commentReplies[parentId]!.insert(0, newComment);
          _incrementReplyCount(parentId);
        }

        _errorMessage = null;
        _activeReplyTarget = null;
        notifyListeners();
        return true;
      }
    } catch (e) {
      _errorMessage = e.toString();
    }
    return false;
  }

  void _incrementReplyCount(String parentId) {
    for (final comments in _postComments.values) {
      final parentIndex = comments.indexWhere(
        (comment) => comment.id == parentId,
      );
      if (parentIndex != -1) {
        comments[parentIndex].replyCount++;
        return;
      }
    }
  }

  Future<bool> updateComment({
    required String commentId,
    required String postId,
    required String content,
    String? parentId,
  }) async {
    try {
      _errorMessage = null;
      final success = await _repository.updateComment(commentId, content);
      if (!success) {
        _errorMessage = 'failed';
        return false;
      }

      final targetList = parentId == null
          ? _postComments[postId]
          : _commentReplies[parentId];

      if (targetList != null) {
        final index = targetList.indexWhere((item) => item.id == commentId);
        if (index != -1) {
          final old = targetList[index];
          targetList[index] = Comment(
            id: old.id,
            content: content,
            createdAt: old.createdAt,
            author: old.author,
            replyCount: old.replyCount,
            replies: old.replies,
          );
        }
      }

      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      return false;
    }
  }

  Future<bool> deleteComment({
    required String commentId,
    required String postId,
    String? parentId,
  }) async {
    try {
      _errorMessage = null;
      final success = await _repository.deleteComment(commentId);
      if (!success) {
        _errorMessage = 'failed';
        return false;
      }

      if (parentId == null) {
        _postComments[postId]?.removeWhere((item) => item.id == commentId);
        _commentReplies.remove(commentId);
      } else {
        _commentReplies[parentId]?.removeWhere((item) => item.id == commentId);
        _decrementReplyCount(parentId);
      }

      final postIndex = _posts.indexWhere((post) => post.id == postId);
      if (postIndex != -1) {
        final currentCount = _posts[postIndex].commentCount;
        _posts[postIndex].commentCount = currentCount > 0
            ? currentCount - 1
            : 0;
      }

      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      return false;
    }
  }

  void _decrementReplyCount(String parentId) {
    for (final comments in _postComments.values) {
      final parentIndex = comments.indexWhere(
        (comment) => comment.id == parentId,
      );
      if (parentIndex != -1) {
        final currentCount = comments[parentIndex].replyCount;
        comments[parentIndex].replyCount = currentCount > 0
            ? currentCount - 1
            : 0;
        return;
      }
    }
  }

  Future<bool> updatePost(String postId, String content, String topicId) async {
    _isLoading = true;
    notifyListeners();
    try {
      final success = await _repository.updatePost(postId, content, topicId);
      if (success) {
        final index = _posts.indexWhere((post) => post.id == postId);
        if (index != -1) {
          _posts[index] = Post(
            id: _posts[index].id,
            content: content,
            images: _posts[index].images,
            createdAt: _posts[index].createdAt,
            author: _posts[index].author,
            topic: _posts[index].topic,
            likeCount: _posts[index].likeCount,
            commentCount: _posts[index].commentCount,
            liked: _posts[index].liked,
          );
        }
        notifyListeners();
      }
      return success;
    } catch (e) {
      _errorMessage = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> deletePost(String postId) async {
    _isLoading = true;
    notifyListeners();
    try {
      final success = await _repository.deletePost(postId);
      if (success) {
        _posts.removeWhere((post) => post.id == postId);
        notifyListeners();
      }
      return success;
    } catch (e) {
      _errorMessage = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> createNewPost({
    required String content,
    required String topicId,
    List<String> imagePaths = const [],
    List<String> uploadedImageUrls = const [],
  }) async {
    _isLoading = true;
    notifyListeners();
    try {
      final trimmed = content.trim();
      if (trimmed.isEmpty && imagePaths.isEmpty && uploadedImageUrls.isEmpty) {
        _errorMessage = 'shareSomething';
        return false;
      }

      var finalImageUrls = uploadedImageUrls
          .where((url) => url.trim().isNotEmpty)
          .map((url) => url.trim())
          .toList();

      if (finalImageUrls.isEmpty && imagePaths.isNotEmpty) {
        finalImageUrls = await _repository.uploadPostImages(imagePaths);
        if (finalImageUrls.isEmpty) {
          _errorMessage = 'uploadImageFailed';
          return false;
        }
      }

      final htmlContent = _buildHtmlContent(
        text: trimmed,
        imageUrls: finalImageUrls,
      );

      final newPost = await _repository.createPost(htmlContent, topicId);
      if (newPost != null) {
        _posts.insert(0, newPost);
        return true;
      }
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
    return false;
  }

  Future<List<String>> preUploadImages(List<String> imagePaths) async {
    if (imagePaths.isEmpty) return [];
    try {
      final uploaded = await _repository.uploadPostImages(imagePaths);
      if (uploaded.isEmpty) {
        _errorMessage = 'uploadImageFailed';
      }
      return uploaded;
    } catch (e) {
      _errorMessage = e.toString();
      return [];
    }
  }
}
