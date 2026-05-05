import type { ReactNode } from 'react'
import Sidebar from './Sidebar'
import ChatBot from './ChatBot'

interface Props {
  children: ReactNode
}

const Layout = ({ children }: Props) => {
  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #f4f7fb 0%, #edf2f8 100%)',
      }}
    >
      <Sidebar />
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto',
        }}
      >
        {children}
      </div>
      <ChatBot />
    </div>
  )
}

export default Layout