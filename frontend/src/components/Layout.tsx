import type { ReactNode } from 'react'
import Sidebar from './Sidebar'

interface Props {
  children: ReactNode
}

const Layout = ({ children }: Props) => {
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: '#f5f6fa',
    }}>
      <Sidebar />
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
      }}>
        {children}
      </div>
    </div>
  )
}

export default Layout