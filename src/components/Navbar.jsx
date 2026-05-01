import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/supabase'
import { LayoutDashboard, FolderKanban, CheckSquare, LogOut } from 'lucide-react'

export default function Navbar() {
  const { profile, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const navLinks = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={18} /> },
    { name: 'Projects', path: '/projects', icon: <FolderKanban size={18} /> },
    { name: 'Tasks', path: '/tasks', icon: <CheckSquare size={18} /> },
  ]

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <div className="text-xl font-bold text-blue-600 flex items-center gap-2">
                <CheckSquare className="h-6 w-6 text-blue-600" />
                <span>Taskify</span>
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`${
                    location.pathname === link.path
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center gap-2 px-1 pt-1 border-b-2 text-sm font-medium transition-colors`}
                >
                  {link.icon}
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center gap-4">
            <div className="text-sm text-gray-600">
              {profile?.email || user?.email} 
              {profile && (
                <span className="px-2 py-1 ml-2 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold capitalize">
                  {profile.role}
                </span>
              )}
              {!profile && (
                <span className="px-2 py-1 ml-2 rounded-full bg-red-100 text-red-800 text-xs font-semibold" title="Run schema.sql in Supabase">
                  Missing Profile Data
                </span>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu could be added here for production */}
    </nav>
  )
}
