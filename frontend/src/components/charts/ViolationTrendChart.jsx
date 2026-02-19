import { Line } from '@ant-design/charts'

export default function ViolationTrendChart({ data }) {
  const config = {
    data: data || [],
    xField: 'date',
    yField: 'count',
    smooth: true,
    point: { size: 3 },
    area: {
      style: {
        fillOpacity: 0.15,
      },
    },
    xAxis: {
      label: {
        formatter: (v) => v.slice(5),
      },
    },
    color: '#1677ff',
  }

  return <Line {...config} />
}
