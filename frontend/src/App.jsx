import { RouterProvider } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import { AuthProvider } from '@/context/AuthContext'
import { router } from '@/routes'

const theme = {
  token: {
    colorPrimary: '#1677ff',
    borderRadius: 8,
  },
}

function App() {
  return (
    <ConfigProvider theme={theme}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ConfigProvider>
  )
}

export default App
