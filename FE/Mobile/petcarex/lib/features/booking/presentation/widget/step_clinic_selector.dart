import 'package:flutter/material.dart';

import '../../../../../core/theme/app_colors.dart';

class StepClinicSelector extends StatelessWidget {
  final int? selectedIndex;
  final Function(int) onSelected;
  final List<String> clinics;

  const StepClinicSelector({
    super.key,
    required this.selectedIndex,
    required this.onSelected,
    required this.clinics,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: List.generate(
        clinics.length,
        (i) => _listTile(
          i,
          clinics[i],
          "123 Đường Nguyễn Huệ, Quận 1",
          selectedIndex,
          onSelected,
          Icons.medical_services_outlined,
        ),
      ),
    );
  }

  Widget _listTile(
    int index,
    String title,
    String sub,
    int? selectedVar,
    Function(int) onSelect,
    IconData icon,
  ) {
    bool isSel = selectedVar == index;
    return GestureDetector(
      onTap: () => onSelect(index),
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
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFFE0F7F4),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: AppColors.primary),
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
                    sub,
                    style: const TextStyle(fontSize: 12, color: Colors.grey),
                  ),
                ],
              ),
            ),
            if (isSel) const Icon(Icons.check_circle, color: AppColors.primary),
          ],
        ),
      ),
    );
  }
}
