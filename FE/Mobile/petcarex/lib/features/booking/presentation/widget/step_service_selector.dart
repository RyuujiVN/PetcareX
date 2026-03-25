import 'package:flutter/material.dart';

import '../../../../../core/theme/app_colors.dart';
import '../../../../core/enums/service_enum.dart';
import '../../../../l10n/generated/app_localizations.dart';

class StepServiceSelector extends StatefulWidget {
  final String? selectedServiceName;
  final Function(String) onSelected;
  final List<ServiceEnum> services;
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
  State<StepServiceSelector> createState() => _StepServiceSelectorState();
}

class _StepServiceSelectorState extends State<StepServiceSelector> {
  late final TextEditingController _symptomsController;

  @override
  void initState() {
    super.initState();
    _symptomsController = TextEditingController(text: widget.symptoms ?? '');
  }

  @override
  void didUpdateWidget(covariant StepServiceSelector oldWidget) {
    super.didUpdateWidget(oldWidget);
    final nextValue = widget.symptoms ?? '';
    if (_symptomsController.text != nextValue) {
      _symptomsController.value = TextEditingValue(
        text: nextValue,
        selection: TextSelection.collapsed(offset: nextValue.length),
      );
    }
  }

  @override
  void dispose() {
    _symptomsController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSymptomsSection(l10n),
        const SizedBox(height: 16),
        ListView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: widget.services.length,
          itemBuilder: (context, i) => _listTile(
            widget.services[i].value,
            widget.services[i].getTranslatedName(context),
            l10n.bookingServiceQualityDescription,
            widget.selectedServiceName,
            widget.onSelected,
            Icons.medical_information_outlined,
          ),
        ),
      ],
    );
  }

  Widget _buildSymptomsSection(AppLocalizations l10n) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.35)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          RichText(
            text: TextSpan(
              text: l10n.bookingPetSymptomsLabel,
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                color: AppColors.textDark,
              ),
              children: const [
                TextSpan(
                  text: '*',
                  style: TextStyle(color: AppColors.error),
                ),
              ],
            ),
          ),
          const SizedBox(height: 6),
          Text(
            l10n.bookingSymptomsRequiredHelper,
            style: const TextStyle(fontSize: 12, color: AppColors.textGrey),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _symptomsController,
            maxLines: 4,
            onChanged: widget.onSymptomsChanged,
            decoration: InputDecoration(
              hintText: l10n.bookingSymptomsHint,
              hintStyle: const TextStyle(color: AppColors.textGrey),
              filled: true,
              fillColor: AppColors.formFill,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: const BorderSide(color: AppColors.divider),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: const BorderSide(color: AppColors.divider),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: const BorderSide(color: AppColors.primary),
              ),
            ),
          ),
        ],
      ),
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
          color: AppColors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSel ? AppColors.primary : AppColors.divider,
            width: 1.5,
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.primaryLight,
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
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textGrey,
                    ),
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
