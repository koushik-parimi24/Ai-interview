import { Button, Card, Drawer, Grid, Input, Progress, Space, Table, Tag, Typography, Row, Col, Statistic, message, Popconfirm, Skeleton } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectCandidates, selectAuth } from '../store'
import { fetchAllInterviewsForInterviewer, deleteInterview } from '../services/interviews'
import { getResumeSignedUrl } from '../services/storage'

const { Title, Text, Paragraph } = Typography
const { useBreakpoint } = Grid

// Helpers used by both Dashboard and ResumePanel
function getDifficultyColor(level) {
  switch ((level || '').toLowerCase()) {
    case 'easy': return 'green'
    case 'medium': return 'orange'
    case 'hard': return 'red'
    default: return 'default'
  }
}

function getScoreColor(score) {
  if ((score ?? 0) >= 8) return '#52c41a' // green
  if ((score ?? 0) >= 6) return '#faad14' // orange
  if ((score ?? 0) >= 4) return '#fa8c16' // orange-red
  return '#ff4d4f' // red
}

function ResumePanel({ selected }) {
  const [signedUrl, setSignedUrl] = useState(null)
  const [loadingResume, setLoadingResume] = useState(false)
  const [resumeError, setResumeError] = useState('')

  useEffect(() => {
    let ignore = false
    const load = async () => {
      setResumeError('')
      setSignedUrl(null)
      if (!selected?.resumePath) return
      try {
        setLoadingResume(true)
        const url = await getResumeSignedUrl(selected.resumePath, 600)
        if (!ignore) setSignedUrl(url)
      } catch (e) {
        if (!ignore) setResumeError(e?.message || 'Failed to load resume URL')
      } finally {
        if (!ignore) setLoadingResume(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [selected?.resumePath])

  const isPDF = (p) => p && p.toLowerCase().endsWith('.pdf')

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Text>Email: {selected.email || '-'}</Text>
      <Text>Phone: {selected.phone || '-'}</Text>
      <Text strong>Final Score: {selected.score ?? '-'}</Text>
      <Text>Summary: {selected.summary || '-'}</Text>

      {selected.resumePath && (
        <Card className="glass-card" style={{ marginTop: 8 }} title="Resume">
          {loadingResume ? (
            <Text type="secondary">Loading resume...</Text>
          ) : resumeError ? (
            <Text type="danger">{resumeError}</Text>
          ) : signedUrl ? (
            isPDF(selected.resumePath) ? (
              <object data={signedUrl} type="application/pdf" width="100%" height="500px">
                <p>
                  Unable to preview PDF. <a href={signedUrl} target="_blank" rel="noreferrer">Download</a>
                </p>
              </object>
            ) : (
              <Space direction="vertical">
                <Text type="secondary">Preview not available. Use the link below to download.</Text>
                <Button type="primary" href={signedUrl} target="_blank" rel="noreferrer">Download Resume</Button>
              </Space>
            )
          ) : (
            <Text type="secondary">No resume available.</Text>
          )}
        </Card>
      )}

      <Title level={4}>Per-question breakdown</Title>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {(selected.qa || []).map((q, i) => (
          <Card
            key={q.id || i}
            className="glass-card"
            style={{ marginBottom: 0 }}
            size="small"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Text strong style={{ fontSize: 16 }}>Q{i + 1}</Text>
                <Tag color={getDifficultyColor(q.level)}>
                  {q.level?.toUpperCase()}
                </Tag>
                {q.timeTaken && (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {q.timeTaken}s
                  </Text>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Progress
                    type="circle"
                    size={40}
                    percent={(q.score || 0) * 10}
                    strokeColor={getScoreColor(q.score || 0)}
                    format={() => `${q.score || 0}`}
                  />
                  <Text type="secondary" style={{ fontSize: 12 }}>/10</Text>
                </div>
              </div>
            </div>
            
            <div style={{ marginBottom: 12 }}>
              <Text strong style={{ color: '#6366f1', fontSize: 13 }}>Question:</Text>
              <Paragraph style={{ margin: '4px 0 0 0', fontSize: 14 }}>
                {q.text}
              </Paragraph>
            </div>
            
            <div style={{ marginBottom: 12 }}>
              <Text strong style={{ color: '#10b981', fontSize: 13 }}>Answer:</Text>
              <Paragraph style={{ margin: '4px 0 0 0', fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>
                {q.answer || 'No answer provided'}
              </Paragraph>
            </div>
            
            {q.feedback && (
              <div style={{ 
                backgroundColor: 'rgba(255,255,255,0.03)', 
                padding: 12, 
                borderRadius: 8,
                borderLeft: `3px solid ${getScoreColor(q.score || 0)}`
              }}>
                <Text strong style={{ color: '#f59e0b', fontSize: 13 }}>AI Feedback:</Text>
                <Paragraph style={{ margin: '4px 0 0 0', fontSize: 14, color: 'rgba(255,255,255,0.75)' }}>
                  {q.feedback}
                </Paragraph>
              </div>
            )}
          </Card>
        ))}
      </Space>

      <Title level={4}>Chat History</Title>
      <div className="glass-card" style={{ maxHeight: 400, overflowY: 'auto', padding: 12 }}>
        {(selected.chats || []).map((m, idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start' }}>
            <div className={`chat-bubble ${m.sender === 'user' ? 'user' : 'ai'}`}>
              <Text type={m.sender === 'ai' ? 'secondary' : undefined}>
                {m.sender === 'ai' ? 'AI: ' : 'Candidate: '} {m.text}
              </Text>
            </div>
          </div>
        ))}
      </div>
    </Space>
  )
}

export default function Dashboard() {
  const { list } = useSelector(selectCandidates)
  const { profile: authProfile } = useSelector(selectAuth)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [remote, setRemote] = useState(null) // null=not loaded, []=loaded
  const [deleting, setDeleting] = useState({})
  const screens = useBreakpoint()
  const small = !screens.md

  const isInterviewer = authProfile?.user_type === 'interviewer'

  useEffect(() => {
    let ignore = false
    if (isInterviewer) {
      fetchAllInterviewsForInterviewer()
        .then((rows) => {
          if (ignore) return
          // Normalize to match local candidate shape used in UI
          const mapped = (rows || []).map((r) => ({
            id: r.id,
            name: r.name,
            email: r.email,
            phone: r.phone,
            score: r.score,
            summary: r.summary,
            qa: Array.isArray(r.qa) ? r.qa : [],
            updatedAt: r.updated_at ? new Date(r.updated_at).getTime() : undefined,
            resumePath: r.resume_path || null,
            chats: [],
          }))
          setRemote(mapped)
        })
        .catch((e) => {
          message.error(e?.message || 'Failed to load interviews')
          setRemote([])
        })
    } else {
      setRemote(null)
    }
    return () => { ignore = true }
  }, [isInterviewer])

  const data = useMemo(() => {
    const q = query.toLowerCase()
    const base = Array.isArray(remote) ? remote : list
    return [...base]
      .filter((c) => !q || c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q))
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .map((c) => ({ key: c.id, ...c }))
  }, [list, query, remote])

  // Precompute stats with hooks at top-level to respect Rules of Hooks
  const avgScore = useMemo(() => data.length ? Math.round((data.reduce((s, c) => s + (c.score || 0), 0) / data.length) * 10) / 10 : 0, [data])
  const lastUpdated = useMemo(() => {
    const ts = Math.max(...data.map((d) => d.updatedAt || 0), 0)
    return ts ? new Date(ts).toLocaleString() : '-'
  }, [data])

  const handleDelete = async (rec) => {
    setDeleting((d) => ({ ...d, [rec.id]: true }))
    try {
      await deleteInterview({ id: rec.id, resumePath: rec.resumePath })
      // Remove from current view
      setRemote((cur) => Array.isArray(cur) ? cur.filter((r) => r.id !== rec.id) : cur)
      message.success('Candidate deleted')
    } catch (e) {
      message.error(e?.message || 'Failed to delete candidate')
    } finally {
      setDeleting((d) => ({ ...d, [rec.id]: false }))
    }
  }

  const columns = [
    { title: 'Name', dataIndex: 'name', onCell: () => ({ style: { whiteSpace: 'normal', wordBreak: 'break-word' } }) },
    { title: 'Email', dataIndex: 'email', responsive: ['sm'], width: 220, onCell: () => ({ style: { whiteSpace: 'normal', wordBreak: 'break-word' } }) },
    { title: 'Phone', dataIndex: 'phone', responsive: ['md'], width: 160 },
    { title: 'Score', dataIndex: 'score', width: 90, sorter: (a, b) => (a.score || 0) - (b.score || 0) },
    { title: 'Updated', dataIndex: 'updatedAt', width: 180, render: (v) => (v ? new Date(v).toLocaleString() : '-'), responsive: ['lg'] },
    { title: 'Action', width: 180, fixed: screens.lg ? undefined : 'right', render: (_, rec) => (
        <Space>
          <Button size="small" onClick={() => setSelected(rec)}>View</Button>
          <Popconfirm
            title="Delete this candidate?"
            okText="Delete"
            okType="danger"
            onConfirm={() => handleDelete(rec)}
          >
            <Button type="primary" danger size="small" loading={!!deleting[rec.id]}>Delete</Button>
          </Popconfirm>
        </Space>
      ) },
  ]


  const loading = isInterviewer && remote === null

  return (
    <Space direction="vertical" style={{ width: '100%' }} className="dashboard-wrap">
      <Title className="section-title" level={3}>Interviewer Dashboard</Title>

      {/* Summary stats */}
      <div className="glass-card fade-in" style={{ padding: 12 }}>
        {loading ? (
          <Row gutter={[12, 12]}>
            {[1,2,3].map((i) => (
              <Col key={i} xs={12} md={8}>
                <Card className="glass-card" size="small">
                  <Skeleton active paragraph={false} title={{ width: '60%' }} />
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Row gutter={[12, 12]}>
            <Col xs={12} md={8}>
              <Card className="glass-card" size="small">
                <Statistic title={<Text type="secondary">Total Results</Text>} value={data.length} valueStyle={{ color: '#fff' }} />
              </Card>
            </Col>
            <Col xs={12} md={8}>
              <Card className="glass-card" size="small">
                <Statistic
                  title={<Text type="secondary">Average Score</Text>}
                  value={avgScore}
                  suffix="/60"
                  valueStyle={{ color: '#fff' }}
                />
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card className="glass-card" size="small">
                <Statistic
                  title={<Text type="secondary">Last Updated</Text>}
                  value={lastUpdated}
                  valueStyle={{ color: '#fff' }}
                />
              </Card>
            </Col>
          </Row>
        )}
      </div>

      {/* Search */}
      <div className="glass-card" style={{ padding: 12 }}>
        <Input.Search placeholder="Search by name or email" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      {/* Table / Cards responsive */}
      <div className="glass-card fade-in" style={{ padding: 12 }}>
        {small ? (
          loading ? (
            <Space direction="vertical" style={{ width: '100%' }}>
              {[1,2,3,4].map((i) => (
                <Card key={i} className="glass-card" size="small">
                  <Skeleton active />
                </Card>
              ))}
            </Space>
          ) : (
            <Space direction="vertical" style={{ width: '100%' }}>
              {data.map((rec) => (
                <Card key={rec.key} className="glass-card" size="small">
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                    <div style={{ minWidth: 0 }}>
                      <Text strong style={{ display: 'block' }}>{rec.name || '-'}</Text>
                      <Text type="secondary" style={{ display: 'block', wordBreak: 'break-word' }}>{rec.email || '-'}</Text>
                      {rec.phone && <Text style={{ display: 'block' }}>{rec.phone}</Text>}
                      <Text type="secondary" style={{ display: 'block' }}>{rec.updatedAt ? new Date(rec.updatedAt).toLocaleString() : '-'}</Text>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <Progress
                        type="circle"
                        size={44}
                        percent={(rec.score || 0) * 10}
                        strokeColor={getScoreColor(rec.score || 0)}
                        format={() => `${rec.score || 0}`}
                      />
                    </div>
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <Button size="small" onClick={() => setSelected(rec)}>View</Button>
                    <Popconfirm
                      title="Delete this candidate?"
                      okText="Delete"
                      okType="danger"
                      onConfirm={() => handleDelete(rec)}
                    >
                      <Button type="primary" danger size="small" loading={!!deleting[rec.id]}>Delete</Button>
                    </Popconfirm>
                  </div>
                </Card>
              ))}
            </Space>
          )
        ) : (
          <Table 
            columns={columns} 
            dataSource={data} 
            loading={loading}
            pagination={{ pageSize: screens.md ? 10 : 6 }}
            scroll={{ x: 'max-content' }}
          />
        )}
      </div>

      <Drawer title={selected?.name || 'Candidate'} width={screens.md ? 900 : '100%'} open={!!selected} onClose={() => setSelected(null)}>
        {selected && (
          <ResumePanel selected={selected} />
        )}
      </Drawer>
    </Space>
  )
}
