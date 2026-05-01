import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { fetchProjects, fetchAllUsers, createProject, addProjectMember, removeProjectMember } from '../services/api'
import { Plus, Users, FolderKanban, X } from 'lucide-react'

export default function Projects() {
  const { profile } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isCreating, setIsCreating] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDescription, setNewProjectDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [allUsers, setAllUsers] = useState([]) // For admin to add members

  const loadProjects = async () => {
    try {
      setLoading(true)
      const data = await fetchProjects()
      setProjects(data || [])
    } catch (err) {
      setError("Failed to load projects: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const data = await fetchAllUsers()
      setAllUsers(data || [])
    } catch (err) {
      console.error("Failed to load users:", err.message)
    }
  }

  useEffect(() => {
    loadProjects()
    if (profile?.role === 'admin') {
      loadUsers()
    }
  }, [profile])

  const handleCreateProject = async (e) => {
    e.preventDefault()
    setError(null)
    
    if (!newProjectName.trim()) {
      return setError("Project name is required")
    }

    try {
      setIsSubmitting(true)
      await createProject(newProjectName.trim(), newProjectDescription.trim(), profile.id)
      setNewProjectName('')
      setNewProjectDescription('')
      setIsCreating(false)
      loadProjects()
    } catch (err) {
      setError("Error creating project: " + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddMember = async (projectId, userId) => {
    try {
      await addProjectMember(projectId, userId)
      loadProjects()
    } catch (err) {
      if (err.code === '23505') {
        alert("User is already a member of this project")
      } else {
        alert("Error adding member: " + err.message)
      }
    }
  }

  const handleRemoveMember = async (projectId, userId) => {
    if (!window.confirm("Are you sure you want to remove this member?")) return
    try {
      await removeProjectMember(projectId, userId)
      loadProjects()
    } catch (err) {
      alert("Error removing member: " + err.message)
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Loading projects...</div>

  const isAdmin = profile?.role === 'admin'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FolderKanban className="text-blue-500" />
            Projects
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {isAdmin ? 'Manage all your team projects here.' : 'Projects you are a member of.'}
          </p>
        </div>
        {isAdmin && (
          <div className="mt-4 sm:mt-0">
            <button
              onClick={() => setIsCreating(!isCreating)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="-ml-1 mr-2 h-5 w-5" />
              New Project
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {isCreating && isAdmin && (
        <div className="bg-white shadow rounded-lg p-6 mb-8 border border-blue-100">
          <form onSubmit={handleCreateProject} className="flex flex-col gap-4 max-w-lg">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Project Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="name"
                id="name"
                required
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="mt-1 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                placeholder="Enter project name..."
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                name="description"
                id="description"
                rows={3}
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                className="mt-1 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                placeholder="Optional description..."
                disabled={isSubmitting}
              />
            </div>
            <div className="flex justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 sm:text-sm"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none sm:text-sm disabled:bg-blue-300"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Project'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projects.length === 0 ? (
          <div className="col-span-full bg-white p-8 rounded-lg shadow text-center text-gray-500">
            No projects found.
          </div>
        ) : (
          projects.map((project) => (
            <div key={project.id} className="bg-white overflow-hidden shadow rounded-lg flex flex-col border border-gray-200">
              <div className="px-4 py-5 sm:p-6 flex-grow">
                <h3 className="text-lg font-medium text-gray-900 truncate" title={project.name}>{project.name}</h3>
                {project.description && (
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2" title={project.description}>{project.description}</p>
                )}
                
                <div className="mt-4">
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <Users className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                    Members ({project.project_members?.length || 0})
                  </div>
                  <ul className="mt-2 text-sm text-gray-600 space-y-1 max-h-32 overflow-y-auto pr-2">
                    {project.project_members?.map((member) => (
                      <li key={member.user_id} className="flex justify-between items-center bg-gray-50 px-2 py-1 rounded">
                        <span className="truncate">{member.profiles?.email}</span>
                        {isAdmin && (
                          <button 
                            onClick={() => handleRemoveMember(project.id, member.user_id)}
                            className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors"
                            title="Remove member"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </li>
                    ))}
                    {(!project.project_members || project.project_members.length === 0) && (
                      <li className="text-gray-400 italic px-2 py-1">No members yet</li>
                    )}
                  </ul>
                </div>
              </div>
              
              {isAdmin && (
                <div className="bg-gray-50 px-4 py-4 sm:px-6 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <select 
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border bg-white"
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAddMember(project.id, e.target.value);
                          e.target.value = ""; // reset
                        }
                      }}
                      defaultValue=""
                    >
                      <option value="" disabled>Add member...</option>
                      {allUsers.map(u => (
                        <option key={u.id} value={u.id}>{u.email}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
