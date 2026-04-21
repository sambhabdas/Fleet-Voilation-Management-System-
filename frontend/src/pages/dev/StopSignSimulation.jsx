import { useState } from 'react'
import { Button, Card, Col, InputNumber, List, Row, Space, Tag, Typography } from 'antd'
import { buildMockTrafficSigns, simulateApproachSequence, simulateStopSignDetection } from '@/dev/stopSignSimulation'
import { publishStopSignSimulation } from '@/services/stopSignSimulationBus'

const { Title, Text } = Typography

const DEFAULT_LOCATION = {
  lat: 25.2048,
  lng: 55.2708,
}

export default function StopSignSimulation() {
  const [speedKmh, setSpeedKmh] = useState(30)
  const [signalRadiusMeters, setSignalRadiusMeters] = useState(500)
  const [logs, setLogs] = useState([])

  const runSingleDetection = () => {
    const trafficSigns = buildMockTrafficSigns(DEFAULT_LOCATION)
    const result = simulateStopSignDetection({
      location: DEFAULT_LOCATION,
      speedKmh,
      trafficSigns,
      signalRadiusMeters,
    })

    publishStopSignSimulation({
      kind: 'single',
      location: DEFAULT_LOCATION,
      speedKmh,
      signalRadiusMeters,
      detected: result.detected,
      stopSign: result.stopSign,
      message: result.message,
      distance: result.distance,
      nearbySigns: result.nearbySigns,
      shouldRecord: result.detected,
    })

    setLogs([
      {
        kind: 'single',
        timestamp: new Date().toISOString(),
        ...result,
      },
    ])
  }

  const runApproachSimulation = () => {
    const sequence = simulateApproachSequence({
      startLocation: DEFAULT_LOCATION,
      speedKmh,
      steps: 6,
      stepMeters: 50,
    })

    sequence.forEach((entry) => {
      publishStopSignSimulation({
        kind: 'approach',
        location: entry.location,
        speedKmh,
        signalRadiusMeters: entry.signalRadiusMeters,
        detected: entry.detected,
        stopSign: entry.stopSign,
        message: entry.message,
        distance: entry.distance,
        nearbySigns: entry.nearbySigns,
        shouldRecord: entry.detected,
        step: entry.step,
      })
    })

    setLogs(sequence.map((entry) => ({
      kind: 'approach',
      timestamp: new Date().toISOString(),
      ...entry,
    })))
  }

  return (
    <div style={{ padding: 24 }}>
      <Title level={3} style={{ marginTop: 0 }}>Stop Sign GPS Simulation</Title>
      <Text type="secondary">
        Use this page to simulate stop-sign GPS alerts and verify the near-sign signal flow without live map data.
      </Text>

      <Card style={{ marginTop: 16, marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col xs={24} md={8}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>Speed (km/h)</Text>
              <InputNumber min={0} max={160} value={speedKmh} onChange={setSpeedKmh} style={{ width: '100%' }} />
            </Space>
          </Col>
          <Col xs={24} md={8}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>Signal Radius (m)</Text>
              <InputNumber min={50} max={2000} value={signalRadiusMeters} onChange={setSignalRadiusMeters} style={{ width: '100%' }} />
            </Space>
          </Col>
          <Col xs={24} md={8}>
            <Space wrap>
              <Button type="primary" onClick={runSingleDetection}>Run Single Test</Button>
              <Button onClick={runApproachSimulation}>Run Approach Sequence</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card title="Output">
        <List
          dataSource={logs}
          locale={{ emptyText: 'Run a simulation to see results' }}
          renderItem={(item) => (
            <List.Item>
              <Space direction="vertical" size={2}>
                <Space wrap>
                  <Tag color={item.detected ? 'red' : 'blue'}>{item.detected ? 'SIGNAL ON' : 'NO SIGNAL'}</Tag>
                  <Tag color="geekblue">{item.kind}</Tag>
                  {item.stopSign?.label && <Tag color="orange">{item.stopSign.label}</Tag>}
                </Space>
                <Text>
                  {item.message}
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {item.location ? `Lat ${item.location.lat.toFixed(5)}, Lng ${item.location.lng.toFixed(5)}` : ''}
                  {typeof item.distance === 'number' ? ` | Distance ${Math.round(item.distance)}m` : ''}
                  {typeof item.speedKmh === 'number' ? ` | Speed ${item.speedKmh} km/h` : ''}
                </Text>
              </Space>
            </List.Item>
          )}
        />
      </Card>
    </div>
  )
}