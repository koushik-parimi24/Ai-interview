import { Modal } from 'antd'

export default function WelcomeBackModal({ open, onResume, onStartOver }) {
  return (
    <Modal
      title="Welcome Back"
      open={open}
      onOk={onResume}
      onCancel={onStartOver}
      okText="Resume"
      cancelText="Start Over"
      maskClosable={false}
    >
      We found an unfinished interview session. Would you like to resume where you left off?
    </Modal>
  )
}
