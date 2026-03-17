enum AppointmentStatusEnum {
  BOOKED('Hẹn thành công'),
  IN_PROGRESS('Đang khám'),
  COMPLETED('Đã khám xong'),
  CANCELLED('Đã huỷ');

  final String value;
  const AppointmentStatusEnum(this.value);
}