import { Column } from '@ant-design/charts'
import { RISK_LEVELS } from '@/constants'

export default function RiskDistributionChart({ data }) {
  const config = {
    data: data || [],
    xField: 'risk_level',
    yField: 'count',
    color: (datum) => RISK_LEVELS[datum.risk_level]?.color || '#999',
    label: {
      text: 'count',
      position: 'inside',
    },
    xAxis: {
      label: {
        autoRotate: false,
      },
    },
  }

  return <Column {...config} />
}
