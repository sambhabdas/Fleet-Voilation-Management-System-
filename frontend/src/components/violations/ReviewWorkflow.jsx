import { useState } from 'react'
import {
  Card, Tag, Button, Space, Input, Typography, message, Divider,
} from 'antd'
import {
  CheckCircleOutlined, CloseCircleOutlined, EyeOutlined,
  UndoOutlined,
} from '@ant-design/icons'
import { violationService } from '@/services'
import { REVIEW_STATUSES } from '@/constants'
import dayjs from 'dayjs'

const { Text } = Typography
const { TextArea } = Input

export default function ReviewWorkflow({ violation, onUpdate }) {
  const [loading, setLoading] = useState(false)
  const [notes, setNotes] = useState(violation.review_notes || '')

  const updateReview = async (newStatus) => {
    setLoading(true)
    try {
      const res = await violationService.updateReview(violation.id, {
        review_status: newStatus,
        review_notes: notes || null,
      })
      message.success(`Violation ${newStatus.replace('_', ' ')}`)
      if (onUpdate) onUpdate(res.data)
    } catch (err) {
      message.error('Failed to update review status')
    } finally {
      setLoading(false)
    }
  }

  const status = violation.review_status || 'pending'
  const statusInfo = REVIEW_STATUSES[status] || REVIEW_STATUSES.pending

  return (
    <Card
      title="Review Workflow"
      size="small"
      extra={<Tag color={statusInfo.color}>{statusInfo.label}</Tag>}
    >
      {/* Review Notes */}
      <TextArea
        rows={3}
        placeholder="Add review notes..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        style={{ marginBottom: 12 }}
        disabled={status === 'confirmed' || status === 'dismissed'}
      />

      {/* Action Buttons */}
      {status === 'pending' && (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          onClick={() => updateReview('under_review')}
          loading={loading}
          block
        >
          Start Review
        </Button>
      )}

      {status === 'under_review' && (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button
            type="primary"
            danger
            icon={<CheckCircleOutlined />}
            onClick={() => updateReview('confirmed')}
            loading={loading}
            block
          >
            Confirm Violation
          </Button>
          <Button
            icon={<CloseCircleOutlined />}
            onClick={() => updateReview('dismissed')}
            loading={loading}
            block
          >
            Dismiss Violation
          </Button>
        </Space>
      )}

      {(status === 'confirmed' || status === 'dismissed') && (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text type="secondary">
            {status === 'dismissed'
              ? 'This violation has been dismissed and excluded from scoring.'
              : 'This violation has been confirmed.'}
          </Text>
          <Button
            icon={<UndoOutlined />}
            onClick={() => updateReview('pending')}
            loading={loading}
            size="small"
          >
            Reopen for Review
          </Button>
        </Space>
      )}

      {/* Review Info */}
      {violation.reviewed_by && (
        <>
          <Divider style={{ margin: '12px 0' }} />
          <Text type="secondary" style={{ fontSize: 12 }}>
            Reviewed by User #{violation.reviewed_by}
            {violation.reviewed_at && ` on ${dayjs(violation.reviewed_at).format('MMM DD, YYYY HH:mm')}`}
          </Text>
        </>
      )}
    </Card>
  )
}
