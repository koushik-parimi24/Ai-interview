import { Layout, Typography } from 'antd'

const { Footer: AntFooter } = Layout
const { Text } = Typography

export default function Footer() {
  return (
    <AntFooter style={{ background: 'transparent', textAlign: 'center', color: 'rgba(255,255,255,0.65)' }}>
      <Text type="secondary">© {new Date().getFullYear()} AI Interview Assistant • Built with React, Ant Design, and OpenRouter</Text>
    </AntFooter>
  )
}