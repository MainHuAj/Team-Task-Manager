-- 1. Create Tables First
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member'))
);

CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  UNIQUE(user_id, project_id)
);

CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in-progress', 'done')),
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 3. Create Policies

-- Function to check if current user is admin (bypasses RLS to avoid infinite recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to check if current user is a member of a project (bypasses RLS to avoid infinite recursion)
CREATE OR REPLACE FUNCTION public.is_project_member(check_project_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.project_members pm 
    WHERE pm.project_id = check_project_id AND pm.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Profiles policies
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view own profile or admins view all" ON public.profiles;
CREATE POLICY "Users can view own profile or admins view all"
ON public.profiles FOR SELECT
USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- Projects policies
DROP POLICY IF EXISTS "Admins can create projects" ON public.projects;
CREATE POLICY "Admins can create projects"
ON public.projects FOR INSERT
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update projects" ON public.projects;
CREATE POLICY "Admins can update projects"
ON public.projects FOR UPDATE
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete projects" ON public.projects;
CREATE POLICY "Admins can delete projects"
ON public.projects FOR DELETE
USING (public.is_admin());

DROP POLICY IF EXISTS "Users can view related projects" ON public.projects;
CREATE POLICY "Users can view related projects"
ON public.projects FOR SELECT
USING (
  created_by = auth.uid() OR 
  public.is_project_member(id) OR
  public.is_admin()
);

-- Project Members policies
DROP POLICY IF EXISTS "Admins can insert members" ON public.project_members;
CREATE POLICY "Admins can insert members"
ON public.project_members FOR INSERT
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete members" ON public.project_members;
CREATE POLICY "Admins can delete members"
ON public.project_members FOR DELETE
USING (public.is_admin());

DROP POLICY IF EXISTS "Users can view members" ON public.project_members;
CREATE POLICY "Users can view members"
ON public.project_members FOR SELECT
USING (
  user_id = auth.uid() OR
  public.is_admin() OR
  public.is_project_member(project_id)
);

-- Tasks policies
DROP POLICY IF EXISTS "Admins can create tasks" ON public.tasks;
CREATE POLICY "Admins can create tasks"
ON public.tasks FOR INSERT
WITH CHECK (
  public.is_admin() AND
  EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = project_id AND pm.user_id = assigned_to
  )
);

DROP POLICY IF EXISTS "Users can view tasks" ON public.tasks;
CREATE POLICY "Users can view tasks"
ON public.tasks FOR SELECT
USING (
  assigned_to = auth.uid() OR
  public.is_admin() OR
  public.is_project_member(project_id)
);

DROP POLICY IF EXISTS "Users can update own tasks or admins update any" ON public.tasks;
CREATE POLICY "Users can update own tasks or admins update any"
ON public.tasks FOR UPDATE
USING (
  assigned_to = auth.uid() OR
  public.is_admin()
)
WITH CHECK (
  assigned_to = auth.uid() OR
  public.is_admin()
);

DROP POLICY IF EXISTS "Admins can delete tasks" ON public.tasks;
CREATE POLICY "Admins can delete tasks"
ON public.tasks FOR DELETE
USING (public.is_admin());

-- 4. Create Triggers

-- Function to handle new user profile creation automatically
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  is_first_user BOOLEAN;
BEGIN
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles LIMIT 1) INTO is_first_user;

  INSERT INTO public.profiles (id, email, role)
  VALUES (
    new.id, 
    new.email, 
    CASE WHEN is_first_user THEN 'admin' ELSE 'member' END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on auth.users insert
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
