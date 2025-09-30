import { v4 as uuidv4 } from 'uuid'

// OpenRouter integration with local fallbacks
const ENV_KEY = import.meta.env.VITE_OPENROUTER_API_KEY
const ENV_MODEL = import.meta.env.VITE_OPENROUTER_MODEL

// Azure OpenAI integration
const AZURE_ENDPOINT = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT
const AZURE_KEY = import.meta.env.VITE_AZURE_OPENAI_KEY
const AZURE_DEPLOYMENT = import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT
const AZURE_API_VERSION = import.meta.env.VITE_AZURE_OPENAI_API_VERSION || '2024-12-01-preview'

const APP_TITLE = 'AI Interview Assistant'

function getOpenRouterApiKey() {
  console.log('Debug - ENV_KEY from import.meta.env:', ENV_KEY)
  if (typeof window !== 'undefined') {
    const ls = window.localStorage?.getItem('openrouter_api_key')
    if (ls) {
      console.log('Debug - Using localStorage API key')
      return ls
    }
    // optional global for quick debugging
    if (window.OPENROUTER_API_KEY) {
      console.log('Debug - Using window.OPENROUTER_API_KEY')
      return window.OPENROUTER_API_KEY
    }
  }
  console.log('Debug - Using ENV_KEY')
  return ENV_KEY
}

function getOpenRouterModel() {
  if (typeof window !== 'undefined') {
    const ls = window.localStorage?.getItem('openrouter_model')
    if (ls) return ls
    if (window.OPENROUTER_MODEL) return window.OPENROUTER_MODEL
  }
  return ENV_MODEL || 'openrouter/auto'
}

const EASY_QUESTIONS = [
  'Which keyword declares a constant in JS?',
  'Which React hook manages state?',
  'Name the JS array method to add an item at the end.',
  'Which HTTP verb is used to fetch data?',
]
const MEDIUM_QUESTIONS = [
  'Explain the difference between useState and useEffect in React.',
  'How does async/await work in JavaScript? Give a simple example.',
]
const HARD_QUESTIONS = [
  'Write a React component that fetches and displays a list of users.',
  'Create a function that debounces API calls in JavaScript.',
  'Create a function that finds the most frequent element in an array.',
  'Write a React component with a form that validates email input.'
]

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

async function callOpenRouter(messages, responseFormat) {
  const apiKey = getOpenRouterApiKey()
  console.log('Debug - API Key exists:', !!apiKey)
  console.log('Debug - API Key starts with sk-or:', apiKey?.startsWith('sk-or'))
  if (!apiKey) throw new Error('Missing OpenRouter API key')
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
    'X-Title': APP_TITLE,
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    headers['HTTP-Referer'] = window.location.origin
  }
  const body = {
    model: getOpenRouterModel(),
    messages,
    stream: false,
  }
  if (responseFormat) body.response_format = responseFormat
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error(`OpenRouter error ${res.status}: ${t}`)
  }
  const data = await res.json()
  const content = data?.choices?.[0]?.message?.content || ''
  return content
}

// Azure OpenAI functions
function getAzureOpenAIConfig() {
  if (typeof window !== 'undefined') {
    const endpoint = window.localStorage?.getItem('azure_openai_endpoint') || AZURE_ENDPOINT
    const key = window.localStorage?.getItem('azure_openai_key') || AZURE_KEY
    const deployment = window.localStorage?.getItem('azure_openai_deployment') || AZURE_DEPLOYMENT
    return { endpoint, key, deployment }
  }
  return { endpoint: AZURE_ENDPOINT, key: AZURE_KEY, deployment: AZURE_DEPLOYMENT }
}

function hasAzureOpenAI() {
  const { endpoint, key, deployment } = getAzureOpenAIConfig()
  return !!(endpoint && key && deployment)
}

async function callAzureOpenAI(messages, responseFormat) {
  const { endpoint, key, deployment } = getAzureOpenAIConfig()
  if (!endpoint || !key || !deployment) throw new Error('Missing Azure OpenAI configuration')
  
  console.log('🔵 Using Azure OpenAI:', deployment)
  
  const headers = {
    'Content-Type': 'application/json',
    'api-key': key
  }
  
  const body = {
    messages,
    max_tokens: 1000,
    temperature: 0.7,
    stream: false
  }
  if (responseFormat) body.response_format = responseFormat
  
  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${AZURE_API_VERSION}`
  
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  
  if (!res.ok) {
    const errorText = await res.text().catch(() => '')
    throw new Error(`Azure OpenAI error ${res.status}: ${errorText}`)
  }
  
  const data = await res.json()
  const content = data?.choices?.[0]?.message?.content || ''
  return content
}

export const generateQuestionSetLocal = () => {
  const set = [
    { id: uuidv4(), level: 'easy', kind: 'text', text: pick(EASY_QUESTIONS) },
    { id: uuidv4(), level: 'easy', kind: 'text', text: pick(EASY_QUESTIONS) },
    { id: uuidv4(), level: 'medium', kind: 'text', text: pick(MEDIUM_QUESTIONS) },
    { id: uuidv4(), level: 'medium', kind: 'text', text: pick(MEDIUM_QUESTIONS) },
    { id: uuidv4(), level: 'hard', kind: 'code', text: pick(HARD_QUESTIONS) },
    { id: uuidv4(), level: 'hard', kind: 'code', text: pick(HARD_QUESTIONS) },
  ]
  return set
}

export async function generateQuestionSetAI(profile = {}, apiCaller = callOpenRouter) {
  const sys = {
    role: 'system',
    content:
`You are a technical interviewer for a Full Stack (java) role. Generate exactly 6 interview questions with specific time constraints:

EASY (2 questions): Quick recall questions designed to be answered optimally in 1-5 words within 30 seconds. Focus on basic concepts, syntax, or definitions that have short, direct answers.

MEDIUM (2 questions): Explanation questions that can be thoroughly answered in 60 seconds. Should require 2-3 sentences explaining concepts, differences, or simple examples. Focus on React hooks, Node.js concepts, or explaining how something works.

HARD (2 questions): Code implementation tasks that can be completed in 300 seconds (5 minutes). Should be concise coding problems - small functions, simple algorithms, or short React components. Avoid complex multi-step problems.

Examples:
- Easy: "Which React hook manages state?" 
- Medium: "Explain the difference between useEffect and useState with a simple example."
- Hard: "Write a React component that displays a counter with increment/decrement buttons."

Return STRICT JSON array with items of the form {"level":"easy|medium|hard","text":"..."}. No extra commentary.`
  }
  const usr = {
    role: 'user',
    content: `Candidate: ${profile.name || 'N/A'} (${profile.email || ''}). Focus on React and Node. Generate time-appropriate questions. Output JSON only.`,
  }
  try {
    const content = await apiCaller([sys, usr])
    const firstBracket = content.indexOf('[')
    const lastBracket = content.lastIndexOf(']')
    const jsonStr = firstBracket >= 0 ? content.slice(firstBracket, lastBracket + 1) : content
    const arr = JSON.parse(jsonStr)
    const normalized = Array.isArray(arr) ? arr.slice(0, 6).map((q, i) => ({ id: uuidv4(), level: q.level?.toLowerCase(), text: q.text, kind: (q.level?.toLowerCase() === 'hard') ? 'code' : 'text' })) : []
    if (normalized.length === 6) return normalized
    throw new Error('Invalid AI question format')
  } catch (e) {
    console.warn('AI question generation failed, falling back to local:', e)
    return generateQuestionSetLocal()
  }
}

export const getQuestionSet = async (profile) => {
  // Priority: Azure OpenAI > OpenRouter > Local
  if (hasAzureOpenAI()) {
    try {
      console.log('🔵 Trying Azure OpenAI for question generation')
      return await generateQuestionSetAI(profile, callAzureOpenAI)
    } catch (e) {
      console.warn('Azure OpenAI failed, trying OpenRouter:', e)
    }
  }
  
  if (getOpenRouterApiKey()) {
    try {
      console.log('🟡 Trying OpenRouter for question generation')
      return await generateQuestionSetAI(profile, callOpenRouter)
    } catch (e) {
      console.warn('OpenRouter failed, using local:', e)
    }
  }
  
  console.log('⚪ Using local question generation')
  return generateQuestionSetLocal()
}

function normalize(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9+.#\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function easyExpectedTokens(questionText) {
  const q = normalize(questionText)
  const tokens = new Set()
  // Heuristics for common fundamentals
  if (/\bconstant\b/.test(q) || /\bconst\b/.test(q)) tokens.add('const')
  if (/(react.*hook.*manage.*state|manage.*state.*hook|which hook manages state|state hook)/.test(q)) tokens.add('usestate')
  if (/(add.*end.*array|push.*array|array.*method.*add.*end)/.test(q)) tokens.add('push')
  if (/(http.*verb.*fetch|which http verb.*fetch|retrieve.*http)/.test(q)) tokens.add('get')
  if (/\bjsx\b/.test(q)) tokens.add('jsx')
  if (/\bstrict\s*equality\b/.test(q)) tokens.add('===')
  if (/\bloos[e]?\s*equality\b/.test(q)) tokens.add('==')
  return tokens
}

export const evaluateAnswerLocal = (question, answer) => {
  if (!answer || !answer.trim()) return { score: 0, feedback: 'No answer provided.' }
  const words = answer.trim().split(/\s+/)
  const wordCount = words.length

  // EASY: prioritize correctness of a short, direct answer; no reasoning required
  if (question.level === 'easy') {
    const qTokens = easyExpectedTokens(question.text)
    const normalizedAns = normalize(answer)
    const ansTokens = new Set(normalizedAns.split(' '))
    let matched = false
    for (const t of qTokens) {
      if (ansTokens.has(t)) { matched = true; break }
      // Allow punctuation variants for operators like '===' in text answers
      if (t === '===' && /===/.test(answer)) { matched = true; break }
    }
    if (matched) {
      // Reward concise correctness
      const concise = wordCount <= 3
      const score = concise ? 10 : 9
      return { score, feedback: 'Correct. Concise answer expected for easy questions.' }
    }
    // Fallback: light keyword checks
    const a = normalizedAns
    if (/(const|usestate|push|get|jsx)/.test(a)) {
      return { score: 8, feedback: 'Likely correct for an easy question.' }
    }
    return { score: 5, feedback: 'Partial or unclear answer for an easy question.' }
  }

  // MEDIUM/HARD: simple heuristic based on length and keywords
  let lenScore = Math.min(6, Math.floor(wordCount / 20))
  let keywordScore = 0
  const a = normalize(answer)
  if (question.level === 'medium') {
    if (/(useeffect|usestate|middleware|async|await|closure|prototype)/.test(a)) keywordScore += 4
  } else {
    if (/(token|csrf|memo|cluster|websocket|performance|complexity|debounce|throttle)/.test(a)) keywordScore += 5
  }
  const score = Math.min(10, lenScore + keywordScore)
  return { score, feedback: 'Heuristic score based on length and keywords.' }
}

export async function evaluateAnswerAI(question, answer, apiCaller = null) {
  const timeConstraints = {
    easy: '30 seconds',
    medium: '60 seconds', 
    hard: '300 seconds (5 minutes)'
  }
  
  const base = 'Return STRICT JSON: {"score":0-10,"feedback":"short justification"}. If the answer/code is empty, whitespace, not runnable, or non-responsive, the score MUST be 0. No commentary.'
  
  const easyClause = 'For EASY questions, do NOT expect reasoning or explanations. If the core term or short correct phrase is provided (e.g., "const", "useState", "push", "GET"), award high marks (9-10) even if very brief.'
  
  const sys = { role: 'system', content: question.kind === 'code'
    ? `You evaluate JavaScript code solutions for Full Stack problems. Consider that this was a timed question with ${timeConstraints[question.level]} to complete. Score based on correctness, completeness for the time given, and code quality. ${base}`
    : `You score technical interview answers on a 0-10 scale. Consider that this was a timed question with ${timeConstraints[question.level]} to answer. Score based on accuracy, completeness for the time given, and clarity. ${base} ${question.level === 'easy' ? easyClause : ''}` }
    
  const usr = { role: 'user', content: question.kind === 'code'
    ? `Problem (difficulty: ${question.level}, time limit: ${timeConstraints[question.level]}): ${question.text}\nCandidate Code (JavaScript):\n\n${answer || ''}\n\nEvaluate considering the time constraint. ${question.level === 'easy' ? easyClause : ''}`
    : `Question (difficulty: ${question.level}, time limit: ${timeConstraints[question.level]}): ${question.text}\nAnswer: ${answer || ''}\n\nEvaluate considering the time constraint. ${question.level === 'easy' ? easyClause : ''}` }
  
  // Determine which API caller to use
  const caller = apiCaller || (hasAzureOpenAI() ? callAzureOpenAI : callOpenRouter)
  
  try {
    const content = await caller([sys, usr])
    const first = content.indexOf('{')
    const last = content.lastIndexOf('}')
    const jsonStr = first >= 0 ? content.slice(first, last + 1) : content
    const obj = JSON.parse(jsonStr)
    let score = Math.max(0, Math.min(10, Math.round(Number(obj.score))))
    if (!answer || !String(answer).trim()) score = 0
    if (Number.isNaN(score)) score = 0
    const feedback = typeof obj.feedback === 'string' ? obj.feedback : '—'
    return { score, feedback }
  } catch (e) {
    console.warn('AI scoring failed, using local heuristic:', e)
    return evaluateAnswerLocal(question, answer)
  }
}

export const scoreAnswer = async (question, answer) => {
  if (!answer || !String(answer).trim()) return { score: 0, feedback: 'No answer provided.' }
  
  // Priority: Azure OpenAI > OpenRouter > Local
  if (hasAzureOpenAI()) {
    try {
      console.log('🔵 Using Azure OpenAI for scoring')
      return await evaluateAnswerAI(question, answer, callAzureOpenAI)
    } catch (e) {
      console.warn('Azure OpenAI scoring failed, trying OpenRouter:', e)
    }
  }
  
  if (getOpenRouterApiKey()) {
    try {
      console.log('🟡 Using OpenRouter for scoring')
      return await evaluateAnswerAI(question, answer, callOpenRouter)
    } catch (e) {
      console.warn('OpenRouter scoring failed, using local:', e)
    }
  }
  
  console.log('⚪ Using local scoring')
  return evaluateAnswerLocal(question, answer)
}

export function summarizeCandidateLocal(profile, qa, totalScore) {
  const strengths = []
  if (qa.some((x) => x.level === 'easy' && x.score >= 7)) strengths.push('strong fundamentals')
  if (qa.some((x) => x.level === 'medium' && x.score >= 7)) strengths.push('solid practical knowledge')
  if (qa.some((x) => x.level === 'hard' && x.score >= 7)) strengths.push('good system design and scalability awareness')
  const summary = `Candidate ${profile.name || 'N/A'} shows ${strengths.join(', ') || 'developing skills'}. Final score: ${totalScore}/60.`
  return summary
}

export async function summarizeCandidateAI(profile, qa, totalScore) {
  const sys = { role: 'system', content: 'Summarize a candidate succinctly for a tech interview. 2-3 sentences. No markdown.' }
  const usr = { role: 'user', content: `Profile: ${JSON.stringify(profile)}\nScore: ${totalScore}/60\nQ&A: ${JSON.stringify(qa.map(({level,text,answer,score})=>({level,text,answer,score})))}` }
  try {
    const content = await callOpenRouter([sys, usr])
    return content.trim()
  } catch (e) {
    console.warn('AI summary failed, using local summary:', e)
    return summarizeCandidateLocal(profile, qa, totalScore)
  }
}

export const summarizeCandidateSmart = async (profile, qa, totalScore) => {
  if (getOpenRouterApiKey()) return await summarizeCandidateAI(profile, qa, totalScore)
  return summarizeCandidateLocal(profile, qa, totalScore)
}
