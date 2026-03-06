import 'dart:ui';

import 'package:flutter/material.dart';

import '../../../../../core/theme/app_colors.dart';
import '../../../pet/presentation/add_pet_page.dart';

class StepPetSelector extends StatelessWidget {
  final int? selectedIndex;
  final Function(int) onSelected;
  final List<String> petNames;

  const StepPetSelector({
    super.key,
    required this.selectedIndex,
    required this.onSelected,
    required this.petNames,
  });

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 16,
      crossAxisSpacing: 16,
      childAspectRatio: 0.85,
      children: [
        _petItem(0, petNames.isNotEmpty ? petNames[0] : 'Lu Lu', 'assets/images/cho_phoc_soc.png', 'Chó Phốc Sóc'),
        _petItem(1, petNames.length > 1 ? petNames[1] : 'Mimi', 'assets/images/meo_anh_long_ngan.png', 'Mèo Anh lông ngắn'),
        _addNewItem(context),
      ],
    );
  }

  Widget _petItem(int index, String name, String img, String breed) {
    final isSel = selectedIndex == index;
    return GestureDetector(
      onTap: () => onSelected(index),
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
            CircleAvatar(radius: 35, backgroundImage: AssetImage(img)),
            const SizedBox(height: 12),
            Text(name, style: const TextStyle(fontWeight: FontWeight.bold)),
            Text(
              breed,
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
