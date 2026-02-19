import { Tag } from 'antd'
import { RISK_LEVELS } from '@/constants'

export default function RiskBadge({ riskLevel }) {
  const config = RISK_LEVELS[riskLevel] || RISK_LEVELS.Low
  return <Tag color={config.color}>{riskLevel}</Tag>
}
