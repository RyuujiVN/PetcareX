class UserModel {
  final String id;
  final String fullName;
  final String email;
  final String role;
  final String? avatarUrl;

  UserModel({
    required this.id,
    required this.fullName,
    required this.email,
    required this.role,
    this.avatarUrl,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'],
      fullName: json['fullName'],
      email: json['email'],
      role: json['role'],
      avatarUrl: json['avatar_url'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'fullName': fullName,
      'email': email,
      'role': role,
      'avatar_url': avatarUrl,
    };
  }
}
