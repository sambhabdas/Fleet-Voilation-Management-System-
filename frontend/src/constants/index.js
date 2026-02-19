export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  VIOLATIONS: '/violations',
  VIOLATION_DETAIL: '/violations/:id',
  DRIVERS: '/drivers',
  DRIVER_DETAIL: '/drivers/:id',
  VEHICLES: '/vehicles',
  CAMERAS: '/cameras',
  DRIVER_CAMERA: '/cameras/driver',
  MONITORING: '/monitoring',
  REPORTS: '/reports',
}

export const ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  VIEWER: 'VIEWER',
  DRIVER: 'DRIVER',
}

export const EVENT_TYPES = {
  phone_usage: { label: 'Phone Usage', color: '#fa8c16', penalty: 15 },
  drowsiness: { label: 'Drowsiness', color: '#f5222d', penalty: 20 },
  harsh_braking: { label: 'Harsh Braking', color: '#faad14', penalty: 5 },
  overspeed: { label: 'Overspeed', color: '#1890ff', penalty: 7 },
  no_seatbelt: { label: 'No Seatbelt', color: '#722ed1', penalty: 10 },
  yawning: { label: 'Yawning', color: '#13c2c2', penalty: 5 },
  sudden_acceleration: { label: 'Sudden Acceleration', color: '#eb2f96', penalty: 5 },
  distracted: { label: 'Distracted / Not Looking', color: '#595959', penalty: 15 },
}

export const RISK_LEVELS = {
  Low: { color: '#52c41a', min: 90 },
  Moderate: { color: '#faad14', min: 75 },
  High: { color: '#fa8c16', min: 60 },
  Critical: { color: '#f5222d', min: 0 },
}

export const SEVERITY_COLORS = {
  low: '#52c41a',
  medium: '#faad14',
  high: '#fa8c16',
  critical: '#f5222d',
}

export const CAMERA_TYPES = {
  dashcam: { label: 'Dashcam', color: '#1890ff' },
  cabin: { label: 'Cabin Camera', color: '#722ed1' },
  external: { label: 'External', color: '#13c2c2' },
  webcam: { label: 'Webcam', color: '#52c41a' },
}

export const CAMERA_STATUSES = {
  online: { label: 'Online', color: 'green' },
  offline: { label: 'Offline', color: 'default' },
  error: { label: 'Error', color: 'red' },
}

export const REVIEW_STATUSES = {
  pending: { label: 'Pending Review', color: 'blue' },
  under_review: { label: 'Under Review', color: 'orange' },
  confirmed: { label: 'Confirmed', color: 'red' },
  dismissed: { label: 'Dismissed', color: 'default' },
}
