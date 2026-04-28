// BE trả về distance tính bằng km (elasticsearch _geo_distance, unit: 'km').
// Hiển thị:
//   < 1 km   → "850m" (không phần thập phân)
//   >= 1 km  → "2.3km" (1 chữ số thập phân)
export const formatDistance = (distanceKm) => {
  const km = Number(distanceKm)
  if (!Number.isFinite(km) || km < 0) return ''

  if (km < 1) {
    const meters = Math.round(km * 1000)
    return `${meters}m`
  }

  return `${km.toFixed(1)}km`
}
