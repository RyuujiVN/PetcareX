import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/app_notifier.dart';
import '../../../../l10n/generated/app_localizations.dart';
import '../../data/models/report_models.dart';
import '../../data/repositories/report_repository.dart';

/// Bottom sheet cho phép user chọn lý do tố cáo và submit
class ReportReasonSheet extends StatefulWidget {
  final String targetId;
  final ReportTargetType targetType;
  final VoidCallback? onReported;

  const ReportReasonSheet({
    super.key,
    required this.targetId,
    required this.targetType,
    this.onReported,
  });

  @override
  State<ReportReasonSheet> createState() => _ReportReasonSheetState();
}

class _ReportReasonSheetState extends State<ReportReasonSheet> {
  final _repository = ReportRepository();
  final _otherController = TextEditingController();

  ReportReason? _selectedReason;
  bool _isSubmitting = false;

  @override
  void dispose() {
    _otherController.dispose();
    super.dispose();
  }

  bool get _canSubmit {
    if (_selectedReason == null) return false;
    if (_selectedReason == ReportReason.other) {
      return _otherController.text.trim().isNotEmpty;
    }
    return true;
  }

  String _buildReasonString() {
    if (_selectedReason == ReportReason.other) {
      final text = _otherController.text.trim();
      return 'OTHER: $text';
    }
    return _selectedReason!.apiLabel();
  }

  Future<void> _submit() async {
    if (!_canSubmit || _isSubmitting) return;

    setState(() => _isSubmitting = true);

    final l10n = AppLocalizations.of(context)!;
    final req = CreateReportRequest(
      targetId: widget.targetId,
      targetType: widget.targetType,
      reason: _buildReasonString(),
    );

    try {
      await _repository.createReport(req);

      widget.onReported?.call();

      if (mounted) Navigator.of(context).pop();
      if (mounted) AppNotifier.showSuccess(context, l10n.reportSuccess);
    } catch (_) {
      if (mounted) {
        setState(() => _isSubmitting = false);
        AppNotifier.showError(context, l10n.reportFailed);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom + 16,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Handle bar
          Center(
            child: Container(
              margin: const EdgeInsets.only(top: 12, bottom: 8),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.divider,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          // Tiêu đề
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Text(
              widget.targetType == ReportTargetType.comment
                  ? l10n.reportCommentTitle
                  : l10n.reportPostTitle,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: AppColors.textDark,
              ),
            ),
          ),
          const Divider(height: 1),
          // Danh sách lý do
          ...ReportReason.values.map((reason) => RadioListTile<ReportReason>(
                value: reason,
                groupValue: _selectedReason,
                title: Text(
                  reason.i18nLabel(l10n),
                  style: const TextStyle(fontSize: 14),
                ),
                dense: true,
                activeColor: AppColors.primary,
                onChanged: (val) => setState(() => _selectedReason = val),
              )),
          // TextField hiện khi chọn "Khác"
          if (_selectedReason == ReportReason.other)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: TextField(
                controller: _otherController,
                maxLines: 3,
                maxLength: 500,
                decoration: InputDecoration(
                  hintText: l10n.reportDescriptionHint,
                  border: const OutlineInputBorder(),
                  contentPadding: const EdgeInsets.all(12),
                ),
                onChanged: (_) => setState(() {}),
              ),
            ),
          // Nút submit
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: ElevatedButton(
              onPressed: _canSubmit && !_isSubmitting ? _submit : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: _isSubmitting
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : Text(l10n.reportSubmit),
            ),
          ),
        ],
      ),
    );
  }
}
