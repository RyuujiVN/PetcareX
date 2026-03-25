class Post {
  final String id;
  final String content;
  final List<String> images;
  final DateTime createdAt;
  final PostUser user;
  final PostTopic? topic;
  final int likesCount;
  final int commentsCount;
  bool isLiked;

  Post({
    required this.id,
    required this.content,
    required this.images,
    required this.createdAt,
    required this.user,
    this.topic,
    this.likesCount = 0,
    this.commentsCount = 0,
    this.isLiked = false,
  });

  factory Post.fromJson(Map<String, dynamic> json) {
    return Post(
      id: json['id'] ?? '',
      content: json['content'] ?? '',
      images: json['images'] != null ? List<String>.from(json['images']) : [],
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      user: PostUser.fromJson(json['user'] ?? {}),
      topic: json['topic'] != null ? PostTopic.fromJson(json['topic']) : null,
      likesCount: json['_count']?['likes'] ?? json['likesCount'] ?? 0,
      commentsCount: json['_count']?['comments'] ?? json['commentsCount'] ?? 0,
      isLiked: json['isLiked'] ?? false,
    );
  }
}

class PostUser {
  final String id;
  final String fullName;
  final String? avatarUrl;

  PostUser({required this.id, required this.fullName, this.avatarUrl});

  factory PostUser.fromJson(Map<String, dynamic> json) {
    return PostUser(
      id: json['id'] ?? '',
      fullName: json['fullName'] ?? 'User',
      avatarUrl: json['avatarUrl'],
    );
  }
}

class PostTopic {
  final String id;
  final String name;

  PostTopic({required this.id, required this.name});

  factory PostTopic.fromJson(Map<String, dynamic> json) {
    return PostTopic(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
    );
  }
}
