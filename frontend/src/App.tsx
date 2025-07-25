import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Game from '@/pages/Game'
import AuthProvider from './providers/AuthProvider'
import ConnectionProvider from './providers/ConnectionProvider'
import './index.css'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ConnectionProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Game />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ConnectionProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App