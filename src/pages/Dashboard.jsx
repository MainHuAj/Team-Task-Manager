import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { fetchDashboardTasks } from '../services/api'
import { CheckCircle, Clock, AlertCircle, ListTodo } from 'lucide-react'
import { format, isPast, isToday } from 'date-fns'

const StatCard = ({ title, value, icon: Icon, colorClass }) => (
  <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100">
    <div className="p-5">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <Icon className={`h-6 w-6 ${colorClass}`} aria-hidden="true" />
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900">{value}</div>
            </dd>
          </dl>
        </div>
      </div>
    </div>
  </div>
)

export default function Dashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({ total: 0, done: 0, pending: 0, overdue: 0 })
  const [recentTasks, setRecentTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const tasks = await fetchDashboardTasks()

      if (tasks) {
        const total = tasks.length
        const done = tasks.filter(t => t.status === 'done').length
        const pending = tasks.filter(t => t.status !== 'done').length
        const overdue = tasks.filter(t => {
          if (t.status === 'done' || !t.due_date) return false
          const dueDate = new Date(t.due_date)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          return dueDate < today
        }).length

        setStats({ total, done, pending, overdue })
        
        // Get 5 most pressing tasks (pending, ordered by due date)
        setRecentTasks(tasks.filter(t => t.status !== 'done').slice(0, 5))
      }
    } catch (err) {
      setError("Error fetching dashboard data: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [profile])

  const getStatusBadge = (status) => {
    switch (status) {
      case 'todo': return <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">To Do</span>
      case 'in-progress': return <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">In Progress</span>
      case 'done': return <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Done</span>
      default: return null
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back{profile?.email ? `, ${profile.email.split('@')[0]}` : ''}!
        </h1>
        <p className="mt-1 text-sm text-gray-500">Here's what's happening with your tasks today.</p>
        
        {error && (
          <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {!profile && (
          <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4 shadow-sm">
            <p className="text-sm text-red-700">
              <strong>Warning:</strong> Your user profile is missing from the database. 
              This happens if you signed up before running the <code>supabase/schema.sql</code> script. 
              Please execute the script in your Supabase SQL editor, then create a new account.
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard title="Total Tasks" value={stats.total} icon={ListTodo} colorClass="text-gray-400" />
        <StatCard title="Pending Tasks" value={stats.pending} icon={Clock} colorClass="text-blue-500" />
        <StatCard title="Completed" value={stats.done} icon={CheckCircle} colorClass="text-green-500" />
        <StatCard title="Overdue" value={stats.overdue} icon={AlertCircle} colorClass="text-red-500" />
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center bg-gray-50/50">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Pressing Tasks</h3>
        </div>
        
        {recentTasks.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <CheckCircle className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p>You're all caught up! No pending tasks.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {recentTasks.map((task) => (
              <li key={task.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <p className="text-sm font-medium text-blue-600 truncate">{task.title}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Project: {task.projects?.name || 'Unassigned'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    {getStatusBadge(task.status)}
                    {task.due_date && (
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <Clock size={14} className={new Date(task.due_date) < new Date(new Date().setHours(0,0,0,0)) ? "text-red-500" : ""} />
                        <span className={new Date(task.due_date) < new Date(new Date().setHours(0,0,0,0)) ? "text-red-500 font-medium" : ""}>
                          {format(new Date(task.due_date), 'MMM d')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
