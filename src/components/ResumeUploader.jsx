import { Upload, message, Typography } from 'antd'
import { InboxOutlined } from '@ant-design/icons'
import { parsePDF, parseDOCX } from '../utils/resumeParser'

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
        if (file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf')) {
          data = await parsePDF(file)
        } else if (
          file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          file.name?.toLowerCase().endsWith('.docx')
        ) {
          data = await parseDOCX(file)
        } else {
          message.error('Unsupported file type. Please upload PDF or DOCX.')
          onError?.(new Error('Unsupported file'))
          return
        }
        onParsed?.({ ...data, filename: file.name })
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
      <Text type="secondary">We only process the file locally in your browser.</Text>
    </Dragger>
  )
}
