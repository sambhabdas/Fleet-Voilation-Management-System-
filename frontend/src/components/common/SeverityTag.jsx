import { Tag } from 'antd'
import { SEVERITY_COLORS } from '@/constants'

export default function SeverityTag({ severity }) {
  return <Tag color={SEVERITY_COLORS[severity] || '#999'}>{severity?.toUpperCase()}</Tag>
}
