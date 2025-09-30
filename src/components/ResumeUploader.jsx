import { Upload, message, Typography } from 'antd'
import { InboxOutlined } from '@ant-design/icons'
import { parsePDF, parseDOCX } from '../utils/resumeParser'
import { supabase } from '../lib/supabaseClient'
import { uploadResumeFile } from '../services/storage'

const { Dragger } = Upload
const { Text } = Typography

export default function ResumeUploader({ onParsed }) {
  const props = {
    name: 'file',
    multiple: false,
    accept: '.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    customRequest: async ({ file, onSuccess, onError }) => {
      try {
        let data
        const isPDF = file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf')
        const isDOCX = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name?.toLowerCase().endsWith('.docx')
        if (isPDF) {
          data = await parsePDF(file)
        } else if (isDOCX) {
          data = await parseDOCX(file)
        } else {
          message.error('Unsupported file type. Please upload PDF or DOCX.')
          onError?.(new Error('Unsupported file'))
          return
        }

        // Attempt upload to Supabase Storage (bucket: resumes). If bucket not present or RLS blocks, fall back gracefully.
        let resumePath = null
        try {
          const { data: userData } = await supabase.auth.getUser()
          const uid = userData?.user?.id
          if (!uid) throw new Error('Not authenticated')
          const out = await uploadResumeFile(file, uid, file.name)
          resumePath = out.path
        } catch (e) {
          console.warn('Resume upload skipped/failure:', e?.message || e)
          message.warning('Resume file not stored (storage not configured). Parsed details will still be used.')
        }

        onParsed?.({ ...data, filename: file.name, mimeType: file.type, resumePath })
        message.success('Resume parsed successfully')
        onSuccess?.({}, file)
      } catch (e) {
        console.error(e)
        message.error('Failed to parse resume')
        onError?.(e)
      }
    },
    showUploadList: false,
  }

  return (
    <Dragger {...props} className="fade-in" style={{ padding: 16 }}>
      <p className="ant-upload-drag-icon">
        <InboxOutlined />
      </p>
      <p className="ant-upload-text">Click or drag resume file to this area to upload</p>
      <p className="ant-upload-hint">
        Supported: PDF (required) and DOCX (optional). We will extract Name, Email, Phone.
      </p>
      <Text type="secondary">If storage is configured, the file is uploaded securely to Supabase.</Text>
    </Dragger>
  )
}
