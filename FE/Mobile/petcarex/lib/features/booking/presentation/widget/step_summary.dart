import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../../../core/theme/app_colors.dart';
import '../../../../l10n/generated/app_localizations.dart';

class StepSummary extends StatelessWidget {
  final String petName;
  final String clinicName;
  final String serviceName;
  final String doctorName;
  final String time;
  final DateTime date;

  const StepSummary({
    super.key,
    required this.petName,
    required this.clinicName,
    required this.serviceName,
    required this.doctorName,
    required this.time,
    required this.date,
  });

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final formattedDate = DateFormat(
      'EEE, d MMM',
      l10n.localeName,
    ).format(date);

    return Column(
      children: [
        Text(
          l10n.bookingSummaryInstruction,
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 32),
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: AppColors.divider),
          ),
          child: Column(
            children: [
              Text(
                l10n.bookingSummaryTitle.toUpperCase(),
                style: const TextStyle(
                  color: AppColors.textGrey,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.2,
                ),
              ),
              const SizedBox(height: 24),
              _row(Icons.pets, l10n.stepPet, petName),
              _row(Icons.local_hospital_outlined, l10n.stepClinic, clinicName),
              _row(
                Icons.medical_services_outlined,
                l10n.stepService,
                serviceName,
              ),
              _row(Icons.person_outline, l10n.stepDoctor, doctorName),
              _row(
                Icons.calendar_today_outlined,
                l10n.time,
                '$time - $formattedDate',
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _row(IconData i, String t, String v) => Padding(
    padding: const EdgeInsets.only(bottom: 20),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(i, color: AppColors.primary, size: 22),
        const SizedBox(width: 12),
        Expanded(
          flex: 4,
          child: Text(
            t,
            style: const TextStyle(color: AppColors.textGrey, fontSize: 13),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          flex: 6,
          child: Text(
            v,
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
            textAlign: TextAlign.right,
          ),
        ),
      ],
    ),
  );
}
