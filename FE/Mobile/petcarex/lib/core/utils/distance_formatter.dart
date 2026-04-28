// Format khoảng cách từ km (đơn vị BE trả về qua `_geo_distance` của Elasticsearch).
// < 1km → "Xm" (làm tròn về int).
// >= 1km → "X.Xkm" (1 chữ số thập phân).
// null hoặc < 0 → chuỗi rỗng (caller tự ẩn UI).
String formatDistance(num? distanceKm) {
  if (distanceKm == null) return '';
  final km = distanceKm.toDouble();
  if (km.isNaN || km < 0) return '';

  if (km < 1) {
    final meters = (km * 1000).round();
    return '${meters}m';
  }

  return '${km.toStringAsFixed(1)}km';
}
