enum AppointmentStatusEnum {
  HEN_THANH_CONG('Hẹn thành công'),
  DANG_KHAM('Đang khám'),
  DA_KHAM_XONG('Đã khám xong'),
  DA_HUY('Đã huỷ');

  final String value;
  const AppointmentStatusEnum(this.value);
}
