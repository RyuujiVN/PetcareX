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
      final List data = jsonDecode(response.body);
      return data.map((json) => Topic.fromJson(json)).toList();
    }
    return [];
  }

  Future<bool> likePost(String postId) async {
    final response = await _apiClient.post(
      ApiHelper.postLikeEndpoint(postId),
      {},
    );
    return response.statusCode == 200 || response.statusCode == 201;
  }

  Future<bool> unlikePost(String postId) async {
    final response = await _apiClient.delete(
      ApiHelper.postUnlikeEndpoint(postId),
    );
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
}
