import 'package:flutter/material.dart';

import '../../../../../core/theme/app_colors.dart';
import '../../../../core/enums/veterinary_specialty_enum.dart';
import '../../../../l10n/generated/app_localizations.dart';
import '../../data/models/booking_models.dart';

class StepDoctorSelector extends StatefulWidget {
  final String? selectedDoctorId;
  final Veterinarian? selectedDoctor;
  final VetUser? selectedDoctorAccount;
  final bool isDoctorAccountLoading;
  final Function(Veterinarian) onSelected;
  final List<Veterinarian> doctors;

  const StepDoctorSelector({
    super.key,
    required this.selectedDoctorId,
    required this.selectedDoctor,
    required this.selectedDoctorAccount,
    required this.isDoctorAccountLoading,
    required this.onSelected,
    required this.doctors,
  });

  @override
  State<StepDoctorSelector> createState() => _StepDoctorSelectorState();
}

class _StepDoctorSelectorState extends State<StepDoctorSelector> {
  String _nonEmptyOrDash(String? value) {
    if (value == null || value.trim().isEmpty) {
      return '--';
    }
    return value;
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Column(
      children: [
        if (widget.doctors.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 32),
            child: Text(
              l10n.bookingDoctorNotFoundBySpecialty,
              style: const TextStyle(color: AppColors.textGrey),
            ),
          )
        else
          ...List.generate(
            widget.doctors.length,
            (i) => _listTile(
              widget.doctors[i],
              widget.doctors[i].user.fullName,
              widget.doctors[i].specialty,
              widget.selectedDoctorId,
              widget.onSelected,
              Icons.person_outline,
              widget.doctors[i].user.avatarUrl,
            ),
          ),
      ],
    );
  }

  Widget _buildSelectedDoctorInfo(Veterinarian doctor, AppLocalizations l10n) {
    final account = widget.selectedDoctorAccount ?? doctor.user;

    final translatedSpecialty =
        VeterinarySpecialtyEnum.fromValue(
          doctor.specialty,
        )?.getTranslatedName(context) ??
        doctor.specialty;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.divider),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(
                Icons.info_outline,
                color: AppColors.primary,
                size: 20,
              ),
              const SizedBox(width: 8),
              Text(
                l10n.doctorInfo,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  color: AppColors.textDark,
                ),
              ),
              const Spacer(),
              if (widget.isDoctorAccountLoading)
                const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: AppColors.primary,
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),
          _detailRow(l10n.doctor, _nonEmptyOrDash(account.fullName)),
          const SizedBox(height: 6),
          _detailRow(l10n.specialty, _nonEmptyOrDash(translatedSpecialty)),
          const SizedBox(height: 6),
          _detailRow(l10n.email, _nonEmptyOrDash(account.email)),
          const SizedBox(height: 6),
          _detailRow(l10n.phone, _nonEmptyOrDash(account.phone)),
          const SizedBox(height: 6),
          _detailRow(l10n.address, _nonEmptyOrDash(account.address)),
        ],
      ),
    );
  }

  Widget _detailRow(String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 80,
          child: Text(
            '$label:',
            style: const TextStyle(color: AppColors.textGrey, fontSize: 12),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(
              color: AppColors.textDark,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    );
  }

  Widget _listTile(
    Veterinarian doctor,
    String title,
    String sub,
    String? selectedVarId,
    Function(Veterinarian) onSelect,
    IconData icon,
    String? avatarUrl,
  ) {
    bool isSel = selectedVarId == doctor.userId;
    return GestureDetector(
      onTap: () => onSelect(doctor),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSel ? AppColors.primary : Colors.grey.shade200,
            width: 1.5,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(2),
                  decoration: BoxDecoration(
                    color: const Color(0xFFE0F7F4),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: avatarUrl != null && avatarUrl.isNotEmpty
                      ? ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: Image.network(
                            avatarUrl,
                            width: 40,
                            height: 40,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) =>
                                Icon(icon, color: AppColors.primary, size: 30),
                          ),
                        )
                      : Icon(icon, color: AppColors.primary, size: 30),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      Text(
                        VeterinarySpecialtyEnum.fromValue(
                              sub,
                            )?.getTranslatedName(context) ??
                            sub,
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textGrey,
                        ),
                      ),
                    ],
                  ),
                ),
                if (isSel) const Icon(Icons.check_circle, color: AppColors.primary),
              ],
            ),
            if (isSel) ...[
              const SizedBox(height: 12),
              _buildSelectedDoctorInfo(doctor, AppLocalizations.of(context)!),
            ],
          ],
        ),
      ),
    );
  }
}
