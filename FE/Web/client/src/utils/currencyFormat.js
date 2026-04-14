export const formatVND = (amount) => {
  const n = Number(amount) || 0
  return `${n.toLocaleString('vi-VN')} đ`
}
