import '../../../../l10n/generated/app_localizations.dart';

/// Loại đối tượng bị tố cáo — phải khớp với enum BE (COMMENT | POST)
enum ReportTargetType { comment, post }

extension ReportTargetTypeX on ReportTargetType {
  String toApi() {
    switch (this) {
      case ReportTargetType.comment:
        return 'COMMENT';
      case ReportTargetType.post:
        return 'POST';
    }
  }
}

/// Danh sách lý do tố cáo được định nghĩa trên FE (BE nhận free-text)
enum ReportReason { spam, offensive, harassment, misinformation, violence, other }

extension ReportReasonX on ReportReason {
  /// Chuỗi gửi lên BE — uppercase, ổn định bất kể locale người dùng
  String apiLabel() {
    switch (this) {
      case ReportReason.spam:
        return 'SPAM';
      case ReportReason.offensive:
        return 'OFFENSIVE';
      case ReportReason.harassment:
        return 'HARASSMENT';
      case ReportReason.misinformation:
        return 'MISINFORMATION';
      case ReportReason.violence:
        return 'VIOLENCE';
      case ReportReason.other:
        return 'OTHER';
    }
  }

  /// Chuỗi hiển thị theo ngôn ngữ người dùng
  String i18nLabel(AppLocalizations l10n) {
    switch (this) {
      case ReportReason.spam:
        return l10n.reportReasonSpam;
      case ReportReason.offensive:
        return l10n.reportReasonOffensive;
      case ReportReason.harassment:
        return l10n.reportReasonHarassment;
      case ReportReason.misinformation:
        return l10n.reportReasonMisinformation;
      case ReportReason.violence:
        return l10n.reportReasonViolence;
      case ReportReason.other:
        return l10n.reportReasonOther;
    }
  }
}

/// Request body gửi lên BE để tạo báo cáo
class CreateReportRequest {
  final String targetId;
  final ReportTargetType targetType;
  final String reason;

  const CreateReportRequest({
    required this.targetId,
    required this.targetType,
    required this.reason,
  });

  Map<String, dynamic> toJson() => {
        'targetId': targetId,
        'targetType': targetType.toApi(),
        'reason': reason,
      };
}
