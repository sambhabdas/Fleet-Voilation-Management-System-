import { useState, useEffect } from 'react'
import { Table, Card, Select, Typography, Tag, Row, Col } from 'antd'
import { vehicleService } from '@/services'

const { Title } = Typography

export default function VehicleList() {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState(null)

  useEffect(() => {
    vehicleService.getList(statusFilter ? { status: statusFilter } : {})
      .then((res) => setVehicles(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [statusFilter])

  const columns = [
    { title: 'Plate Number', dataIndex: 'plate_number', key: 'plate', sorter: (a, b) => a.plate_number.localeCompare(b.plate_number) },
    { title: 'Model', dataIndex: 'model', key: 'model' },
    { title: 'Company', dataIndex: 'company_name', key: 'company' },
    { title: 'Driver', dataIndex: 'driver_name', key: 'driver', render: (v) => v || <Tag>Unassigned</Tag> },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (v) => {
        const colors = { active: 'green', maintenance: 'orange', retired: 'default' }
        return <Tag color={colors[v] || 'default'}>{v}</Tag>
      },
    },
  ]

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>Vehicles</Title>
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row>
          <Col>
            <Select
              placeholder="Status"
              allowClear
              style={{ width: 150 }}
              options={[
                { label: 'Active', value: 'active' },
                { label: 'Maintenance', value: 'maintenance' },
                { label: 'Retired', value: 'retired' },
              ]}
              onChange={setStatusFilter}
            />
          </Col>
        </Row>
      </Card>
      <Card>
        <Table
          dataSource={vehicles}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20, showTotal: (t) => `${t} vehicles` }}
          size="middle"
        />
      </Card>
    </div>
  )
}
