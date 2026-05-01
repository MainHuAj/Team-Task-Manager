import { supabase } from './supabase'

// Users & Profiles
export const fetchAllUsers = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, role')
    .order('email')
  if (error) throw error
  return data
}

// Projects
export const fetchProjects = async () => {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      project_members (
        user_id,
        profiles (email)
      )
    `)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export const fetchProjectOptions = async () => {
  const { data, error } = await supabase
    .from('projects')
    .select('id, name')
    .order('name')
  if (error) throw error
  return data
}

export const createProject = async (name, description, created_by) => {
  const { data, error } = await supabase
    .from('projects')
    .insert([{ name, description, created_by }])
  if (error) throw error
  return data
}

export const addProjectMember = async (project_id, user_id) => {
  const { data, error } = await supabase
    .from('project_members')
    .insert([{ project_id, user_id }])
  if (error) throw error
  return data
}

export const removeProjectMember = async (project_id, user_id) => {
  const { error } = await supabase
    .from('project_members')
    .delete()
    .eq('project_id', project_id)
    .eq('user_id', user_id)
  if (error) throw error
}

export const fetchProjectMembers = async (project_id) => {
  const { data, error } = await supabase
    .from('project_members')
    .select(`
      user_id,
      profiles (email)
    `)
    .eq('project_id', project_id)
  if (error) throw error
  return data
}

// Tasks
export const fetchTasks = async () => {
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      projects (name),
      profiles:assigned_to (email)
    `)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export const fetchDashboardTasks = async () => {
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      projects (name)
    `)
    .order('due_date', { ascending: true, nullsFirst: false })
  if (error) throw error
  return data
}

export const createTask = async (taskData) => {
  const { data, error } = await supabase
    .from('tasks')
    .insert([taskData])
  if (error) throw error
  return data
}

export const updateTask = async (taskId, taskData) => {
  const { data, error } = await supabase
    .from('tasks')
    .update(taskData)
    .eq('id', taskId)
  if (error) throw error
  return data
}

export const deleteTask = async (taskId) => {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
  if (error) throw error
}

export const updateTaskStatus = async (taskId, status) => {
  const { data, error } = await supabase
    .from('tasks')
    .update({ status })
    .eq('id', taskId)
  if (error) throw error
  return data
}
