import 'package:flutter/material.dart';

import '../../../../../core/theme/app_colors.dart';

class StepIndicator extends StatelessWidget {
  final int currentStep;
  final List<String> steps;
  final bool isSuccess;
  final Function(int) onStepTapped;

  const StepIndicator({
    super.key,
    required this.currentStep,
    required this.steps,
    required this.isSuccess,
    required this.onStepTapped,
  });

  @override
  Widget build(BuildContext context) {
    if (isSuccess) return const SizedBox.shrink();

    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8).copyWith(bottom: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: List.generate(steps.length, (index) {
          final isCompleted = index < currentStep;
          final isActive = index == currentStep || (currentStep >= 5 && index == 4);

          return Expanded(
            child: GestureDetector(
              onTap: () {
                if (index < currentStep && !isSuccess) {
                  onStepTapped(index);
                }
              },
              child: Column(
                children: [
                  Container(
                    height: 4,
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    decoration: BoxDecoration(
                      color: (isActive || isCompleted)
                          ? AppColors.primary
                          : Colors.grey.shade200,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    steps[index],
                    style: TextStyle(
                      fontSize: 10,
                      color: (isActive || isCompleted)
                          ? AppColors.primary
                          : Colors.grey.shade400,
                      fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
                    ),
                  ),
                ],
              ),
            ),
          );
        }),
      ),
    );
  }
}
