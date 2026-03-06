import 'package:flutter/material.dart';

import '../../../../../core/theme/app_colors.dart';

class StepDoctorSelector extends StatelessWidget {
  final int? selectedIndex;
  final Function(int) onSelected;
  final List<String> doctors;

  const StepDoctorSelector({
    super.key,
    required this.selectedIndex,
    required this.onSelected,
    required this.doctors,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Dummy filter chips
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              _buildFilterChip("Tất cả", true),
              _buildFilterChip("Đa khoa", false),
              _buildFilterChip("Nội khoa", false),
            ],
          ),
        ),
        const SizedBox(height: 16),
        ...List.generate(
          doctors.length,
          (i) => _listTile(
            i,
            doctors[i],
            "Chuyên khoa thú y",
            selectedIndex,
            onSelected,
            Icons.person_outline,
          ),
        ),
      ],
    );
  }

  Widget _buildFilterChip(String label, bool isSelected) {
    return Container(
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
