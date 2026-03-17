class Post {
  final String id;
  final String content;
  final List<String> images;
  final DateTime createdAt;
  final PostUser user;
  final Topic? topic;
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
      topic: json['topic'] != null ? Topic.fromJson(json['topic']) : null,
      likesCount: json['_count']?['likes'] ?? 0,
      commentsCount: json['_count']?['comments'] ?? 0,
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

class Topic {
  final String id;
  final String name;
  final String? description;

  Topic({required this.id, required this.name, this.description});

  factory Topic.fromJson(Map<String, dynamic> json) {
    return Topic(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'],
    );
  }
}

class Comment {
  final String id;
  final String content;
  final DateTime createdAt;
  final PostUser user;
  final List<Comment>? replies;

  Comment({
    required this.id,
    required this.content,
    required this.createdAt,
    required this.user,
    this.replies,
  });

  factory Comment.fromJson(Map<String, dynamic> json) {
    return Comment(
      id: json['id'] ?? '',
      content: json['content'] ?? '',
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      user: PostUser.fromJson(json['user'] ?? {}),
      replies: json['replies'] != null 
          ? (json['replies'] as List).map((e) => Comment.fromJson(e)).toList() 
          : null,
    );
  }
}
