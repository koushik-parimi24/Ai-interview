import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import { Button, Card, Form, Input, Progress, Space, Typography, message, App as AntApp, Spin } from 'antd'
// Lazy-load Monaco editor to reduce initial bundle size
const CodeEditor = lazy(() => import('./CodeEditor'))
import { runJavaScript } from '../utils/codeRunner'
import { useDispatch } from 'react-redux'
import { addChatEntry, upsertCandidate, finalizeCandidate } from '../slices/candidatesSlice'
import { DIFFICULTY_FLOW, updateProfile, recordAnswer, nextQuestion, endSession, resumeSession } from '../slices/interviewSlice'
import { scoreAnswer, summarizeCandidateSmart } from '../services/aiEngine'
import { saveInterviewResult } from '../services/interviews'

const { Title, Text } = Typography

function MissingFieldPrompt({ profile, onSubmit }) {
  const [form] = Form.useForm()
  useEffect(() => {
    form.setFieldsValue(profile)
  }, [profile])
  return (
    <Card title="We need a few details before starting">
      <Form layout="vertical" form={form} onFinish={onSubmit}>
        {!profile.name && <Form.Item label="Full Name" name="name" rules={[{ required: true }]}><Input placeholder="Your full name" /></Form.Item>}
        {!profile.email && <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email' }]}><Input placeholder="you@example.com" /></Form.Item>}
        {!profile.phone && <Form.Item label="Phone" name="phone" rules={[{ required: true }]}><Input placeholder="e.g., +1 555 123 4567" /></Form.Item>}
        <Form.Item>
          <Button type="primary" htmlType="submit">Continue</Button>
        </Form.Item>
      </Form>
    </Card>
  )
}

export default function Chat({ activeSession, candidate }) {
  const limitWords = (val, max) => {
    const parts = (val || '').split(/\s+/).filter(Boolean)
    if (parts.length <= max) return val
    return parts.slice(0, max).join(' ')
  }
  const dispatch = useDispatch()
  const [form] = Form.useForm()
  const [input, setInput] = useState('')
  const [remaining, setRemaining] = useState(0)
  const [busy, setBusy] = useState(false)
  const [codeOutput, setCodeOutput] = useState('')
  const [finalizing, setFinalizing] = useState(false)
  const submittingRef = useRef(false)
  const scrollRef = useRef(null)

  const currentQuestion = useMemo(() => {
    if (!activeSession) return null
    return activeSession.questions.find((q) => q.id === activeSession.currentQuestionId)
  }, [activeSession])

  const step = activeSession?.stepIndex ?? 0
  const total = DIFFICULTY_FLOW.length
  const progressPct = Math.round(((step) / total) * 100)

  const formatRemaining = (secs) => {
    if (!currentQuestion) return `${secs}s`
    if (currentQuestion.level === 'hard') {
      const m = Math.floor(secs / 60)
      const s = secs % 60
      return `${m}:${String(s).padStart(2, '0')}`
    }
    return `${secs}s`
  }

  useEffect(() => {
    if (!activeSession?.questionEndsAt) return
    const tick = () => {
      const ms = activeSession.questionEndsAt - Date.now()
      setRemaining(Math.max(0, Math.ceil(ms / 1000)))
      if (ms <= 0 && !submittingRef.current) {
        handleSubmit()
      }
    }
    tick()
    const id = setInterval(tick, 250)
    return () => clearInterval(id)
  }, [activeSession?.questionEndsAt])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [candidate?.chats?.length])

  const { modal } = AntApp.useApp()

  const handleSubmit = async () => {
    if (submittingRef.current) return
    if (!currentQuestion) return
    submittingRef.current = true
    setBusy(true)
    let text = input.trim()
    if (currentQuestion?.level === 'easy') {
      // enforce 1–5 words
      text = limitWords(text, 5)
      if (text !== input.trim()) {
        message.info('Easy questions accept up to 5 words. Extra words were ignored.')
      }
    }
    const now = Date.now()
    const timeTaken = Math.max(0, Math.ceil((DIFFICULTY_FLOW[step].seconds * 1000 - (activeSession.questionEndsAt ? (activeSession.questionEndsAt - now) : 0)) / 1000))
    dispatch(recordAnswer({ questionId: currentQuestion.id, text, timeTaken }))
    dispatch(addChatEntry({ candidateId: candidate.id, entry: { sender: 'user', text: text || '[No answer]', time: now } }))

    const { score, feedback } = await scoreAnswer(currentQuestion, text)
    dispatch(addChatEntry({ candidateId: candidate.id, entry: { sender: 'ai', text: `Score: ${score}/10\nFeedback: ${feedback}`, time: Date.now() } }))

    const nextIdx = step + 1
    if (nextIdx >= total) {
      // finalize: rescore all (ensures consistency if AI scoring updated)
      const combinedAnswers = [...activeSession.answers, { questionId: currentQuestion.id, text }]
      setFinalizing(true)
      const hide = message.loading({ content: 'Finalizing your results...', key: 'finalize', duration: 0 })
      try {
        const answersById = new Map(combinedAnswers.map((a) => [a.questionId, a]))
        // Parallelize scoring across questions to reduce total time
        const qa = await Promise.all(activeSession.questions.map(async (q) => {
          const ans = answersById.get(q.id) || { text: '' }
          const { score: s, feedback } = await scoreAnswer(q, ans.text)
          const timeTaken = (answersById.get(q.id) || {}).timeTaken
          return { id: q.id, level: q.level, text: q.text, answer: ans.text, score: s, feedback: feedback || '', timeTaken: timeTaken ?? null }
        }))
        const finalScore = qa.reduce((s, x) => s + (x.score || 0), 0)
        const summary = await summarizeCandidateSmart(activeSession.profile, qa, finalScore)
        dispatch(finalizeCandidate({ candidateId: candidate.id, score: finalScore, summary, qa }))
        try {
          await saveInterviewResult({ profile: activeSession.profile, qa, score: finalScore, summary, chats: candidate?.chats || [] })
        } catch (e) {
          console.warn('Failed to save result to Supabase:', e?.message || e)
        }
        dispatch(addChatEntry({ candidateId: candidate.id, entry: { sender: 'ai', text: `Interview complete. Final score: ${finalScore}/60. Summary: ${summary}`, time: Date.now() } }))
        dispatch(endSession())
        modal.success({
          title: 'Interview Complete',
          content: `Your final score is ${finalScore}/60. A summary has been generated in the chat and dashboard.`,
          okText: 'Great!'
        })
        setInput('')
      } finally {
        setBusy(false)
        submittingRef.current = false
        setFinalizing(false)
        message.destroy('finalize')
      }
      return
    }
    dispatch(nextQuestion())
    const nq = activeSession.questions[nextIdx]
    dispatch(addChatEntry({ candidateId: candidate.id, entry: { sender: 'ai', text: nq.text, time: Date.now() } }))
    setInput('')
    setBusy(false)
    submittingRef.current = false
  }

  if (!activeSession) return null

  const needsProfile = !activeSession.profile.name || !activeSession.profile.email || !activeSession.profile.phone

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Card className="glass-card fade-in">
        <Title className="section-title" level={4}>Interview Progress</Title>
        <Progress percent={progressPct} strokeColor={{ '0%': '#A78BFA', '100%': '#6366F1' }} />
        {currentQuestion && (
          <Text>
            <span className="timer-dot" />
            Question {step + 1} of {total} • Difficulty: {currentQuestion.level.toUpperCase()} • Time left: {formatRemaining(remaining)}
          </Text>
        )}
      </Card>

      {needsProfile ? (
        <MissingFieldPrompt
          profile={activeSession.profile}
          onSubmit={(values) => {
            dispatch(updateProfile(values))
            message.success('Thanks! Starting the interview...')
            const firstQ = activeSession.questions[0]
            dispatch(addChatEntry({ candidateId: candidate.id, entry: { sender: 'ai', text: firstQ.text, time: Date.now() } }))
            // start the timer now that details are completed
            // reuse resumeSession to set endsAt for current step
            dispatch(resumeSession())
          }}
        />
      ) : (
        <>
          <Card className="glass-card chat-card" style={{ maxHeight: 400, overflowY: 'auto' }}>
            {(candidate.chats || []).map((m, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                <div className={`chat-bubble ${m.sender === 'user' ? 'user' : 'ai'}`}>
                  <Text type={m.sender === 'ai' ? 'secondary' : undefined}>
                    {m.sender === 'ai' ? 'AI: ' : 'You: '} {m.text}
                  </Text>
                </div>
              </div>
            ))}
            <div ref={scrollRef} />
          </Card>
          {currentQuestion?.kind === 'code' ? (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', padding: 12 }}><Spin /></div>}>
                <CodeEditor
                  language="javascript"
                  value={input}
                  onChange={setInput}
                  onRun={(code) => {
                    const { output, error } = runJavaScript(code || '')
                    setCodeOutput(error ? `Error: ${error}` : (output || '(no output)'))
                    dispatch(addChatEntry({ candidateId: candidate.id, entry: { sender: 'system', text: `[Run Output]\n${error ? `Error: ${error}` : (output || '(no output)')}`, time: Date.now() } }))
                  }}
                  output={codeOutput}
                />
              </Suspense>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button type="primary" onClick={handleSubmit} disabled={busy}>Submit</Button>
              </div>
            </Space>
          ) : (
            <Form form={form} onFinish={handleSubmit} layout="inline">
              <Form.Item style={{ flex: 1 }}>
                <Input.TextArea
                  rows={2}
                  value={input}
                  onChange={(e) => {
                    const v = e.target.value
                    if (currentQuestion?.level === 'easy') {
                      setInput(limitWords(v, 5))
                    } else {
                      setInput(v)
                    }
                  }}
                  onPaste={(e) => e.preventDefault()}
                  onCopy={(e) => e.preventDefault()}
                  onCut={(e) => e.preventDefault()}
                  onDrop={(e) => e.preventDefault()}
                  onContextMenu={(e) => e.preventDefault()}
                  autoComplete="off"
                  placeholder={currentQuestion?.level === 'easy' ? 'Answer in 1–5 words (auto-submits on timer)' : 'Type your answer... (auto-submits on timer)'}
                />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" disabled={busy}>Submit</Button>
              </Form.Item>
            </Form>
          )}
        </>
      )}
      {finalizing && (
        <div className="fullscreen-overlay">
          <Spin tip="Finalizing results..." size="large" />
        </div>
      )}
    </Space>
  )
}
