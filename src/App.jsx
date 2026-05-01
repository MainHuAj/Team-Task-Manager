import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import Navbar from './components/Navbar'

// Pages
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import Tasks from './pages/Tasks'

const Layout = () => (
  <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
    <Navbar />
    <main className="h-[calc(100vh-64px)] overflow-y-auto">
      <Outlet />
    </main>
  </div>
)

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/tasks" element={<Tasks />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App
