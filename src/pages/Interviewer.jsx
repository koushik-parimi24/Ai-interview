import { Layout } from 'antd'
import Dashboard from '../components/Dashboard'

const { Content } = Layout

export default function InterviewerPage() {
  return (
    <Content className="page-container">
      <div className="container panel">
        <div className="glass-panel glass-card fade-in">
          <div className="inner">
            <Dashboard />
          </div>
        </div>
      </div>
    </Content>
  )
}