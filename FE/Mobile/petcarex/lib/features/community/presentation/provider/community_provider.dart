import 'package:flutter/material.dart';
import '../../data/community_repository.dart';
import '../../data/models/community_models.dart';

class CommunityProvider with ChangeNotifier {
  final CommunityRepository _repository = CommunityRepository();

  List<Post> _posts = [];
  List<Topic> _topics = [];
  Map<String, List<Comment>> _postComments = {};
  Map<String, List<Comment>> _commentReplies = {}; 
  Map<String, bool> _isCommentsLoading = {};
  Map<String, bool> _isRepliesLoading = {};
  
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

  void setReplyTarget(Comment? comment) {
    _activeReplyTarget = comment;
    notifyListeners();
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
      _posts = results[1] as List<Post>;
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
    _isLoading = true;
    notifyListeners();

    try {
      _posts = await _repository.getPosts(topicId: _selectedTopicId);
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
      _posts.addAll(newPosts);
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

    final post = _posts[postIndex];
    final originalLiked = post.liked;
    final originalLikeCount = post.likeCount;
    
    // Optimistic UI Update
    post.liked = !post.liked;
    post.likeCount = post.liked ? post.likeCount + 1 : post.likeCount - 1;
    notifyListeners();

    try {
      bool success;
      if (originalLiked) {
        success = await _repository.unlikePost(postId);
      } else {
        success = await _repository.likePost(postId);
      }

      if (!success) {
        post.liked = originalLiked;
        post.likeCount = originalLikeCount;
        notifyListeners();
      }
    } catch (e) {
      post.liked = originalLiked;
      post.likeCount = originalLikeCount;
      notifyListeners();
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

  Future<bool> sendComment(String postId, String content) async {
    try {
      final parentId = _activeReplyTarget?.id;
      final newComment = await _repository.createComment(
        postId, 
        content, 
        parentId: parentId
      );

      if (newComment != null) {
        if (parentId == null) {
          if (!_postComments.containsKey(postId)) _postComments[postId] = [];
          _postComments[postId]!.insert(0, newComment);
          
          final postIndex = _posts.indexWhere((p) => p.id == postId);
          if (postIndex != -1) {
            _posts[postIndex].commentCount++;
          }
        } else {
          if (!_commentReplies.containsKey(parentId)) _commentReplies[parentId] = [];
          _commentReplies[parentId]!.insert(0, newComment);
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

  Future<bool> createNewPost({required String content, required String topicId}) async {
    _isLoading = true;
    notifyListeners();
    try {
      final newPost = await _repository.createPost(content, topicId);
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
}
