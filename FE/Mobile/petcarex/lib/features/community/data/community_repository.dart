import 'dart:convert';

import '../../../../core/constants/app_constants.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_helper.dart';
import 'models/community_models.dart';

class CommunityRepository {
  final ApiClient _apiClient = ApiClient();

  Future<List<Post>> getPosts({
    String? lastPostTime,
    int limit = 20,
    String? topicId,
  }) async {
    final endpoint = ApiHelper.postsEndpoint(
      limit: limit,
      lastPostTime: lastPostTime,
      topicId: topicId,
    );

    final response = await _apiClient.get(endpoint);
    if (response.statusCode == 200) {
      final List data = jsonDecode(response.body);
      return data.map((json) => Post.fromJson(json)).toList();
    }
    return [];
  }

  Future<List<Topic>> getTopics() async {
    final response = await _apiClient.get(AppConstants.END_POINT_TOPIC_GET_ALL);

    if (response.statusCode == 200) {
      final dynamic raw = jsonDecode(response.body);
      return _parseTopics(raw);
    }

    final fallbackResponse = await _apiClient.get(
      ApiHelper.topicsEndpoint(page: 1, limit: 50),
    );

    if (fallbackResponse.statusCode == 200) {
      final dynamic raw = jsonDecode(fallbackResponse.body);
      return _parseTopics(raw);
    }

    return [];
  }

  List<Topic> _parseTopics(dynamic raw) {
    if (raw is List) {
      return raw
          .whereType<Map>()
          .map((json) => Topic.fromJson(Map<String, dynamic>.from(json)))
          .toList();
    }

    if (raw is Map<String, dynamic>) {
      final items = raw['items'];
      if (items is List) {
        return items
            .whereType<Map>()
            .map((json) => Topic.fromJson(Map<String, dynamic>.from(json)))
            .toList();
      }
    }

    return [];
  }

  Future<PostReactionResult?> likePost(String postId) async {
    final response = await _apiClient.post(
      ApiHelper.postLikeEndpoint(postId),
      {},
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      final dynamic raw = jsonDecode(response.body);
      if (raw is Map<String, dynamic>) {
        return PostReactionResult.fromJson(raw);
      }
    }

    return null;
  }

  Future<PostReactionResult?> unlikePost(String postId) async {
    final response = await _apiClient.delete(
      ApiHelper.postUnlikeEndpoint(postId),
    );

    if (response.statusCode == 200) {
      final dynamic raw = jsonDecode(response.body);
      if (raw is Map<String, dynamic>) {
        return PostReactionResult.fromJson(raw);
      }
    }

    return null;
  }

  Future<bool> updatePost(String postId, String content, String topicId) async {
    final response = await _apiClient.put(
      ApiHelper.postByIdEndpoint(postId),
      {
        'content': content,
        'topicId': topicId,
      },
    );
    return response.statusCode == 200;
  }

  Future<bool> deletePost(String postId) async {
    final response = await _apiClient.delete(ApiHelper.postByIdEndpoint(postId));
    return response.statusCode == 200;
  }

  Future<Post?> createPost(String content, String topicId) async {
    final response = await _apiClient.post(AppConstants.END_POINT_POST, {
      'content': content,
      'topicId': topicId,
    });
    if (response.statusCode == 201 || response.statusCode == 200) {
      return Post.fromJson(jsonDecode(response.body));
    }
    return null;
  }

  Future<List<String>> uploadPostImages(List<String> filePaths) async {
    if (filePaths.isEmpty) return [];

    final response = await _apiClient.postMultipartFiles(
      AppConstants.END_POINT_CLOUDINARY_UPLOAD_MULTI_FILE,
      filePaths,
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      final raw = jsonDecode(response.body);
      if (raw is List) {
        return raw
            .whereType<Map>()
            .map((item) => item['file'])
            .whereType<String>()
            .where((url) => url.isNotEmpty)
            .toList();
      }
    }

    return [];
  }

  // --- Comment Methods ---

  Future<List<Comment>> getComments(
    String postId, {
    int limit = 10,
    String? lastCreatedAt,
  }) async {
    final endpoint = ApiHelper.postCommentsListEndpoint(
      postId,
      limit: limit,
      lastCreatedAt: lastCreatedAt,
    );

    final response = await _apiClient.get(endpoint);
    if (response.statusCode == 200) {
      final List data = jsonDecode(response.body);
      return data.map((json) => Comment.fromJson(json)).toList();
    }
    return [];
  }

  Future<List<Comment>> getReplies(
    String parentId, {
    int limit = 10,
    String? lastCreatedAt,
  }) async {
    final endpoint = ApiHelper.commentRepliesEndpoint(
      parentId: parentId,
      limit: limit,
      lastCreatedAt: lastCreatedAt,
    );

    final response = await _apiClient.get(endpoint);
    if (response.statusCode == 200) {
      final List data = jsonDecode(response.body);
      return data.map((json) => Comment.fromJson(json)).toList();
    }
    return [];
  }

  Future<Comment?> createComment(
    String postId,
    String content, {
    String? parentId,
  }) async {
    final response = await _apiClient.post(AppConstants.END_POINT_COMMENT, {
      'postId': postId,
      'content': content,
      'parentId': parentId,
    });
    if (response.statusCode == 201 || response.statusCode == 200) {
      return Comment.fromJson(jsonDecode(response.body));
    }
    return null;
  }

  Future<bool> updateComment(String id, String content) async {
    final response = await _apiClient.put(ApiHelper.commentByIdEndpoint(id), {
      'content': content,
    });
    return response.statusCode == 200;
  }

  Future<bool> deleteComment(String id) async {
    final response = await _apiClient.delete(ApiHelper.commentByIdEndpoint(id));
    return response.statusCode == 200;
  }
}
