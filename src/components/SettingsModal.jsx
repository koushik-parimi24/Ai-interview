import { Modal, Form, Input, Select, message } from 'antd'
import { useEffect } from 'react'

export default function SettingsModal({ open, onClose }) {
  const [form] = Form.useForm()

  useEffect(() => {
    if (open) {
      const apiKey = localStorage.getItem('openrouter_api_key') || ''
      const model = localStorage.getItem('openrouter_model') || ''
      form.setFieldsValue({ apiKey, model })
    }
  }, [open])

  const onSave = async () => {
    const { apiKey, model } = await form.validateFields()
    if (!apiKey) {
      message.error('Please enter your OpenRouter API key')
      return
    }
    localStorage.setItem('openrouter_api_key', apiKey)
    if (model) localStorage.setItem('openrouter_model', model)
    message.success('Saved. New calls will use the provided key/model.')
    onClose?.()
  }

  return (
    <Modal title="Settings" open={open} onOk={onSave} onCancel={onClose} okText="Save" maskClosable={false}>
      <Form layout="vertical" form={form}>
        <Form.Item label="OpenRouter API Key" name="apiKey" rules={[{ required: true }]}>
          <Input.Password placeholder="sk-or-..." autoComplete="off" />
        </Form.Item>
        <Form.Item label="Model (optional)" name="model" extra="e.g., meta-llama/llama-3.1-8b-instruct:free">
          <Input placeholder="openrouter/auto" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
