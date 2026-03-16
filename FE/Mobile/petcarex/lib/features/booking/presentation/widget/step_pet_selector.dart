import 'dart:ui';
import 'package:flutter/material.dart';
import '../../../../l10n/generated/app_localizations.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../pet/data/models/pet_models.dart';
import '../../../pet/presentation/add_pet_page.dart';

class StepPetSelector extends StatelessWidget {
  final String? selectedPetId;
  final Function(Pet) onSelected;
  final List<Pet> pets;

  const StepPetSelector({
    super.key,
    required this.selectedPetId,
    required this.onSelected,
    required this.pets,
  });

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final sortedPets = List<Pet>.from(pets)..sort((a, b) => a.name.toLowerCase().compareTo(b.name.toLowerCase()));
    
    return GridView.builder(
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 16,
        crossAxisSpacing: 16,
        childAspectRatio: 0.85,
      ),
      itemCount: sortedPets.length + 1,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemBuilder: (context, index) {
        if (index < sortedPets.length) {
          return _petItem(sortedPets[index], l10n);
        } else {
          return _addNewItem(context, l10n);
        }
      },
    );
  }

  Widget _petItem(Pet pet, AppLocalizations l10n) {
    final isSel = selectedPetId == pet.id;
    return GestureDetector(
      onTap: () => onSelected(pet),
      child: Container(
        decoration: BoxDecoration(
          color: isSel ? AppColors.primary.withOpacity(0.08) : AppColors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSel ? AppColors.primary : AppColors.divider,
            width: 1.5,
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircleAvatar(
              radius: 35,
              backgroundImage: (pet.avatar != null && pet.avatar!.isNotEmpty)
                  ? NetworkImage(pet.avatar!) as ImageProvider
                  : const AssetImage('assets/images/cho_phoc_soc.png'),
            ),
            const SizedBox(height: 12),
            Text(pet.name, style: const TextStyle(fontWeight: FontWeight.bold)),
            Text(
              pet.breed?.name ?? l10n.user, // Dùng từ khóa thay thế cho 'Không xác định'
              style: const TextStyle(fontSize: 11, color: AppColors.grey),
            ),
          ],
        ),
      ),
    );
  }

  Widget _addNewItem(BuildContext context, AppLocalizations l10n) {
    return GestureDetector(
      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AddPetPage())),
      child: CustomPaint(
        painter: DashedBorderPainter(),
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.add, color: AppColors.grey),
              Text(l10n.addNew, style: const TextStyle(color: AppColors.grey, fontSize: 12)),
            ],
          ),
        ),
      ),
    );
  }
}

class DashedBorderPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = AppColors.divider..strokeWidth = 1.5..style = PaintingStyle.stroke;
    final path = Path()..addRRect(RRect.fromRectAndRadius(Rect.fromLTWH(0, 0, size.width, size.height), const Radius.circular(20)));
    for (PathMetric p in path.computeMetrics()) {
      double d = 0;
      while (d < p.length) {
        canvas.drawPath(p.extractPath(d, d + 8), paint);
        d += 14;
      }
    }
  }
  @override
  bool shouldRepaint(CustomPainter oldDelegate) => false;
}
