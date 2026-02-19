import { Line } from '@ant-design/charts'

export default function ScoreTrendChart({ data }) {
  const config = {
    data: data || [],
    xField: 'month',
    yField: 'final_score',
    smooth: true,
    point: { size: 4 },
    yAxis: {
      min: 0,
      max: 100,
    },
    annotations: [
      { type: 'line', yField: 90, style: { stroke: '#52c41a', lineDash: [4, 4] } },
      { type: 'line', yField: 75, style: { stroke: '#faad14', lineDash: [4, 4] } },
      { type: 'line', yField: 60, style: { stroke: '#f5222d', lineDash: [4, 4] } },
    ],
    color: '#1677ff',
  }

  return <Line {...config} />
}
