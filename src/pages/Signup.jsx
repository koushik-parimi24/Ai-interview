import { useEffect } from 'react'
import { Button, Card, Form, Input, Select, Typography, Alert, message } from 'antd'
import { useDispatch, useSelector } from 'react-redux'
import { signup, login, fetchProfile } from '../slices/authSlice'
import { useNavigate } from 'react-router-dom'

const { Title, Text } = Typography

export default function SignupPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { status, error, user, profile } = useSelector((s) => s.auth || {})
  const [form] = Form.useForm()

  useEffect(() => {
    if (user && profile) {
      if (profile.user_type === 'interviewer') navigate('/interviewer', { replace: true })
      else if (profile.user_type === 'interviewee') navigate('/interviewee', { replace: true })
      else navigate('/', { replace: true })
    }
  }, [user, profile, navigate])

  const onFinish = async (values) => {
    const res = await dispatch(signup(values))
    if (res?.payload?.requiresVerification) {
      message.success('Check your email to verify your account, then log in.')
      navigate('/login')
      return
    }
    // If session is created immediately (email confirmations disabled), proceed to login to fetch profile
    await dispatch(login({ email: values.email, password: values.password }))
    await dispatch(fetchProfile())
  }

  return (
    <div className="container" style={{ maxWidth: 480, margin: '40px auto' }}>
      <Card className="glass-card">
        <Title level={3} style={{ textAlign: 'center' }}>Sign up</Title>
        {error && <Alert type="error" message={error} style={{ marginBottom: 12 }} />}
        <Form layout="vertical" form={form} onFinish={onFinish} initialValues={{ userType: 'interviewee' }}>
          <Form.Item name="name" label="Full name" rules={[{ required: true }]}>
            <Input placeholder="Jane Doe" />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="you@example.com" />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true, min: 6 }]}>
            <Input.Password placeholder="••••••••" />
          </Form.Item>
          <Form.Item name="userType" label="Role" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'interviewer', label: 'Interviewer' },
                { value: 'interviewee', label: 'Interviewee' },
              ]}
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={status === 'loading'}>
            Create account
          </Button>
        </Form>
        <Text>
          Already have an account? <a onClick={() => navigate('/login')}>Log in</a>
        </Text>
      </Card>
    </div>
  )
}