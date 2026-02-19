import { useState } from 'react'
import { Card, Button, Radio, Table, Typography, Row, Col, Spin, Statistic, Space, Empty } from 'antd'
import { FileTextOutlined } from '@ant-design/icons'
import EventTypeTag from '@/components/common/EventTypeTag'
import SeverityTag from '@/components/common/SeverityTag'
import RiskBadge from '@/components/common/RiskBadge'
import { reportService } from '@/services'

const { Title, Text } = Typography

export default function Reports() {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [period, setPeriod] = useState('monthly')

  const generate = () => {
    setLoading(true)
    const fn = period === 'weekly' ? reportService.getWeekly : reportService.getMonthly
    fn()
      .then((res) => setReport(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  const typeColumns = [
    { title: 'Event Type', dataIndex: 'event_type', key: 'type', render: (v) => <EventTypeTag eventType={v} /> },
    { title: 'Count', dataIndex: 'count', key: 'count', sorter: (a, b) => a.count - b.count },
    { title: '%', dataIndex: 'percentage', key: 'pct', render: (v) => `${v}%` },
  ]

  const severityColumns = [
    { title: 'Severity', dataIndex: 'severity', key: 'severity', render: (v) => <SeverityTag severity={v} /> },
    { title: 'Count', dataIndex: 'count', key: 'count' },
  ]

  const driverColumns = [
    { title: 'Driver', dataIndex: 'driver_name', key: 'name' },
    { title: 'Violations', dataIndex: 'violation_count', key: 'count' },
    { title: 'Score', dataIndex: 'safety_score', key: 'score' },
    { title: 'Risk', dataIndex: 'risk_level', key: 'risk', render: (v) => <RiskBadge riskLevel={v} /> },
  ]

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>Reports</Title>

      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Radio.Group value={period} onChange={(e) => setPeriod(e.target.value)}>
            <Radio.Button value="weekly">Weekly</Radio.Button>
            <Radio.Button value="monthly">Monthly</Radio.Button>
          </Radio.Group>
          <Button type="primary" icon={<FileTextOutlined />} onClick={generate} loading={loading}>
            Generate Report
          </Button>
          {report && (
            <Button onClick={() => window.print()}>Print Report</Button>
          )}
        </Space>
      </Card>

      {loading && <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" /></div>}

      {!loading && !report && (
        <Card><Empty description="Select a period and click Generate Report" /></Card>
      )}

      {report && !loading && (
        <>
          <Card style={{ marginBottom: 16 }}>
            <Title level={5}>
              {report.period === 'weekly' ? 'Weekly' : 'Monthly'} Report: {report.date_from} to {report.date_to}
            </Title>
            <Row gutter={[24, 16]} style={{ marginTop: 16 }}>
              <Col xs={24} sm={8}>
                <Statistic title="Total Violations" value={report.total_violations} valueStyle={{ color: '#fa8c16' }} />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic title="Average Safety Score" value={report.average_score} valueStyle={{ color: report.average_score >= 75 ? '#52c41a' : '#f5222d' }} />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic title="Report Period" value={report.period.toUpperCase()} />
              </Col>
            </Row>
          </Card>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="Violations by Type" size="small">
                <Table dataSource={report.violations_by_type} columns={typeColumns} rowKey="event_type" pagination={false} size="small" />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="Violations by Severity" size="small">
                <Table dataSource={report.violations_by_severity} columns={severityColumns} rowKey="severity" pagination={false} size="small" />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} lg={12}>
              <Card title="Highest Risk Drivers" size="small">
                <Table dataSource={report.worst_drivers} columns={driverColumns} rowKey="driver_id" pagination={false} size="small" />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="Safest Drivers" size="small">
                <Table dataSource={report.best_drivers} columns={driverColumns} rowKey="driver_id" pagination={false} size="small" />
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  )
}
