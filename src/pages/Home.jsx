import { Button, Card, Col, Layout, Row, Space, Typography, Statistic, Divider, Tag } from 'antd'
import { ThunderboltOutlined, RobotOutlined, ClockCircleOutlined, CheckCircleOutlined, LineChartOutlined, SafetyOutlined, PlayCircleOutlined, TeamOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

const { Content } = Layout
const { Title, Paragraph, Text } = Typography

export default function Home() {
  const navigate = useNavigate()
  return (
    <Content className="page-container">
      <div className="gradient-blob blob-1" />
      <div className="gradient-blob blob-2" />
      <div className="container" style={{ marginTop: 16 }}>
        {/* Hero */}
        <div className="glass-card hero fade-in" style={{ padding: 28, textAlign: 'center', overflow: 'hidden', position: 'relative' }}>
          <div className="shine" />
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Title className="hero-title" style={{ margin: 0 }}>Ace Your Next Interview with AI</Title>
            <Paragraph type="secondary" style={{ maxWidth: 820, margin: '0 auto' }}>
              Practice real-world interviews, get instant feedback, and improve faster with structured guidance and analytics.
            </Paragraph>
            <Space className="hero-actions" wrap>
              <Button type="primary" size="large" icon={<PlayCircleOutlined />} onClick={() => navigate('/interviewee')}>
                Start as Interviewee
              </Button>
              <Button size="large" icon={<TeamOutlined />} onClick={() => navigate('/interviewer')}>
                Explore Interviewer Dashboard
              </Button>
            </Space>
          </Space>
        </div>

        {/* Features */}
        <div style={{ marginTop: 24 }} className="fade-in">
          <Title level={3} className="section-title" style={{ textAlign: 'center' }}>Features that help you succeed</Title>
          <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
            {[
              { icon: <RobotOutlined />, title: 'AI Interviewer', desc: 'Engage with an AI that asks, evaluates, and guides.' },
              { icon: <ClockCircleOutlined />, title: 'Timed Rounds', desc: 'Realistic timers to simulate actual interview pressure.' },
              { icon: <CheckCircleOutlined />, title: 'Actionable Feedback', desc: 'Detailed scoring, feedback, and improvement tips.' },
              { icon: <LineChartOutlined />, title: 'Progress Tracking', desc: 'Track performance across sessions and topics.' },
              { icon: <ThunderboltOutlined />, title: 'Quick Start', desc: 'Upload a resume and get a tailored interview instantly.' },
              { icon: <SafetyOutlined />, title: 'Secure & Private', desc: 'Your data stays protected with modern best practices.' },
            ].map((f, i) => (
              <Col key={i} xs={24} sm={12} md={8}>
                <Card className="glass-card feature-card slide-up" hoverable>
                  <Space direction="vertical" size={8}>
                    <div className="feature-icon">{f.icon}</div>
                    <Title level={4} style={{ margin: 0 }}>{f.title}</Title>
                    <Text type="secondary">{f.desc}</Text>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </div>

        {/* How it works */}
        <div style={{ marginTop: 24 }} className="fade-in">
          <Title level={3} className="section-title" style={{ textAlign: 'center' }}>How it works</Title>
          <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
            {[
              { step: 1, title: 'Upload Resume', desc: 'We extract your profile to tailor questions.' },
              { step: 2, title: 'Answer Questions', desc: 'Timed questions across difficulty levels.' },
              { step: 3, title: 'Get Feedback', desc: 'Receive per-question scores and feedback.' },
              { step: 4, title: 'Review & Improve', desc: 'See your summary and plan the next steps.' },
            ].map((s) => (
              <Col key={s.step} xs={24} md={12}>
                <Card className="glass-card how-card slide-up" hoverable>
                  <Space direction="vertical" size={6}>
                    <Tag color="purple" style={{ alignSelf: 'flex-start' }}>Step {s.step}</Tag>
                    <Title level={4} style={{ margin: 0 }}>{s.title}</Title>
                    <Text type="secondary">{s.desc}</Text>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </div>

        {/* Stats */}
        <div style={{ marginTop: 24 }} className="fade-in">
          <Title level={3} className="section-title" style={{ textAlign: 'center' }}>Why learners love it</Title>
          <Row gutter={[16, 16]} justify="center" style={{ marginTop: 8 }}>
            {[ 
              { title: 'Interviews Completed', value: 1200 },
              { title: 'Avg. Score Improvement', value: '35%' },
              { title: 'Questions Practiced', value: 9800 },
              { title: 'Satisfaction', value: '4.8/5' },
            ].map((s, i) => (
              <Col key={i} xs={12} md={6}>
                <Card className="glass-card stat-card">
                  <Statistic title={<Text type="secondary">{s.title}</Text>} value={s.value} valueStyle={{ color: '#fff' }} />
                </Card>
              </Col>
            ))}
          </Row>
        </div>

        {/* CTA band */}
        <div className="cta-band glass-card slide-up" style={{ marginTop: 24 }}>
          <Row gutter={[16, 16]} align="middle" justify="space-between">
            <Col xs={24} md={16}>
              <Title level={3} style={{ margin: 0 }}>Ready to level up your interview skills?</Title>
              <Text type="secondary">Start a practice session or explore insights on the dashboard.</Text>
            </Col>
            <Col xs={24} md={8}>
              <Space wrap style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button type="primary" size="large" onClick={() => navigate('/interviewee')}>Start Practice</Button>
                <Button size="large" onClick={() => navigate('/interviewer')}>Open Dashboard</Button>
              </Space>
            </Col>
          </Row>
        </div>
      </div>
    </Content>
  )
}
