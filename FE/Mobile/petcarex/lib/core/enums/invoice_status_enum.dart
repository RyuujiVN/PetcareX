import 'package:flutter/material.dart';

import '../../l10n/generated/app_localizations.dart';
// bỏ qua lỗi về tên 
// ignore_for_file: constant_identifier_names
enum InvoiceStatusEnum {
  PAID('PAID'),
  UNPAID('UNPAID');

  final String value;
  const InvoiceStatusEnum(this.value);

  String getTranslatedName(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    switch (this) {
      case InvoiceStatusEnum.PAID:
        return l10n.invoiceStatusPaid;
      case InvoiceStatusEnum.UNPAID:
        return l10n.invoiceStatusUnpaid;
    }
  }

  static InvoiceStatusEnum? fromValue(String value) {
    final normalized = value.trim().toUpperCase();

    for (final status in InvoiceStatusEnum.values) {
      if (status.name.toUpperCase() == normalized ||
          status.value.toUpperCase() == normalized) {
        return status;
      }
    }

    return null;
  }
}
