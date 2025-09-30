import { useEffect, useMemo, useState } from 'react'
import { Button, Card, Drawer, Layout, Space, Table, Typography, message, Grid, Row, Col, Statistic, Empty } from 'antd'
import { useDispatch, useSelector } from 'react-redux'
import ResumeUploader from '../components/ResumeUploader'
import Chat from '../components/Chat'
import { selectCandidates, selectInterview } from '../store'
import { addChatEntry, upsertCandidate } from '../slices/candidatesSlice'
import { bootstrapExistingSession, resumeSession, startSession } from '../slices/interviewSlice'
import { getQuestionSet } from '../services/aiEngine'
import WelcomeBackModal from '../components/WelcomeBackModal'
import { v4 as uuidv4 } from 'uuid'

const { Content } = Layout
const { Title, Text, Paragraph } = Typography
const { useBreakpoint } = Grid

export default function IntervieweePage() {
  const { activeSession } = useSelector(selectInterview)
  const { list } = useSelector(selectCandidates)
  const dispatch = useDispatch()
  const [welcomeOpen, setWelcomeOpen] = useState(false)
  const [candidateId, setCandidateId] = useState(null)
  const [view, setView] = useState(null)
  const screens = useBreakpoint()

  useEffect(() => {
    const persisted = JSON.parse(localStorage.getItem('persist:root') || '{}')
    if (persisted && persisted.interview) {
      try {
        const interviewPersist = JSON.parse(persisted.interview)
        if (interviewPersist?.activeSession) {
          dispatch(bootstrapExistingSession(interviewPersist.activeSession))
          setCandidateId(interviewPersist.activeSession.candidateId)
          setWelcomeOpen(true)
        }
      } catch {}
    }
  }, [])

  const candidate = useMemo(() => list.find((c) => c.id === candidateId) || list[list.length - 1], [list, candidateId])

  const mySessions = useMemo(() => {
    if (candidate?.email) return [...list].filter((c) => c.email === candidate.email).sort((a,b)=> (b.updatedAt||0)-(a.updatedAt||0))
    return [...list].sort((a,b)=> (b.updatedAt||0)-(a.updatedAt||0))
  }, [list, candidate?.email])

  const startNew = async (profile) => {
    const id = uuidv4()
    const profileWithId = { ...profile, id }
    dispatch(upsertCandidate(profileWithId))
    setCandidateId(id)
    const questions = await getQuestionSet(profile)
    dispatch(startSession({ candidateId: id, profile, questions }))
    dispatch(addChatEntry({ candidateId: id, entry: { sender: 'system', text: 'We will start with a few questions. First, please confirm any missing details.', time: Date.now() } }))
    if (profile.name && profile.email && profile.phone) {
      dispatch(addChatEntry({ candidateId: id, entry: { sender: 'ai', text: questions[0].text, time: Date.now() } }))
    }
  }

  return (
    <Content className="page-container">
      <div className="container panel">
        <div className="glass-panel glass-card fade-in">
          <div className="inner">
            {!activeSession ? (
              <>
                <Title className="section-title" level={4}>Upload Resume</Title>
                <ResumeUploader onParsed={(data) => {
                  startNew({ 
                    name: data.name || '', 
                    email: data.email || '', 
                    phone: data.phone || '',
                    resumePath: data.resumePath || null,
                    resumeFilename: data.filename || null,
                    resumeMimeType: data.mimeType || null,
                  })
                }} />
              </>
            ) : (
              <Chat activeSession={activeSession} candidate={candidate} />
            )}
          </div>
        </div>
      </div>

      {/* History section */}
      <div className="container panel" style={{ marginTop: 16 }}>
        <div className="glass-panel glass-card fade-in">
          <div className="inner">
            {/* Overview stats */}
            <Row gutter={[12, 12]}>
              <Col xs={12} md={8}>
                <Card className="glass-card" size="small">
                  <Statistic title={<Text type="secondary">Total Sessions</Text>} value={mySessions.length} valueStyle={{ color: '#fff' }} />
                </Card>
              </Col>
              <Col xs={12} md={8}>
                <Card className="glass-card" size="small">
                  <Statistic title={<Text type="secondary">Average Score</Text>} value={useMemo(() => mySessions.length ? Math.round((mySessions.reduce((s, c) => s + (c.score || 0), 0) / mySessions.length) * 10) / 10 : 0, [mySessions])} suffix="/60" valueStyle={{ color: '#fff' }} />
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card className="glass-card" size="small">
                  <Statistic title={<Text type="secondary">Best Score</Text>} value={useMemo(() => Math.max(...mySessions.map((s) => s.score || 0), 0), [mySessions])} suffix="/60" valueStyle={{ color: '#fff' }} />
                </Card>
              </Col>
            </Row>

            <Title className="section-title" level={4} style={{ marginTop: 12 }}>Your interview history</Title>
            <Card className="glass-card" style={{ marginTop: 8 }}>
              {mySessions.length === 0 ? (
                <Empty description={<Text type="secondary">No sessions yet. Upload your resume to start a practice interview.</Text>} />
              ) : (
                <Table
                  size="middle"
                  tableLayout="fixed"
                  pagination={{ pageSize: 5 }}
                  dataSource={mySessions.map((s, i) => ({ key: s.id || i, ...s }))}
                  scroll={{ x: 700 }}
                  columns={[
                    {
                      title: 'Date',
                      dataIndex: 'updatedAt',
                      width: 160,
                      responsive: ['sm'],
                      onCell: () => ({ style: { whiteSpace: 'normal', wordBreak: 'break-word' } }),
                      render: (v) => (v ? new Date(v).toLocaleString() : '-')
                    },
                    {
                      title: 'Name',
                      dataIndex: 'name',
                      onCell: () => ({ style: { whiteSpace: 'normal', wordBreak: 'break-word' } }),
                      render: (v) => <Paragraph ellipsis={{ rows: 1 }} style={{ margin: 0 }}>{v || '-'}</Paragraph>,
                    },
                    {
                      title: 'Email',
                      dataIndex: 'email',
                      responsive: ['md'],
                      width: 200,
                      onCell: () => ({ style: { whiteSpace: 'normal', wordBreak: 'break-word' } }),
                      render: (v) => <Paragraph ellipsis={{ rows: 1 }} style={{ margin: 0 }}>{v || '-'}</Paragraph>,
                    },
                    { title: 'Score', dataIndex: 'score', width: 90 },
                    {
                      title: 'Summary',
                      dataIndex: 'summary',
                      responsive: ['lg'],
                      width: 300,
                      onCell: () => ({ style: { whiteSpace: 'normal', wordBreak: 'break-word' } }),
                      render: (v) => <Paragraph ellipsis={{ rows: 2 }} style={{ margin: 0 }}>{v || '-'}</Paragraph>,
                    },
                    { title: 'Action', width: 120, fixed: 'right', render: (_, rec) => <Button onClick={() => setView(rec)}>View</Button> },
                  ]}
                />
              )}
            </Card>

            <Drawer title={view?.name || 'Interview'} open={!!view} width={screens.md ? 900 : '100%'} onClose={() => setView(null)}>
              {view && (
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text>Email: {view.email || '-'}</Text>
                  <Text>Phone: {view.phone || '-'}</Text>
                  <Text strong>Final Score: {view.score ?? '-'}</Text>
                  <Text>Summary: {view.summary || '-'}</Text>

                  <Title level={5}>Per-question breakdown</Title>
                  <Table
                    size="small"
                    pagination={false}
                    dataSource={(view.qa || []).map((q, i) => ({ key: q.id || i, idx: i + 1, ...q }))}
                    columns={[
                      { title: '#', dataIndex: 'idx', width: 50 },
                      { title: 'Level', dataIndex: 'level', width: 80 },
                      { title: 'Question', dataIndex: 'text', width: 260, ellipsis: true },
                      { title: 'Answer', dataIndex: 'answer', width: 260, ellipsis: true },
                      { title: 'Score', dataIndex: 'score', width: 80 },
                      { title: 'Feedback', dataIndex: 'feedback' },
                    ]}
                    scroll={{ x: 900 }}
                  />

                  <Title level={5}>Chat History</Title>
                  <div className="glass-card" style={{ maxHeight: 320, overflowY: 'auto', padding: 12 }}>
                    {(view.chats || []).map((m, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                        <div className={`chat-bubble ${m.sender === 'user' ? 'user' : 'ai'}`}>
                          <Text type={m.sender === 'ai' ? 'secondary' : undefined}>
                            {m.sender === 'ai' ? 'AI: ' : 'You: '} {m.text}
                          </Text>
                        </div>
                      </div>
                    ))}
                  </div>
                </Space>
              )}
            </Drawer>
          </div>
        </div>
      </div>

      <WelcomeBackModal
        open={welcomeOpen}
        onResume={() => {
          setWelcomeOpen(false)
          dispatch(resumeSession())
          message.success('Session resumed')
        }}
        onStartOver={() => {
          setWelcomeOpen(false)
          message.info('You can start a new interview by uploading a resume.')
        }}
      />
    </Content>
  )
}
