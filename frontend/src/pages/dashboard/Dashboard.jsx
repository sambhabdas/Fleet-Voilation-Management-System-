import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Row, Col, Card, Table, Spin, Typography, Badge, Space } from 'antd'
import {
  WarningOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  AlertOutlined,
} from '@ant-design/icons'
import StatCard from '@/components/common/StatCard'
import RiskBadge from '@/components/common/RiskBadge'
import EventTypeTag from '@/components/common/EventTypeTag'
import SeverityTag from '@/components/common/SeverityTag'
import ViolationTrendChart from '@/components/charts/ViolationTrendChart'
import ViolationTypeChart from '@/components/charts/ViolationTypeChart'
import RiskDistributionChart from '@/components/charts/RiskDistributionChart'
import { dashboardService } from '@/services'
import useRealtimeUpdates from '@/hooks/useRealtimeUpdates'
import dayjs from 'dayjs'

const { Title, Text } = Typography

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const navigate = useNavigate()

  const fetchData = useCallback((showSpinner = false) => {
    if (showSpinner) setLoading(true)
    dashboardService.getData()
      .then((res) => {
        setData(res.data)
        setLastUpdated(new Date())
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Initial load
  useEffect(() => {
    fetchData(true)
  }, [fetchData])

  // Real-time updates via WebSocket
  useRealtimeUpdates(useCallback((eventType) => {
    if (eventType === 'violation:new') {
      fetchData(false)
    }
  }, [fetchData]))

  if (loading && !data) {
    return <div style={{ textAlign: 'center', paddingTop: 100 }}><Spin size="large" /></div>
  }

  if (!data) return null

  const { overview, violation_trend, violations_by_type, risk_distribution, top_violators, recent_violations } = data

  const topViolatorColumns = [
    { title: 'Driver', dataIndex: 'driver_name', key: 'name' },
    { title: 'Violations', dataIndex: 'violation_count', key: 'count', sorter: (a, b) => a.violation_count - b.violation_count },
    { title: 'Score', dataIndex: 'safety_score', key: 'score' },
    { title: 'Risk', dataIndex: 'risk_level', key: 'risk', render: (v) => <RiskBadge riskLevel={v} /> },
  ]

  const recentColumns = [
    {
      title: 'Time',
      dataIndex: 'timestamp',
      key: 'time',
      render: (v) => dayjs(v).format('MMM DD, HH:mm:ss'),
      width: 150,
    },
    { title: 'Driver', dataIndex: 'driver_name', key: 'driver' },
    { title: 'Type', dataIndex: 'event_type', key: 'type', render: (v) => <EventTypeTag eventType={v} /> },
    { title: 'Severity', dataIndex: 'severity', key: 'severity', render: (v) => <SeverityTag severity={v} /> },
    { title: 'Points', dataIndex: 'penalty_points', key: 'points', width: 70 },
  ]

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={4} style={{ margin: 0 }}>Fleet Overview</Title>
        </Col>
        <Col>
          <Space>
            {lastUpdated && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                Updated {dayjs(lastUpdated).format('HH:mm:ss')}
              </Text>
            )}
            <Badge status="success" text={<Text style={{ fontSize: 12 }}>Live</Text>} />
          </Space>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Violations This Month"
            value={overview.total_violations_this_month}
            icon={<WarningOutlined />}
            color="#fa8c16"
            trend={overview.violations_change_pct}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Active Drivers"
            value={overview.active_drivers}
            icon={<TeamOutlined />}
            color="#1677ff"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Fleet Safety Score"
            value={overview.average_fleet_score}
            icon={<SafetyCertificateOutlined />}
            color={overview.average_fleet_score >= 75 ? '#52c41a' : '#fa8c16'}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Critical Risk Drivers"
            value={overview.critical_risk_drivers}
            icon={<AlertOutlined />}
            color="#f5222d"
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card title="Violation Trend (Last 30 Days)" size="small">
            <div style={{ height: 300 }}>
              <ViolationTrendChart data={violation_trend} />
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Violations by Type" size="small">
            <div style={{ height: 300 }}>
              <ViolationTypeChart data={violations_by_type} />
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="Risk Distribution" size="small">
            <div style={{ height: 300 }}>
              <RiskDistributionChart data={risk_distribution} />
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Top Violators This Month" size="small">
            <Table
              dataSource={top_violators}
              columns={topViolatorColumns}
              rowKey="driver_id"
              pagination={false}
              size="small"
              onRow={(record) => ({
                onClick: () => navigate(`/drivers/${record.driver_id}`),
                style: { cursor: 'pointer' },
              })}
            />
          </Card>
        </Col>
      </Row>

      <Row style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="Recent Violations" size="small">
            <Table
              dataSource={recent_violations}
              columns={recentColumns}
              rowKey="id"
              pagination={false}
              size="small"
              onRow={(record) => ({
                onClick: () => navigate(`/violations/${record.id}`),
                style: { cursor: 'pointer' },
              })}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
