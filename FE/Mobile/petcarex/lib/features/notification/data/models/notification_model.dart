class NotificationModel {
  final String id;
  final String recipientId;
  final String type;
  final bool isRead;
  final Map<String, dynamic> target;
  final DateTime createdAt;

  NotificationModel({
    required this.id,
    required this.recipientId,
    required this.type,
    required this.isRead,
    required this.target,
    required this.createdAt,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['id']?.toString() ?? '',
      recipientId: json['recipientId']?.toString() ?? '',
      type: json['type']?.toString() ?? '',
      isRead: json['isRead'] == true,
      target: json['target'] is Map<String, dynamic>
          ? json['target'] as Map<String, dynamic>
          : <String, dynamic>{},
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  NotificationModel copyWith({bool? isRead}) {
    return NotificationModel(
      id: id,
      recipientId: recipientId,
      type: type,
      isRead: isRead ?? this.isRead,
      target: target,
      createdAt: createdAt,
    );
  }

  // Helpers for target data
  String? get appointmentId => target['appointmentId']?.toString();
  String? get appointmentDate => target['appointmentDate']?.toString();
  String? get appointmentTime => target['appointmentTime']?.toString();
  String? get postId => target['postId']?.toString();
  String? get actorUserId => target['userId']?.toString();
  String? get userName => target['userName']?.toString();
  String? get avatarUrl => target['avatarUrl']?.toString();
  String? get clinicName => target['clinicName']?.toString();
  String? get petName => target['petName']?.toString();
  String? get aiDiagnosisId => target['aiDiagnosisId']?.toString();
}
