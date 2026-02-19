import { Tag } from 'antd'
import { EVENT_TYPES } from '@/constants'

export default function EventTypeTag({ eventType }) {
  const config = EVENT_TYPES[eventType]
  return <Tag color={config?.color || '#999'}>{config?.label || eventType}</Tag>
}
