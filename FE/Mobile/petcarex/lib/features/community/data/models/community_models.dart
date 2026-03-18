class Post {
  final String id;
  final String content;
  final List<String> images;
  final DateTime createdAt;
  final PostUser author; 
  final Topic? topic;
  int likeCount; 
  int commentCount; 
  bool liked; 

  Post({
    required this.id,
    required this.content,
    required this.images,
    required this.createdAt,
    required this.author,
    this.topic,
    this.likeCount = 0,
    this.commentCount = 0,
    this.liked = false,
  });

  factory Post.fromJson(Map<String, dynamic> json) {
    // Post dùng 'author' theo JSON trước đó bạn gửi
    final userData = json['author'] ?? json['user'] ?? {};
    return Post(
      id: json['id'] ?? '',
      content: json['content'] ?? '',
      images: json['images'] != null ? List<String>.from(json['images']) : [],
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      author: PostUser.fromJson(userData), 
      topic: json['topic'] != null ? Topic.fromJson(json['topic']) : null,
      likeCount: json['likeCount'] ?? 0,
      commentCount: json['commentCount'] ?? 0,
      liked: json['liked'] ?? false,
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
  final PostUser author; // Dùng chung tên field cho tiện UI
  final List<Comment>? replies;

  Comment({
    required this.id,
    required this.content,
    required this.createdAt,
    required this.author,
    this.replies,
  });

  factory Comment.fromJson(Map<String, dynamic> json) {
    // Swagger mới nhất cho thấy Comment dùng 'user'
    final userData = json['user'] ?? json['author'] ?? {};
    return Comment(
      id: json['id'] ?? '',
      content: json['content'] ?? '',
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      author: PostUser.fromJson(userData),
      replies: json['replies'] != null 
          ? (json['replies'] as List).map((e) => Comment.fromJson(e)).toList() 
          : null,
    );
  }
}
