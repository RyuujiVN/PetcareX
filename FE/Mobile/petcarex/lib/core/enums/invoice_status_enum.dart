enum InvoiceStatusEnum {
  PAID('Đã thanh toán'),
  UNPAID('Chưa thanh toán');

  final String value;
  const InvoiceStatusEnum(this.value);
}
