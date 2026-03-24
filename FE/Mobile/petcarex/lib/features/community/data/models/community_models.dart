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
    final userDataRaw = json['author'] ?? json['user'] ?? {};
    final topicDataRaw = json['topic'];

    final userData = userDataRaw is Map ? Map<String, dynamic>.from(userDataRaw) : <String, dynamic>{};
    final topicData = topicDataRaw is Map ? Map<String, dynamic>.from(topicDataRaw) : null;

    return Post(
      id: json['id'] ?? '',
      content: json['content'] ?? '',
      images: json['images'] != null ? List<String>.from(json['images']) : [],
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      author: PostUser.fromJson(userData),
      topic: topicData != null ? Topic.fromJson(topicData) : null,
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
    final userMap = Map<String, dynamic>.from(json);
    return PostUser(
      id: userMap['id'] ?? '',
      fullName: userMap['fullName'] ?? 'User',
      avatarUrl: userMap['avatarUrl'],
    );
  }
}

class Topic {
  final String id;
  final String name;
  final String? nameVn;
  final String? nameEng;
  final String? description;

  Topic({
    required this.id,
    required this.name,
    this.nameVn,
    this.nameEng,
    this.description,
  });

  String displayName(String languageCode) {
    if (languageCode.toLowerCase() == 'vi') {
      return (nameVn != null && nameVn!.trim().isNotEmpty) ? nameVn! : name;
    }

    if (nameEng != null && nameEng!.trim().isNotEmpty) {
      return nameEng!;
    }

    if (nameVn != null && nameVn!.trim().isNotEmpty) {
      return nameVn!;
    }

    return name;
  }

  factory Topic.fromJson(Map<String, dynamic> json) {
    final topicMap = Map<String, dynamic>.from(json);
    final parsedNameVn = (topicMap['nameVn'] as String?)?.trim();
    final parsedNameEng = (topicMap['nameEng'] as String?)?.trim();
    final parsedName =
        (topicMap['name'] as String?)?.trim() ??
        parsedNameVn ??
        parsedNameEng ??
        '';

    return Topic(
      id: topicMap['id'] ?? '',
      name: parsedName,
      nameVn: parsedNameVn,
      nameEng: parsedNameEng,
      description: topicMap['description'],
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
    final userDataRaw = json['user'] ?? json['author'] ?? {};
    final userData = userDataRaw is Map ? Map<String, dynamic>.from(userDataRaw) : <String, dynamic>{};

    return Comment(
      id: json['id'] ?? '',
      content: json['content'] ?? '',
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      author: PostUser.fromJson(userData),
      replies: json['replies'] != null
          ? (json['replies'] as List)
              .map((e) => Comment.fromJson(Map<String, dynamic>.from(e as Map)))
              .toList()
          : null,
    );
  }
}
