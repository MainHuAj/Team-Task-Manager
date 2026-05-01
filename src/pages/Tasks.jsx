import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { fetchTasks, fetchProjectOptions, fetchProjectMembers, createTask, updateTaskStatus, updateTask, deleteTask } from '../services/api'
import { Plus, Calendar, User, Tag, Edit2, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

const TaskCard = ({ task, onUpdateStatus, onEdit, onDelete, isMember, isAdmin }) => (
  <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-4 mb-4 hover:shadow-md transition-shadow">
    <h4 className="font-semibold text-gray-900 mb-1">{task.title}</h4>
    {task.description && <p className="text-sm text-gray-500 mb-3 line-clamp-2">{task.description}</p>}
    
    <div className="space-y-2 mt-3 pt-3 border-t border-gray-100">
      <div className="flex items-center text-xs text-gray-500">
        <Tag className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
        <span className="truncate">{task.projects?.name}</span>
      </div>
      
      <div className="flex items-center text-xs text-gray-500">
        <User className="w-3.5 h-3.5 mr-1.5 text-green-500" />
        <span className="truncate">{task.profiles?.email || 'Unassigned'}</span>
      </div>

      {task.due_date && (
        <div className="flex items-center text-xs text-gray-500">
          <Calendar className="w-3.5 h-3.5 mr-1.5 text-orange-500" />
          <span>{format(new Date(task.due_date), 'MMM d, yyyy')}</span>
        </div>
      )}
    </div>

    <div className="mt-4 flex justify-between items-center">
      <select
        value={task.status}
        onChange={(e) => onUpdateStatus(task.id, e.target.value)}
        disabled={!isMember}
        className={`text-xs font-semibold rounded-full px-2.5 py-1 border-0 ring-1 ring-inset ${
          !isMember ? 'opacity-70 cursor-not-allowed ' : ''
        }${
          task.status === 'todo' ? 'bg-gray-50 text-gray-700 ring-gray-300 focus:ring-gray-500' :
          task.status === 'in-progress' ? 'bg-blue-50 text-blue-700 ring-blue-300 focus:ring-blue-500' :
          'bg-green-50 text-green-700 ring-green-300 focus:ring-green-500'
        }`}
      >
        <option value="todo">To Do</option>
        <option value="in-progress">In Progress</option>
        <option value="done">Done</option>
      </select>

      {isAdmin && (
        <div className="flex gap-2">
          <button 
            onClick={() => onEdit(task)} 
            className="text-gray-400 hover:text-blue-500 p-1 rounded hover:bg-blue-50 transition-colors"
            title="Edit Task"
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={() => onDelete(task.id)} 
            className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors"
            title="Delete Task"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </div>
  </div>
)

const ColumnHeader = ({ title, count, bgColor }) => (
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">{title}</h3>
    <span className={`${bgColor} text-xs font-medium px-2.5 py-0.5 rounded-full`}>{count}</span>
  </div>
)

export default function Tasks() {
  const { profile } = useAuth()
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [projectMembers, setProjectMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const defaultFormState = {
    title: '',
    description: '',
    status: 'todo',
    project_id: '',
    assigned_to: '',
    due_date: ''
  }
  
  const [formData, setFormData] = useState(defaultFormState)

  // Filters
  const [statusFilter, setStatusFilter] = useState('all')

  const loadTasks = async () => {
    try {
      setLoading(true)
      const data = await fetchTasks()
      setTasks(data || [])
    } catch (err) {
      setError("Failed to load tasks. " + err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadProjects = async () => {
    try {
      const data = await fetchProjectOptions()
      setProjects(data || [])
    } catch (err) {
      console.error("Failed to load projects:", err.message)
    }
  }

  const loadProjectMembers = async (projectId) => {
    if (!projectId) {
      setProjectMembers([])
      return
    }
    try {
      const data = await fetchProjectMembers(projectId)
      setProjectMembers(data || [])
    } catch (err) {
      console.error("Failed to load members:", err.message)
    }
  }

  useEffect(() => {
    loadTasks()
    if (profile?.role === 'admin') {
      loadProjects()
    }
  }, [profile])

  // When project selection changes, load its members
  useEffect(() => {
    if (formData.project_id) {
      loadProjectMembers(formData.project_id)
    } else {
      setProjectMembers([])
    }
  }, [formData.project_id])

  const handleOpenCreate = () => {
    setEditingTaskId(null)
    setFormData(defaultFormState)
    setIsFormOpen(true)
    setError(null)
  }

  const handleOpenEdit = (task) => {
    setEditingTaskId(task.id)
    setFormData({
      title: task.title,
      description: task.description || '',
      status: task.status,
      project_id: task.project_id,
      assigned_to: task.assigned_to || '',
      due_date: task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : ''
    })
    setIsFormOpen(true)
    setError(null)
  }

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return
    try {
      await deleteTask(taskId)
      loadTasks()
    } catch (err) {
      alert("Error deleting task: " + err.message)
    }
  }

  const handleSaveTask = async (e) => {
    e.preventDefault()
    setError(null)
    
    // Validation
    if (!formData.title.trim()) return setError("Task title is required")
    if (!formData.project_id) return setError("Project is required")
    if (!formData.assigned_to) return setError("Assignee is required")
    
    if (formData.due_date && new Date(formData.due_date) < new Date()) {
      // If editing, allow past dates if they haven't changed, but simpler to just enforce on create or warn
      // For simplicity, skip past date validation if editing, or just let it pass
      if (!editingTaskId) {
        return setError("Due date cannot be in the past")
      }
    }
    
    try {
      setIsSubmitting(true)
      const payload = { ...formData }
      if (!payload.due_date) delete payload.due_date
      
      if (editingTaskId) {
        await updateTask(editingTaskId, payload)
      } else {
        await createTask(payload)
      }
      
      setIsFormOpen(false)
      setFormData(defaultFormState)
      setEditingTaskId(null)
      loadTasks()
    } catch (err) {
      setError("Error saving task: " + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      await updateTaskStatus(taskId, newStatus)
      // Update local state
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
    } catch (err) {
      alert("Error updating task: " + err.message)
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Loading tasks...</div>

  const isAdmin = profile?.role === 'admin'
  const filteredTasks = statusFilter === 'all' ? tasks : tasks.filter(t => t.status === statusFilter)

  const todoTasks = filteredTasks.filter(t => t.status === 'todo')
  const inProgressTasks = filteredTasks.filter(t => t.status === 'in-progress')
  const doneTasks = filteredTasks.filter(t => t.status === 'done')

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="mt-1 text-sm text-gray-500">Manage and track task progress.</p>
        </div>
        
        <div className="mt-4 flex sm:mt-0 gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </select>

          {isAdmin && (
            <button
              onClick={() => isFormOpen ? setIsFormOpen(false) : handleOpenCreate()}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="-ml-1 mr-2 h-5 w-5" />
              New Task
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {isFormOpen && isAdmin && (
        <div className="bg-white shadow rounded-lg p-6 mb-8 border border-blue-100">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {editingTaskId ? 'Edit Task' : 'Create New Task'}
          </h3>
          <form onSubmit={handleSaveTask} className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-8">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Title <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-2 px-3 border focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-2 px-3 border focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Project <span className="text-red-500">*</span></label>
              <select
                required
                value={formData.project_id}
                onChange={(e) => setFormData({...formData, project_id: e.target.value, assigned_to: ''})}
                className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-2 px-3 border bg-white focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="" disabled>Select a project</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Assign To <span className="text-red-500">*</span></label>
              <select
                required
                value={formData.assigned_to}
                onChange={(e) => setFormData({...formData, assigned_to: e.target.value})}
                disabled={!formData.project_id}
                className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-2 px-3 border bg-white focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="" disabled>
                  {!formData.project_id ? 'Select a project first' : 'Select a team member'}
                </option>
                {projectMembers.map(m => (
                  <option key={m.user_id} value={m.user_id}>{m.profiles?.email}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Due Date</label>
              <input
                type="datetime-local"
                value={formData.due_date}
                onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md py-2 px-3 border focus:ring-blue-500 focus:border-blue-500"
                disabled={isSubmitting}
              />
            </div>

            <div className="sm:col-span-2 flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(false)
                  setEditingTaskId(null)
                  setFormData(defaultFormState)
                }}
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none disabled:opacity-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:bg-blue-300"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : (editingTaskId ? 'Save Changes' : 'Create Task')}
              </button>
            </div>
          </form>
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks</h3>
          <p className="mt-1 text-sm text-gray-500">
            {isAdmin ? 'Get started by creating a new task.' : 'You have no visible tasks.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 bg-gray-50/50 rounded-xl p-4 min-h-[500px]">
            <ColumnHeader title="To Do" count={todoTasks.length} bgColor="bg-gray-200 text-gray-800" />
            <div className="space-y-4">
              {todoTasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onUpdateStatus={handleUpdateStatus} 
                  onEdit={handleOpenEdit}
                  onDelete={handleDeleteTask}
                  isMember={isAdmin || task.assigned_to === profile?.id}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          </div>
          
          <div className="flex-1 bg-blue-50/30 rounded-xl p-4 min-h-[500px]">
            <ColumnHeader title="In Progress" count={inProgressTasks.length} bgColor="bg-blue-100 text-blue-800" />
            <div className="space-y-4">
              {inProgressTasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onUpdateStatus={handleUpdateStatus} 
                  onEdit={handleOpenEdit}
                  onDelete={handleDeleteTask}
                  isMember={isAdmin || task.assigned_to === profile?.id}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          </div>
          
          <div className="flex-1 bg-green-50/30 rounded-xl p-4 min-h-[500px]">
            <ColumnHeader title="Done" count={doneTasks.length} bgColor="bg-green-100 text-green-800" />
            <div className="space-y-4">
              {doneTasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onUpdateStatus={handleUpdateStatus} 
                  onEdit={handleOpenEdit}
                  onDelete={handleDeleteTask}
                  isMember={isAdmin || task.assigned_to === profile?.id}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
