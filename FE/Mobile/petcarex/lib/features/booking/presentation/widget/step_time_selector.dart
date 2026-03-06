import 'package:flutter/material.dart';

import '../../../../../core/theme/app_colors.dart';

class StepTimeSelector extends StatelessWidget {
  final int selectedDateIndex;
  final Function(int) onDateSelected;
  final String? selectedTime;
  final Function(String) onTimeSelected;
  final List<DateTime> availableDates;

  const StepTimeSelector({
    super.key,
    required this.selectedDateIndex,
    required this.onDateSelected,
    required this.selectedTime,
    required this.onTimeSelected,
    required this.availableDates,
  });

  @override
  Widget build(BuildContext context) {
    final morningSlots = ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30"];
    final afternoonSlots = ["14:00", "14:30", "15:00", "15:30", "16:00", "16:30"];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              "Chọn ngày khám",
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            Row(
              children: [
                const Icon(Icons.chevron_left, size: 20),
                Text(
                  "Tháng ${availableDates[selectedDateIndex].month}, ${availableDates[selectedDateIndex].year}",
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                const Icon(Icons.chevron_right, size: 20),
              ],
            )
          ],
        ),
        const SizedBox(height: 16),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: List.generate(
              availableDates.length,
              (index) => _dateItem(index),
            ),
          ),
        ),
        const SizedBox(height: 32),
        const Row(
          children: [
            Icon(Icons.wb_sunny_outlined, color: Colors.orange, size: 20),
            SizedBox(width: 8),
            Text(
              "Buổi sáng",
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.orange),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Wrap(
          spacing: 12,
          runSpacing: 12,
          children: morningSlots.map((time) => _timeSlot(context, time)).toList(),
        ),
        const SizedBox(height: 24),
        const Row(
          children: [
            Icon(Icons.nightlight_round, color: Colors.indigo, size: 20),
            SizedBox(width: 8),
            Text(
              "Buổi chiều",
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.indigo),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Wrap(
          spacing: 12,
          runSpacing: 12,
          children: afternoonSlots.map((time) => _timeSlot(context, time)).toList(),
        ),
      ],
    );
  }

  Widget _dateItem(int index) {
    DateTime date = availableDates[index];
    bool isSel = selectedDateIndex == index;
    return GestureDetector(
      onTap: () => onDateSelected(index),
      child: Container(
        width: 65,
        margin: const EdgeInsets.only(right: 12),
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: isSel ? AppColors.primary : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSel ? AppColors.primary : Colors.grey.shade200,
          ),
          boxShadow: isSel
              ? [
                  BoxShadow(
                    color: AppColors.primary.withOpacity(0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 4),
                  )
                ]
              : null,
        ),
        child: Column(
          children: [
            Text(
              date.weekday == 7 ? "CN" : "T${date.weekday + 1}",
              style: TextStyle(
                fontSize: 12,
                color: isSel ? Colors.white70 : Colors.grey,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              "${date.day}",
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: isSel ? Colors.white : Colors.black87,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _timeSlot(BuildContext context, String time) {
    DateTime now = DateTime.now();
    DateTime selectedD = availableDates[selectedDateIndex];
    int hour = int.parse(time.split(':')[0]);
    int min = int.parse(time.split(':')[1]);

    DateTime slotDateTime = DateTime(
      selectedD.year,
      selectedD.month,
      selectedD.day,
      hour,
      min,
    );

    Duration difference = slotDateTime.difference(now);

    bool isPast = difference.inHours < 3;

    bool isSel = selectedTime == time;
    return GestureDetector(
      onTap: isPast ? () {
        ScaffoldMessenger.of(context).clearSnackBars();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Chỉ được đặt lịch cách thời điểm hiện tại ít nhất 3 tiếng'),
            duration: Duration(milliseconds: 2500), 
            behavior: SnackBarBehavior.floating, 
          ),
        );
      } : () => onTimeSelected(time),
      child: Container(
        width: (MediaQuery.of(context).size.width - 64) / 3,
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: isSel
              ? AppColors.primary
              : (isPast ? Colors.grey.shade50 : Colors.white),
          borderRadius: BorderRadius.circular(25),
          border: Border.all(
            color: isSel ? AppColors.primary : Colors.grey.shade200,
          ),
        ),
        child: Center(
          child: Text(
            time,
            style: TextStyle(
              fontWeight: FontWeight.w600,
              color: isPast
                  ? Colors.grey.shade400
                  : (isSel ? Colors.white : Colors.black87),
            ),
          ),
        ),
      ),
    );
  }
}
