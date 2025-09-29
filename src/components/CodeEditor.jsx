import { useRef, useState } from 'react'
import Editor from '@monaco-editor/react'
import { Button, Card, Space, Typography } from 'antd'

const { Text } = Typography

export default function CodeEditor({ language = 'javascript', value, onChange, onRun, output }) {
  const editorRef = useRef(null)
  const [mounted, setMounted] = useState(false)

  return (
    <Card className="glass-card" bodyStyle={{ padding: 8 }}>
      <div style={{ height: 'clamp(200px, 40vh, 360px)', borderRadius: 8, overflow: 'hidden' }}>
        <Editor
          height="100%"
          defaultLanguage={language}
          theme="vs-dark"
          value={value}
          onMount={(editor, monaco) => {
            editorRef.current = editor; setMounted(true)
            // Disable copy/paste via keyboard shortcuts
            editor.onKeyDown((e) => {
              const code = e.code || e.browserEvent?.code
              const ctrlOrMeta = e.ctrlKey || e.metaKey
              if (ctrlOrMeta && (code === 'KeyV' || code === 'KeyC' || code === 'KeyX')) {
                e.preventDefault()
              }
              // Shift+Insert paste
              if (e.shiftKey && code === 'Insert') {
                e.preventDefault()
              }
            })
          }}
          onChange={(v) => onChange?.(v || '')}
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            contextmenu: false,
          }}
        />
      </div>
      <Space style={{ marginTop: 8, justifyContent: 'space-between', width: '100%' }}>
        <Text type="secondary">Language: {language}</Text>
        <Button onClick={() => onRun?.(value)} type="primary">Run</Button>
      </Space>
      {output != null && (
        <Card size="small" style={{ marginTop: 8, maxHeight: 200, overflow: 'auto' }} className="glass-card">
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{String(output)}</pre>
        </Card>
      )}
    </Card>
  )
}