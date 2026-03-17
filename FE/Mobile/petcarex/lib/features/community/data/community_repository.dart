import 'dart:convert';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/network/api_client.dart';
import 'models/community_models.dart';

class CommunityRepository {
  final ApiClient _apiClient = ApiClient();

  Future<List<Post>> getPosts({String? lastPostTime, int limit = 20, String? topicId}) async {
    String url = '${AppConstants.postEndpoint}?limit=$limit';
    if (lastPostTime != null) url += '&lastPostTime=$lastPostTime';
    if (topicId != null) url += '&topicId=$topicId';

    final response = await _apiClient.get(url);
    if (response.statusCode == 200) {
      final List data = jsonDecode(response.body);
      return data.map((json) => Post.fromJson(json)).toList();
    }
    return [];
  }

  Future<List<Topic>> getTopics() async {
    final response = await _apiClient.get(AppConstants.topicGetAllEndpoint);
    if (response.statusCode == 200) {
      final List data = jsonDecode(response.body);
      return data.map((json) => Topic.fromJson(json)).toList();
    }
    return [];
  }

  Future<bool> likePost(String postId) async {
    final response = await _apiClient.post(AppConstants.postLikeEndpoint(postId), {});
    return response.statusCode == 200 || response.statusCode == 201;
  }

  Future<bool> unlikePost(String postId) async {
    final response = await _apiClient.delete(AppConstants.postUnlikeEndpoint(postId));
    return response.statusCode == 200;
  }

  Future<Post?> createPost(String content, String topicId) async {
    final response = await _apiClient.post(AppConstants.postEndpoint, {
      'content': content,
      'topicId': topicId,
    });
    if (response.statusCode == 201 || response.statusCode == 200) {
      return Post.fromJson(jsonDecode(response.body));
    }
    return null;
  }
}
