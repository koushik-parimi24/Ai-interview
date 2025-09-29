import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist'
import mammoth from 'mammoth'

// Configure PDF.js worker for Vite
try {
  const workerUrl = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url)
  GlobalWorkerOptions.workerSrc = workerUrl.toString()
} catch (e) {
  // ignore
}

const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
const phoneRegex = /(\+\d{1,3}[- ]?)?\d{10,}/

function extractName(lines) {
  for (const line of lines) {
    const t = line.trim()
    if (!t) continue
    if (emailRegex.test(t) || phoneRegex.test(t)) continue
    if (t.split(/\s+/).length <= 5) return t
  }
  return ''
}

export async function parsePDF(file) {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await getDocument({ data: arrayBuffer }).promise
  let text = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    text += content.items.map((it) => it.str).join('\n') + '\n'
  }
  return extractFields(text)
}

export async function parseDOCX(file) {
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  const text = result.value || ''
  return extractFields(text)
}

function extractFields(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  const emailMatch = text.match(emailRegex)
  const phoneMatch = text.match(phoneRegex)
  const name = extractName(lines)
  return {
    name: name || '',
    email: emailMatch ? emailMatch[0] : '',
    phone: phoneMatch ? phoneMatch[0] : '',
    rawText: text,
  }
}
