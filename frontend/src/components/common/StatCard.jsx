import { Card, Statistic } from 'antd'
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'

export default function StatCard({ title, value, prefix, suffix, trend, trendLabel, icon, color }) {
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Statistic
          title={title}
          value={value}
          prefix={prefix}
          suffix={suffix}
          valueStyle={{ color: color || '#1677ff' }}
        />
        {icon && (
          <div style={{
            fontSize: 32,
            color: color || '#1677ff',
            opacity: 0.3,
          }}>
            {icon}
          </div>
        )}
      </div>
      {trend !== undefined && (
        <div style={{ marginTop: 8, fontSize: 12 }}>
          <span style={{ color: trend >= 0 ? '#f5222d' : '#52c41a', marginRight: 4 }}>
            {trend >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
            {Math.abs(trend)}%
          </span>
          <span style={{ color: '#999' }}>{trendLabel || 'vs last month'}</span>
        </div>
      )}
    </Card>
  )
}
