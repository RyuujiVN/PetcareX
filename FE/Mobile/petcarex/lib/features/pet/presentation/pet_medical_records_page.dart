import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../core/enums/medicine_unit_enum.dart';
import '../../../core/enums/pet_breed_enum.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/image_helper.dart';
import '../../../l10n/generated/app_localizations.dart';
import '../data/models/pet_medical_record_models.dart';
import '../data/models/pet_models.dart';
import '../data/pet_medical_record_repository.dart';

class PetMedicalRecordsPage extends StatefulWidget {
  final Pet pet;

  const PetMedicalRecordsPage({super.key, required this.pet});

  @override
  State<PetMedicalRecordsPage> createState() => _PetMedicalRecordsPageState();
}

class _PetMedicalRecordsPageState extends State<PetMedicalRecordsPage> {
  final PetMedicalRecordRepository _repository = PetMedicalRecordRepository();

  bool _isLoading = false;
  String? _errorMessage;
  List<PetMedicalRecordSummary> _records = const [];

  final Map<String, _RecordDetailState> _detailById = {};
  final Map<String, bool> _detailExpandedById = {};

  @override
  void initState() {
    super.initState();
    _fetchRecords();
  }

  Future<void> _fetchRecords() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final records = await _repository.getMedicalRecordsByPetId(widget.pet.id);
      if (!mounted) return;
      setState(() {
        _records = records;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e.toString();
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _loadDetail(String recordId) async {
    final current = _detailById[recordId];
    if (current != null && (current.isLoading || current.detail != null)) {
      return;
    }

    setState(() {
      _detailById[recordId] = const _RecordDetailState(isLoading: true);
    });

    try {
      final detail = await _repository.getMedicalRecordDetail(recordId);
      if (!mounted) return;
      setState(() {
        _detailById[recordId] = _RecordDetailState(detail: detail);
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _detailById[recordId] = _RecordDetailState(error: e.toString());
      });
    }
  }

  String _formatDate(DateTime? dateTime) {
    if (dateTime == null) return '--';
    return DateFormat('dd/MM/yyyy').format(dateTime.toLocal());
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final breedLabel =
        PetBreedEnum.fromValue(widget.pet.breed)?.getTranslatedName(context) ??
        widget.pet.breed;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.secondary,
        elevation: 0,
        centerTitle: true,
        title: Text(
          l10n.viewMedicalProfile,
          style: const TextStyle(
            color: AppColors.text,
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
      ),
      body: RefreshIndicator(
        color: AppColors.primary,
        onRefresh: _fetchRecords,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
          children: [
            _buildPetHeaderCard(
              petName: widget.pet.name,
              breedLabel: breedLabel,
              petWeight: widget.pet.weight,
              avatarUrl: widget.pet.avatar,
            ),
            const SizedBox(height: 14),
            if (_isLoading)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 40),
                child: Center(
                  child: CircularProgressIndicator(color: AppColors.primary),
                ),
              )
            else if (_errorMessage != null)
              _buildErrorState(l10n)
            else if (_records.isEmpty)
              _buildEmptyState(l10n)
            else
              ..._records.map((record) => _buildRecordCard(record, l10n)),
          ],
        ),
      ),
    );
  }

  Widget _buildPetHeaderCard({
    required String petName,
    required String breedLabel,
    required double petWeight,
    required String? avatarUrl,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.cardBackground,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.divider),
      ),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: SizedBox(
              width: 56,
              height: 56,
              child: avatarUrl != null && avatarUrl.isNotEmpty
                  ? CachedNetworkImage(
                      imageUrl: ImageHelper.getThumbnailUrl(
                        avatarUrl,
                        width: 240,
                        height: 240,
                      ),
                      fit: BoxFit.cover,
                      errorWidget: (context, url, error) => Container(
                        color: AppColors.primaryAlpha(0.12),
                        child: const Icon(
                          Icons.pets,
                          color: AppColors.primary,
                        ),
                      ),
                    )
                  : Container(
                      color: AppColors.primaryAlpha(0.12),
                      child: const Icon(
                        Icons.pets,
                        color: AppColors.primary,
                      ),
                    ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  petName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppColors.text,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '$breedLabel • ${petWeight.toStringAsFixed(1)} kg',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppColors.textGrey,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRecordCard(PetMedicalRecordSummary record, AppLocalizations l10n) {
    final detailState = _detailById[record.id] ?? const _RecordDetailState();

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppColors.cardBackground,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.divider),
      ),
      child: Theme(
        data: Theme.of(context).copyWith(dividerColor: AppColors.transparent),
        child: ExpansionTile(
          tilePadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
          childrenPadding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
          title: Text(
            record.name.isEmpty ? '--' : record.name,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: AppColors.text,
            ),
          ),
          subtitle: Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Row(
              children: [
                const Icon(
                  Icons.event_outlined,
                  size: 16,
                  color: AppColors.textGrey,
                ),
                const SizedBox(width: 6),
                Text(
                  _formatDate(record.createdAt),
                  style: const TextStyle(
                    color: AppColors.textGrey,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
          onExpansionChanged: (expanded) {
            if (expanded) {
              _loadDetail(record.id);
            }
          },
          children: [
            if (detailState.isLoading)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 16),
                child: Center(
                  child: CircularProgressIndicator(color: AppColors.primary),
                ),
              )
            else if (detailState.error != null)
              _buildDetailError(record.id, detailState.error!, l10n)
            else if (detailState.detail != null)
              _buildRecordDetail(detailState.detail!, l10n),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailError(
    String recordId,
    String error,
    AppLocalizations l10n,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '${l10n.failed}: $error',
          style: const TextStyle(color: AppColors.error),
        ),
        const SizedBox(height: 8),
        TextButton(
          onPressed: () => _loadDetail(recordId),
          child: Text(l10n.retry),
        ),
      ],
    );
  }

  Widget _buildRecordDetail(PetMedicalRecordDetail detail, AppLocalizations l10n) {
    final isDetailExpanded = _detailExpandedById[detail.id] ?? false;

    final basicRows = <Widget>[
      _buildDetailRow(
        l10n.medicalRecordClinicName,
        detail.clinicName,
      ),
      _buildDetailRow(
        l10n.medicalRecordVeterinarianName,
        detail.veterinarianName,
      ),
      _buildDetailRow(
        l10n.medicalRecordExamDate,
        _formatDate(detail.createdAt),
      ),
      _buildDetailRow(
        l10n.medicalRecordWeightAtExam,
        detail.weight.isEmpty ? '--' : '${detail.weight} kg',
      ),
    ];

    final detailRows = <Widget>[
      _buildRichDetail(l10n.medicalRecordDiagnosis, detail.diagnosis),
      _buildRichDetail(l10n.medicalRecordSymptoms, detail.symptoms),
      _buildRichDetail(l10n.medicalRecordConclusion, detail.conclusion),
      _buildRichDetail(l10n.note, detail.note),
      _buildOrdersSection(detail.medicalOrders, l10n),
      _buildMedicinesSection(detail.medicines, l10n),
    ];

    return Column(
      children: [
        ...basicRows,
        const SizedBox(height: 12),
        Theme(
          data: Theme.of(context).copyWith(dividerColor: AppColors.transparent),
          child: ExpansionTile(
            tilePadding: EdgeInsets.zero,
            childrenPadding: EdgeInsets.zero,
            initiallyExpanded: isDetailExpanded,
            onExpansionChanged: (expanded) {
              setState(() {
                _detailExpandedById[detail.id] = expanded;
              });
            },
            title: Container(
              padding: const EdgeInsets.symmetric(vertical: 10),
              decoration: BoxDecoration(
                color: AppColors.primaryAlpha(0.05),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppColors.primaryAlpha(0.2)),
              ),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Text(
                  l10n.viewDetails,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    color: AppColors.primary,
                    fontSize: 13,
                  ),
                ),
              ),
            ),
            trailing: Padding(
              padding: const EdgeInsets.only(right: 12),
              child: Icon(
                isDetailExpanded
                    ? Icons.keyboard_arrow_up
                    : Icons.keyboard_arrow_down,
                color: AppColors.primary,
              ),
            ),
            children: [
              Padding(
                padding: const EdgeInsets.only(top: 12),
                child: Column(children: detailRows),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 128,
            child: Text(
              label,
              style: const TextStyle(
                fontWeight: FontWeight.w700,
                color: AppColors.text,
                fontSize: 13,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              value.isEmpty ? '--' : value,
              style: const TextStyle(
                color: AppColors.text,
                fontSize: 13,
                height: 1.35,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRichDetail(String label, String content) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(top: 4, bottom: 8),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.border),
      ),
      child: RichText(
        text: TextSpan(
          style: const TextStyle(
            color: AppColors.text,
            fontSize: 13,
            height: 1.4,
          ),
          children: [
            TextSpan(
              text: '$label: ',
              style: const TextStyle(fontWeight: FontWeight.w700),
            ),
            TextSpan(text: content.isEmpty ? '--' : content),
          ],
        ),
      ),
    );
  }

  Widget _buildOrdersSection(
    List<MedicalOrderItem> orders,
    AppLocalizations l10n,
  ) {
    if (orders.isEmpty) {
      return _buildRichDetail(
        l10n.medicalRecordOrders,
        l10n.medicalRecordNoOrders,
      );
    }

    final content = orders
        .map((order) {
          final title = order.nameVn.isNotEmpty ? order.nameVn : order.nameEng;
          final effectiveTitle = title.isEmpty ? order.id : title;
          if (order.price == null) {
            return '• $effectiveTitle';
          }
          return '• $effectiveTitle (${order.price}đ)';
        })
        .join('\n');

    return _buildRichDetail(l10n.medicalRecordOrders, content);
  }

  Widget _buildMedicinesSection(
    List<MedicalMedicineItem> medicines,
    AppLocalizations l10n,
  ) {
    if (medicines.isEmpty) {
      return _buildRichDetail(
        l10n.medicalRecordMedicines,
        l10n.medicalRecordNoMedicines,
      );
    }

    final content = medicines
        .map((medicine) {
          final name = medicine.name.isEmpty ? medicine.id : medicine.name;
          final unitEnum = medicine.unit.isEmpty
              ? null
              : MedicineUnitEnum.fromValue(medicine.unit);
          final translatedUnit = unitEnum?.getTranslatedName(context);
          final normalizedUnit = translatedUnit ?? medicine.unit;
          final unit = normalizedUnit.isEmpty ? '' : ' ($normalizedUnit)';
          return '• $name$unit';
        })
        .join('\n');

    return _buildRichDetail(l10n.medicalRecordMedicines, content);
  }

  Widget _buildEmptyState(AppLocalizations l10n) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 28),
      decoration: BoxDecoration(
        color: AppColors.cardBackground,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.divider),
      ),
      child: Column(
        children: [
          const Icon(
            Icons.description_outlined,
            size: 42,
            color: AppColors.iconGrey,
          ),
          const SizedBox(height: 10),
          Text(
            l10n.medicalRecordEmptyTitle,
            style: const TextStyle(
              fontSize: 16,
              color: AppColors.text,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState(AppLocalizations l10n) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      decoration: BoxDecoration(
        color: AppColors.cardBackground,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.errorBorder),
      ),
      child: Column(
        children: [
          const Icon(
            Icons.error_outline,
            color: AppColors.error,
            size: 34,
          ),
          const SizedBox(height: 8),
          Text(
            _errorMessage ?? l10n.failed,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: AppColors.error,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 10),
          ElevatedButton(
            onPressed: _fetchRecords,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: AppColors.onPrimary,
            ),
            child: Text(l10n.retry),
          ),
        ],
      ),
    );
  }
}

class _RecordDetailState {
  final bool isLoading;
  final String? error;
  final PetMedicalRecordDetail? detail;

  const _RecordDetailState({
    this.isLoading = false,
    this.error,
    this.detail,
  });
}