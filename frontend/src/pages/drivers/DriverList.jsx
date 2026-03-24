import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Table, Card, Select, Typography, Input, Tag, Row, Col, Badge, Space, Switch,
  Button, Modal, Form, message,
} from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import RiskBadge from '@/components/common/RiskBadge'
import { driverService, vehicleService } from '@/services'
import { usePermission } from '@/hooks/usePermission'
import { RISK_LEVELS } from '@/constants'
import useRealtimeUpdates from '@/hooks/useRealtimeUpdates'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { Search } = Input

export default function DriverList() {
  const [drivers, setDrivers] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const navigate = useNavigate()

  const { canEditDrivers } = usePermission()
  const [registerVisible, setRegisterVisible] = useState(false)
  const [registerLoading, setRegisterLoading] = useState(false)
  const [vehicleOptions, setVehicleOptions] = useState([])
  const [form] = Form.useForm()

  const fetchData = useCallback((showSpinner = false) => {
    if (showSpinner) setLoading(true)
    driverService.getList()
      .then((res) => {
        setDrivers(res.data)
        setLastUpdated(new Date())
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchData(true) }, [fetchData])

  // Real-time updates via WebSocket
  useRealtimeUpdates(useCallback((eventType) => {
    if (eventType === 'violation:new') {
      fetchData(false)
    }
  }, [fetchData]))

  useEffect(() => {
    if (canEditDrivers) {
      vehicleService.getList().then((res) => {
        setVehicleOptions(res.data.map((v) => ({
          label: `${v.plate_number} - ${v.model}`,
          value: v.id,
        })))
      }).catch(console.error)
    }
  }, [canEditDrivers])

  useEffect(() => {
    let result = drivers
    if (search) {
      result = result.filter((d) =>
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.employee_id.toLowerCase().includes(search.toLowerCase())
      )
    }
    if (riskFilter) {
      result = result.filter((d) => d.risk_level === riskFilter)
    }
    setFiltered(result)
  }, [search, riskFilter, drivers])

  const handleRegisterDriver = async (values) => {
    setRegisterLoading(true)
    try {
      await driverService.create(values)
      message.success('Driver registered successfully')
      setRegisterVisible(false)
      form.resetFields()
      fetchData(true)
    } catch (err) {
      const detail = err.response?.data?.detail || 'Failed to register driver'
      message.error(detail)
    } finally {
      setRegisterLoading(false)
    }
  }

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
    { title: 'Employee ID', dataIndex: 'employee_id', key: 'eid', width: 120 },
    { title: 'Vehicle', dataIndex: 'vehicle_plate', key: 'vehicle', width: 140, render: (v) => v || '-' },
    {
      title: 'Safety Score',
      dataIndex: 'latest_score',
      key: 'score',
      width: 120,
      sorter: (a, b) => (a.latest_score || 0) - (b.latest_score || 0),
      render: (v) => {
        if (v === null || v === undefined) return '-'
        let color = '#52c41a'
        if (v < 60) color = '#f5222d'
        else if (v < 75) color = '#fa8c16'
        else if (v < 90) color = '#faad14'
        return <span style={{ color, fontWeight: 600 }}>{v}</span>
      },
    },
    {
      title: 'Risk Level',
      dataIndex: 'risk_level',
      key: 'risk',
      width: 110,
      render: (v) => v ? <RiskBadge riskLevel={v} /> : '-',
    },
    {
      title: 'Violations',
      dataIndex: 'violation_count',
      key: 'violations',
      width: 100,
      sorter: (a, b) => a.violation_count - b.violation_count,
    },
    {
      title: 'Status',
      dataIndex: 'active',
      key: 'status',
      width: 90,
      render: (v) => <Tag color={v ? 'green' : 'default'}>{v ? 'Active' : 'Inactive'}</Tag>,
    },
  ]

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={4} style={{ margin: 0 }}>Drivers</Title>
        </Col>
        <Col>
          <Space>
            {canEditDrivers && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setRegisterVisible(true)}
              >
                Register Driver
              </Button>
            )}
            {lastUpdated && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                Updated {dayjs(lastUpdated).format('HH:mm:ss')}
              </Text>
            )}
            <Badge status="success" text={<Text style={{ fontSize: 12 }}>Live</Text>} />
          </Space>
        </Col>
      </Row>
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]}>
          <Col>
            <Search
              placeholder="Search by name or ID"
              allowClear
              style={{ width: 250 }}
              onSearch={setSearch}
              onChange={(e) => !e.target.value && setSearch('')}
            />
          </Col>
          <Col>
            <Select
              placeholder="Risk Level"
              allowClear
              style={{ width: 150 }}
              options={Object.keys(RISK_LEVELS).map((k) => ({ label: k, value: k }))}
              onChange={setRiskFilter}
            />
          </Col>
        </Row>
      </Card>
      <Card>
        <Table
          dataSource={filtered}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20, showTotal: (t) => `${t} drivers` }}
          onRow={(record) => ({
            onClick: () => navigate(`/drivers/${record.id}`),
            style: { cursor: 'pointer' },
          })}
          size="middle"
        />
      </Card>

      <Modal
        title="Register New Driver"
        open={registerVisible}
        onCancel={() => { setRegisterVisible(false); form.resetFields() }}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleRegisterDriver}
          initialValues={{ active: true }}
        >
          <Form.Item
            name="name"
            label="Full Name"
            rules={[{ required: true, message: 'Please enter driver name' }]}
          >
            <Input placeholder="e.g. Ahmed Al-Mansouri" />
          </Form.Item>
          <Form.Item
            name="employee_id"
            label="Employee ID"
            rules={[{ required: true, message: 'Please enter employee ID' }]}
          >
            <Input placeholder="e.g. EMP-001" />
          </Form.Item>
          <Form.Item name="vehicle_id" label="Assigned Vehicle">
            <Select
              placeholder="Select vehicle (optional)"
              allowClear
              showSearch
              filterOption={(input, opt) => opt.label.toLowerCase().includes(input.toLowerCase())}
              options={vehicleOptions}
            />
          </Form.Item>
          <Form.Item name="country" label="Country">
            <Input placeholder="e.g. UAE" />
          </Form.Item>
          <Card size="small" title="Driver Login Account (Optional)" style={{ marginBottom: 16 }}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 12 }}>
              Create a login account so this driver can access the camera page directly.
            </Text>
            <Form.Item name="username" label="Username">
              <Input placeholder="e.g. driver1" />
            </Form.Item>
            <Form.Item name="password" label="Password">
              <Input.Password placeholder="e.g. driver123" />
            </Form.Item>
          </Card>
          <Form.Item name="active" label="Active" valuePropName="checked">
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={registerLoading}>
                Register
              </Button>
              <Button onClick={() => { setRegisterVisible(false); form.resetFields() }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
