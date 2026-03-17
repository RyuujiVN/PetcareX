import 'package:flutter/material.dart';
import '../../data/community_repository.dart';
import '../../data/models/community_models.dart';

class CommunityProvider with ChangeNotifier {
  final CommunityRepository _repository = CommunityRepository();

  List<Post> _posts = [];
  List<Topic> _topics = [];
  Map<String, List<Comment>> _postComments = {};
  Map<String, bool> _isCommentsLoading = {};
  
  bool _isLoading = false;
  bool _isMoreLoading = false;
  String? _errorMessage;
  String? _selectedTopicId;

  List<Post> get posts => _posts;
  List<Topic> get topics => _topics;
  bool get isLoading => _isLoading;
  bool get isMoreLoading => _isMoreLoading;
  String? get errorMessage => _errorMessage;
  String? get selectedTopicId => _selectedTopicId;

  List<Comment> getCommentsForPost(String postId) => _postComments[postId] ?? [];
  bool isCommentsLoading(String postId) => _isCommentsLoading[postId] ?? false;

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
    final originalIsLiked = post.isLiked;
    
    post.isLiked = !post.isLiked;
    notifyListeners();

    try {
      bool success;
      if (originalIsLiked) {
        success = await _repository.unlikePost(postId);
      } else {
        success = await _repository.likePost(postId);
      }

      if (!success) {
        post.isLiked = originalIsLiked;
        notifyListeners();
      }
    } catch (e) {
      post.isLiked = originalIsLiked;
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

  Future<bool> sendComment(String postId, String content) async {
    try {
      final newComment = await _repository.createComment(postId, content);
      if (newComment != null) {
        if (!_postComments.containsKey(postId)) {
          _postComments[postId] = [];
        }
        _postComments[postId]!.insert(0, newComment);
        notifyListeners();
        return true;
      }
    } catch (e) {
      _errorMessage = e.toString();
    }
    return false;
  }

  Future<bool> createNewPost(String content) async {
    if (_selectedTopicId == null && _topics.isNotEmpty) {
      _selectedTopicId = _topics.first.id;
    }
    if (_selectedTopicId == null) return false;

    try {
      final newPost = await _repository.createPost(content, _selectedTopicId!);
      if (newPost != null) {
        _posts.insert(0, newPost);
        notifyListeners();
        return true;
      }
    } catch (e) {
      _errorMessage = e.toString();
    }
    return false;
  }
}
