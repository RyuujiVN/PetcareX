import 'package:flutter/material.dart';

import '../../../../../core/theme/app_colors.dart';
import '../../../../core/enums/veterinary_specialty_enum.dart';
import '../../../../l10n/generated/app_localizations.dart';
import '../../data/models/booking_models.dart';

class StepDoctorSelector extends StatefulWidget {
  final String? selectedDoctorId;
  final Function(Veterinarian) onSelected;
  final List<Veterinarian> doctors;

  const StepDoctorSelector({
    super.key,
    required this.selectedDoctorId,
    required this.onSelected,
    required this.doctors,
  });

  @override
  State<StepDoctorSelector> createState() => _StepDoctorSelectorState();
}

class _StepDoctorSelectorState extends State<StepDoctorSelector> {
  String? _selectedSpecialty;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final filteredDoctors = _selectedSpecialty == null
        ? widget.doctors
        : widget.doctors
              .where((d) => d.specialty == _selectedSpecialty)
              .toList();

    return Column(
      children: [
        // Filter chips using Enum
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              _buildFilterChip(label: l10n.all, value: null),
              ...VeterinarySpecialtyEnum.values.map(
                (specialty) => _buildFilterChip(
                  label: specialty.getTranslatedName(context),
                  value: specialty.value,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        if (filteredDoctors.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 32),
            child: Text(
              l10n.bookingDoctorNotFoundBySpecialty,
              style: const TextStyle(color: AppColors.textGrey),
            ),
          )
        else
          ...List.generate(
            filteredDoctors.length,
            (i) => _listTile(
              filteredDoctors[i],
              filteredDoctors[i].user.fullName,
              filteredDoctors[i].specialty,
              widget.selectedDoctorId,
              widget.onSelected,
              Icons.person_outline,
              filteredDoctors[i].user.avatarUrl,
            ),
          ),
      ],
    );
  }

  Widget _buildFilterChip({required String label, required String? value}) {
    bool isSelected = _selectedSpecialty == value;
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedSpecialty = value;
        });
      },
      child: Container(
        margin: const EdgeInsets.only(right: 12),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? AppColors.primary : Colors.grey.shade200,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : Colors.black87,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ),
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
        child: Row(
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
            if (!isSel)
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  AppLocalizations.of(context)!.bookingInfo,
                  style: const TextStyle(
                    color: AppColors.primary,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
