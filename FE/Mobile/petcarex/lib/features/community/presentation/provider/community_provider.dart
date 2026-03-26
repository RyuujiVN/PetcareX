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
  
  bool _isLoading = false;
  bool _isMoreLoading = false;
  String? _errorMessage;
  String? _selectedTopicId;

  Comment? _activeReplyTarget;

  List<Post> get posts => _posts;
  List<Topic> get topics => _topics;
  bool get isLoading => _isLoading;
  bool get isMoreLoading => _isMoreLoading;
  String? get errorMessage => _errorMessage;
  String? get selectedTopicId => _selectedTopicId;
  Comment? get activeReplyTarget => _activeReplyTarget;

  List<Comment> getCommentsForPost(String postId) => _postComments[postId] ?? [];
  
  List<Comment> getRepliesForComment(String commentId) => _commentReplies[commentId] ?? [];
  
  bool isCommentsLoading(String postId) => _isCommentsLoading[postId] ?? false;
  bool isRepliesLoading(String commentId) => _isRepliesLoading[commentId] ?? false;
  bool isLikeUpdating(String postId) => _isLikeUpdating[postId] ?? false;

  void setReplyTarget(Comment? comment) {
    _activeReplyTarget = comment;
    notifyListeners();
  }

  List<Post> _filterPostsBySelectedTopic(List<Post> source) {
    if (_selectedTopicId == null || _selectedTopicId!.isEmpty) {
      return source;
    }

    return source
        .where((post) => post.topic?.id == _selectedTopicId)
        .toList();
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

  Future<void> fetchInitialData() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final results = await Future.wait([
        _repository.getTopics(),
        _repository.getPosts(topicId: _selectedTopicId),
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
      final fetchedPosts = await _repository.getPosts(topicId: _selectedTopicId);
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
        post.liked = reaction.liked;
        post.likeCount = reaction.likeCount;
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
    List<String> imagePaths = const [],
  }) async {
    try {
      final trimmed = content.trim();
      if (trimmed.isEmpty && imagePaths.isEmpty) {
        return false;
      }

      List<String> uploadedImageUrls = [];
      if (imagePaths.isNotEmpty) {
        uploadedImageUrls = await _repository.uploadPostImages(imagePaths);
        if (uploadedImageUrls.isEmpty) {
          _errorMessage = 'uploadImageFailed';
          return false;
        }
      }

      final htmlContent = _buildHtmlContent(
        text: trimmed,
        imageUrls: uploadedImageUrls,
      );

      final parentId = _activeReplyTarget?.id;
      final newComment = await _repository.createComment(
        postId, 
        htmlContent, 
        parentId: parentId
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
          if (!_commentReplies.containsKey(parentId)) _commentReplies[parentId] = [];
          _commentReplies[parentId]!.insert(0, newComment);
          _incrementReplyCount(parentId);
        }
        
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
      final parentIndex = comments.indexWhere((comment) => comment.id == parentId);
      if (parentIndex != -1) {
        comments[parentIndex].replyCount++;
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
