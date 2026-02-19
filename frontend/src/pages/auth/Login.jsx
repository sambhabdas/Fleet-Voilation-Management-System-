import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, Card, Typography, message, Space } from 'antd'
import { SafetyCertificateOutlined, UserOutlined, LockOutlined } from '@ant-design/icons'
import { useAuth } from '@/context/AuthContext'

const { Title, Text } = Typography

export default function Login() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const onFinish = async (values) => {
    setLoading(true)
    try {
      const data = await login(values.username, values.password)
      message.success('Login successful')
      navigate(data.user.role === 'DRIVER' ? '/cameras/driver' : '/dashboard')
    } catch (err) {
      message.error(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #001529 0%, #003a70 100%)',
    }}>
      <Card style={{ width: 400, borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <SafetyCertificateOutlined style={{ fontSize: 48, color: '#1677ff' }} />
          <Title level={3} style={{ marginTop: 12, marginBottom: 4 }}>Fleet Violation Monitoring</Title>
          <Text type="secondary">Sign in to access the dashboard</Text>
        </div>
        <Form layout="vertical" onFinish={onFinish} size="large">
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Please enter your username' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Username" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Sign In
            </Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Demo: admin/admin123 | manager/manager123 | driver1/driver123
          </Text>
        </div>
      </Card>
    </div>
  )
}
