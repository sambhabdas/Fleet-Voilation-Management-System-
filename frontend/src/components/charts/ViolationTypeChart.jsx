import { Pie } from '@ant-design/charts'
import { EVENT_TYPES } from '@/constants'

export default function ViolationTypeChart({ data }) {
  const config = {
    data: data || [],
    angleField: 'count',
    colorField: 'event_type',
    radius: 0.8,
    innerRadius: 0.6,
    label: {
      text: 'event_type',
      position: 'outside',
      formatter: (datum) => EVENT_TYPES[datum.event_type]?.label || datum.event_type,
    },
    legend: {
      position: 'bottom',
      itemName: {
        formatter: (text) => EVENT_TYPES[text]?.label || text,
      },
    },
    color: (datum) => EVENT_TYPES[datum.event_type]?.color || '#999',
    tooltip: {
      title: (datum) => EVENT_TYPES[datum.event_type]?.label || datum.event_type,
    },
  }

  return <Pie {...config} />
}
