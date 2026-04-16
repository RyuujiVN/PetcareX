import { Rate } from 'antd'

// Wrapper mỏng quanh Ant Rate — chuẩn hoá step 0.5, chấp nhận cả read-only / interactive.
// Dùng prop `value` (0–5), `onChange` (chỉ khi interactive), `readonly`, `size` ('sm'|'md'|'lg').

const SIZE_TO_FONT_SIZE = {
  sm: 14,
  md: 18,
  lg: 24,
}

export default function StarRating({
  value = 0,
  onChange,
  readonly = false,
  size = 'md',
  className = '',
  allowClear = false,
}) {
  const fontSize = SIZE_TO_FONT_SIZE[size] || SIZE_TO_FONT_SIZE.md

  return (
    <Rate
      allowHalf
      disabled={readonly}
      value={Number(value) || 0}
      onChange={readonly ? undefined : onChange}
      className={className}
      allowClear={allowClear}
      style={{ fontSize, color: 'var(--color-warning)' }}
    />
  )
}
