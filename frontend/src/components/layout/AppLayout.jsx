import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Avatar, Dropdown, Typography, Space, theme } from 'antd'
import {
  DashboardOutlined,
  WarningOutlined,
  TeamOutlined,
  CarOutlined,
  FileTextOutlined,
  LogoutOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  VideoCameraOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import { useAuth } from '@/context/AuthContext'
import { usePermission } from '@/hooks/usePermission'
import { ROUTES, ROLES } from '@/constants'

const { Header, Sider, Content } = Layout
const { Text } = Typography

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const { canGenerateReports } = usePermission()
  const { token: themeToken } = theme.useToken()

  const isDriver = user?.role === ROLES.DRIVER

  const menuItems = isDriver
    ? [
        {
          key: ROUTES.DRIVER_CAMERA,
          icon: <VideoCameraOutlined />,
          label: 'My Camera',
        },
      ]
    : [
        {
          key: ROUTES.DASHBOARD,
          icon: <DashboardOutlined />,
          label: 'Dashboard',
        },
        {
          key: ROUTES.VIOLATIONS,
          icon: <WarningOutlined />,
          label: 'Violations',
        },
        {
          key: ROUTES.DRIVERS,
          icon: <TeamOutlined />,
          label: 'Drivers',
        },
        {
          key: ROUTES.VEHICLES,
          icon: <CarOutlined />,
          label: 'Vehicles',
        },
        {
          key: '/cameras',
          icon: <VideoCameraOutlined />,
          label: 'Cameras',
          children: [
            { key: ROUTES.CAMERAS, label: 'Manage Cameras' },
            { key: ROUTES.DRIVER_CAMERA, label: 'Driver Camera' },
          ],
        },
        ...(canGenerateReports
          ? [
              {
                key: ROUTES.MONITORING,
                icon: <EyeOutlined />,
                label: 'Live Monitoring',
              },
              {
                key: ROUTES.REPORTS,
                icon: <FileTextOutlined />,
                label: 'Reports',
              },
            ]
          : []),
      ]

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: `${user?.full_name || user?.username} (${user?.role})`,
      disabled: true,
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
    },
  ]

  const handleMenuClick = ({ key }) => navigate(key)

  const handleUserMenuClick = ({ key }) => {
    if (key === 'logout') {
      logout()
      navigate('/login')
    }
  }

  const selectedKey = '/' + location.pathname.split('/').filter(Boolean).slice(0, 1).join('/')

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        style={{
          background: '#001529',
        }}
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          <SafetyCertificateOutlined style={{ fontSize: 24, color: '#1677ff' }} />
          {!collapsed && (
            <span style={{ color: '#fff', fontSize: 16, fontWeight: 600, marginLeft: 10 }}>
              Fleet Monitor
            </span>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header style={{
          padding: '0 24px',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        }}>
          <Text strong style={{ fontSize: 18 }}>
            Fleet Violation Monitoring System
          </Text>
          <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar style={{ backgroundColor: '#1677ff' }} icon={<UserOutlined />} />
              <Text>{user?.full_name || user?.username}</Text>
            </Space>
          </Dropdown>
        </Header>
        <Content style={{
          margin: 24,
          padding: 24,
          background: '#f5f5f5',
          minHeight: 280,
          borderRadius: 8,
        }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
