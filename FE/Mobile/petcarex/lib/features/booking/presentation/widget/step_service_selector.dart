import 'package:flutter/material.dart';

import '../../../../../core/theme/app_colors.dart';

class StepServiceSelector extends StatelessWidget {
  final String? selectedServiceName;
  final Function(String) onSelected;
  final List<String> services;
  final Function(String) onSymptomsChanged;
  final String? symptoms;

  const StepServiceSelector({
    super.key,
    required this.selectedServiceName,
    required this.onSelected,
    required this.services,
    required this.onSymptomsChanged,
    this.symptoms,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: SingleChildScrollView(
            child: Column(
              children: List.generate(
                services.length,
                (i) => _listTile(
                  services[i],
                  services[i],
                  'Dịch vụ chăm sóc chất lượng cao',
                  selectedServiceName,
                  onSelected,
                  Icons.medical_information_outlined,
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 16),
        RichText(
          text: const TextSpan(
            text: 'Triệu chứng của thú cưng ',
            style: TextStyle(fontWeight: FontWeight.bold, color: Colors.black87),
            children: [
              TextSpan(text: '*', style: TextStyle(color: Colors.red)),
            ],
          ),
        ),
        const SizedBox(height: 12),
        TextField(
          maxLines: 4,
          onChanged: onSymptomsChanged,
          controller: TextEditingController(text: symptoms)..selection = TextSelection.collapsed(offset: symptoms?.length ?? 0),
          decoration: InputDecoration(
            hintText: 'Ghi rõ triệu chứng hoặc tình trạng bệnh...',
            hintStyle: TextStyle(color: Colors.grey.shade400),
            filled: true,
            fillColor: Colors.white,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide(color: Colors.grey.shade200),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide(color: Colors.grey.shade200),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: const BorderSide(color: AppColors.primary),
            ),
          ),
        ),
      ],
    );
  }

  Widget _listTile(
    String serviceName,
    String title,
    String sub,
    String? selectedVarName,
    Function(String) onSelect,
    IconData icon,
  ) {
    bool isSel = selectedVarName == serviceName;
    return GestureDetector(
      onTap: () => onSelect(serviceName),
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
