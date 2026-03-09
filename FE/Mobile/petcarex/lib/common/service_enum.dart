enum ServiceEnum {
  KHAM_SUC_KHOE_DINH_KY('Khám sức khoẻ định kỳ'),
  KHAM_BENH('Khám bệnh'),
  TIEM_CHUNG('Tiêm chủng'),
  TAY_GIUN('Tẩy giun'),
  SIEU_AM_XET_NGHIEM('Siêu âm xét nghiệm'),
  PHAU_THUAT('Phẫu thuật'),
  CAP_CUU('Cấp cứu');

  final String value;
  const ServiceEnum(this.value);
}
