enum ServiceEnum {
  PERIODIC_HEALTH_CHECK('Khám sức khoẻ định kỳ'),
  MEDICAL_EXAMINATION('Khám bệnh'),
  VACCINATION('Tiêm chủng'),
  DEWORMING('Tẩy giun'),
  ULTRASOUND_AND_TEST('Siêu âm xét nghiệm'),
  SURGERY('Phẫu thuật'),
  EMERGENCY('Cấp cứu');

  final String value;
  const ServiceEnum(this.value);
}
