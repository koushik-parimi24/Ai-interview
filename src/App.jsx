import { useEffect, useMemo, useState } from 'react'
import { ConfigProvider, Layout, Tabs, Typography, theme, message, App as AntApp, Grid, Drawer, Menu } from 'antd'
import { useDispatch, useSelector } from 'react-redux'
import { Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { selectCandidates, selectInterview } from './store'
import Home from './pages/Home'
import IntervieweePage from './pages/Interviewee'
import InterviewerPage from './pages/Interviewer'
import Footer from './components/Footer'
import './App.css'
import { Button, Space, Dropdown } from 'antd'
import { MenuOutlined, LoginOutlined, LogoutOutlined, TeamOutlined, SolutionOutlined } from '@ant-design/icons'
import SettingsModal from './components/SettingsModal'
import LoginPage from './pages/Login'
import SignupPage from './pages/Signup'
import { RequireAuth, RequireRole } from './routes/guards'
import { logout } from './slices/authSlice'

const { Header, Content } = Layout
const { Title } = Typography
const { useBreakpoint } = Grid

function App() {
  const { activeSession } = useSelector(selectInterview)
  const { user, profile } = useSelector((s) => s.auth || {})
  const dispatch = useDispatch()
  const location = useLocation()
  const navigate = useNavigate()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const screens = useBreakpoint()

return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#6366f1',
          colorInfo: '#6366f1',
          colorBgBase: '#0b1220',
          colorBgContainer: 'rgba(255,255,255,0.06)',
          colorBorder: 'rgba(255,255,255,0.18)',
          colorBorderSecondary: 'rgba(255,255,255,0.12)',
          colorTextBase: '#f8fafc',
          colorText: '#f8fafc',
          colorTextSecondary: 'rgba(248,250,252,0.75)',
          borderRadius: 12,
          fontSize: 14,
        },
        components: {
          Card: {
            colorBgContainer: 'rgba(255,255,255,0.06)',
            colorBorderSecondary: 'rgba(255,255,255,0.12)'
          },
          Tabs: {
            itemSelectedColor: '#ffffff',
            itemHoverColor: '#e5e7eb',
            inkBarColor: '#a78bfa'
          },
          Button: {
            colorPrimaryHover: '#7c83ff',
            colorPrimaryActive: '#585cf1'
          },
          Table: {
            headerBg: 'rgba(255,255,255,0.06)',
            colorText: '#f8fafc',
            rowHoverBg: 'rgba(255,255,255,0.06)'
          },
          Input: {
            colorBgContainer: 'rgba(255,255,255,0.06)',
            colorText: '#f8fafc'
          },
          Drawer: {
            colorBgElevated: 'rgba(20,24,40,0.95)'
          },
          Modal: {
            contentBg: 'rgba(20,24,40,0.95)'
          }
        }
      }}
    >
      <AntApp>
        <Layout style={{ minHeight: '100vh' }}>
          <Header className="app-header" style={{ color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <Title level={3} className="header-title" style={{ margin: 0, lineHeight: 1 }}>
              <a onClick={() => navigate('/')}>AI-Interview Assistant</a>
            </Title>

            {screens.md ? (
              <Space className="right-actions">
                <Link to="/interviewee"><Button icon={<SolutionOutlined />}>Interviewee</Button></Link>
                <Link to="/interviewer"><Button icon={<TeamOutlined />}>Interviewer</Button></Link>
                {!user ? (
                  <>
                    <Link to="/login"><Button icon={<LoginOutlined />}>Log in</Button></Link>
                    <Link to="/signup"><Button type="primary">Sign up</Button></Link>
                  </>
                ) : (
                  <Dropdown
                    menu={{
                      items: [
                        { key: 'role', label: `Role: ${profile?.user_type || '-'}` },
                        { type: 'divider' },
                        { key: 'logout', icon: <LogoutOutlined />, label: 'Log out', onClick: () => dispatch(logout()) },
                      ],
                    }}
                  >
                    <Button>{user.email}</Button>
                  </Dropdown>
                )}
              </Space>
            ) : (
              <Button type="text" aria-label="Open menu" onClick={() => setMobileOpen(true)} icon={<MenuOutlined style={{ fontSize: 20, color: '#fff' }} />} />
            )}

            <Drawer
              title="Menu"
              placement="right"
              width={280}
              open={mobileOpen}
              onClose={() => setMobileOpen(false)}
            >
              <Menu
                mode="inline"
                selectable={false}
                onClick={({ key }) => {
                  if (key === 'interviewee') navigate('/interviewee')
                  if (key === 'interviewer') navigate('/interviewer')
                  if (key === 'login') navigate('/login')
                  if (key === 'signup') navigate('/signup')
                  if (key === 'logout') dispatch(logout())
                  setMobileOpen(false)
                }}
                items={[
                  { key: 'interviewee', icon: <SolutionOutlined />, label: 'Interviewee' },
                  { key: 'interviewer', icon: <TeamOutlined />, label: 'Interviewer' },
                  ...(user ? [
                    { type: 'divider' },
                    { key: 'logout', icon: <LogoutOutlined />, label: 'Log out' },
                  ] : [
                    { type: 'divider' },
                    { key: 'login', icon: <LoginOutlined />, label: 'Log in' },
                    { key: 'signup', label: 'Sign up' },
                  ]),
                ]}
              />
            </Drawer>
          </Header>

          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            <Route element={<RequireAuth />}> 
              <Route element={<RequireRole role="interviewee" />}> 
                <Route path="/interviewee" element={<IntervieweePage />} />
              </Route>
              <Route element={<RequireRole role="interviewer" />}> 
                <Route path="/interviewer" element={<InterviewerPage />} />
              </Route>
            </Route>
          </Routes>

          <Footer />
          <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
        </Layout>
      </AntApp>
    </ConfigProvider>
  )
}

export default App
