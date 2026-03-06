import 'dart:ui';

import 'package:flutter/material.dart';

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
    return GridView.builder(
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 16,
        crossAxisSpacing: 16,
        childAspectRatio: 0.85,
      ),
      itemCount: pets.length + 1,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemBuilder: (context, index) {
        if (index < pets.length) {
          final pet = pets[index];
          return _petItem(pet);
        } else {
          return _addNewItem(context);
        }
      },
    );
  }

  Widget _petItem(Pet pet) {
    final isSel = selectedPetId == pet.id;
    return GestureDetector(
      onTap: () => onSelected(pet),
      child: Container(
        decoration: BoxDecoration(
          color: isSel ? AppColors.primary.withOpacity(0.08) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSel ? AppColors.primary : Colors.grey.shade200,
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
              pet.breed?.name ?? 'Không xác định',
              style: const TextStyle(fontSize: 11, color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }

  Widget _addNewItem(BuildContext context) {
    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const AddPetPage()),
      ),
      child: CustomPaint(
        painter: DashedBorderPainter(),
        child: const Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.add, color: Colors.grey),
              Text(
                'Thêm mới',
                style: TextStyle(color: Colors.grey, fontSize: 12),
              ),
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
    final paint = Paint()
      ..color = Colors.grey.shade300
      ..strokeWidth = 1.5
      ..style = PaintingStyle.stroke;
    final path = Path()
      ..addRRect(
        RRect.fromRectAndRadius(
          Rect.fromLTWH(0, 0, size.width, size.height),
          const Radius.circular(20),
        ),
      );
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
