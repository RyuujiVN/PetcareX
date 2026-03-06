import 'package:flutter/material.dart';

import '../../../../../core/theme/app_colors.dart';

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
    return Column(
      children: [
        const Text(
          "Vui lòng kiểm tra lại thông tin trước khi xác nhận đặt lịch",
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 32),
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: const Color(0xFFF4F7F8),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: Colors.grey.shade200),
          ),
          child: Column(
            children: [
              const Text(
                "TÓM TẮT LỊCH HẸN",
                style: TextStyle(
                  color: Colors.grey,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.2,
                ),
              ),
              const SizedBox(height: 24),
              _row(Icons.pets, "Thú cưng", petName),
              _row(Icons.local_hospital_outlined, "Phòng khám", clinicName),
              _row(Icons.medical_services_outlined, "Dịch vụ", serviceName),
              _row(Icons.person_outline, "Bác sĩ", doctorName),
              _row(
                Icons.calendar_today_outlined,
                "Thời gian",
                "$time - Thứ ${date.weekday == 7 ? "CN" : date.weekday + 1}, ${date.day} Tháng ${date.month}",
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
      children: [
        Icon(i, color: AppColors.primary, size: 22),
        const SizedBox(width: 12),
        Text(t, style: const TextStyle(color: Colors.black54, fontSize: 13)),
        const Spacer(),
        Text(v, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
      ],
    ),
  );
}
