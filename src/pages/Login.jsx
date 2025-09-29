import { useState, useEffect } from 'react'
import { Button, Card, Form, Input, Typography, Alert } from 'antd'
import { useDispatch, useSelector } from 'react-redux'
import { login, setSession, fetchProfile } from '../slices/authSlice'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'

const { Title, Text } = Typography

export default function LoginPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { status, error, user, profile } = useSelector((s) => s.auth || {})
  const [form] = Form.useForm()

  useEffect(() => {
    // Hydrate session on mount
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) dispatch(setSession({ user: data.session.user, session: data.session }))
    })
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user || null
      dispatch(setSession({ user: u, session }))
      if (u) {
        dispatch(fetchProfile())
      }
    })
    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [dispatch])

  useEffect(() => {
    if (user && profile) {
      // Redirect based on role
      if (profile.user_type === 'interviewer') navigate('/interviewer', { replace: true })
      else if (profile.user_type === 'interviewee') navigate('/interviewee', { replace: true })
      else navigate('/', { replace: true })
    }
  }, [user, profile, navigate])

  const onFinish = (values) => {
    dispatch(login(values)).then(() => dispatch(fetchProfile()))
  }

  return (
    <div className="container" style={{ maxWidth: 420, margin: '40px auto' }}>
      <Card className="glass-card">
        <Title level={3} style={{ textAlign: 'center' }}>Log in</Title>
        {error && <Alert type="error" message={error} style={{ marginBottom: 12 }} />}
        <Form layout="vertical" form={form} onFinish={onFinish}>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="you@example.com" />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true, min: 6 }]}>
            <Input.Password placeholder="••••••••" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={status === 'loading'}>
            Log in
          </Button>
        </Form>
        <Text>
          Don&apos;t have an account? <a onClick={() => navigate('/signup')}>Sign up</a>
        </Text>
      </Card>
    </div>
  )
}