# Team Task Manager

Team Task Manager is a full-stack, production-ready web application designed for agile teams to organize projects, assign tasks, and track progress using a Kanban-style interface. It enforces strict Role-Based Access Control (RBAC) to ensure data security and proper workflow management.

## Tech Stack

- **Frontend:** React 19, Vite, React Router
- **Styling:** Tailwind CSS (v4), Lucide React Icons
- **Backend & Database:** Supabase (PostgreSQL, Auth, Row Level Security)
- **Deployment:** Railway

## Architecture

The application uses a modern decoupled architecture:
1. **React SPA:** A lightweight single-page application built with Vite handles all user interactions, routing, and UI rendering.
2. **Supabase Backend:** Provides a fully managed PostgreSQL database, Email/Password Authentication, and secure API endpoints.
3. **API Service Layer:** All database queries and Supabase SDK calls are centralized in `src/services/api.js` to keep UI components clean and focused strictly on presentation.

## Database Schema

The PostgreSQL database consists of four primary tables:

- **`profiles`**: Extends the default Supabase `auth.users` table. Contains the user's `email` and their `role` (`admin` or `member`). Automatically populated via a database trigger upon user registration.
- **`projects`**: Represents a team project. Contains a `name`, `description`, and is linked to the `profiles` table via `created_by`.
- **`project_members`**: A junction table that links users (`profiles`) to `projects`, defining who belongs to which project.
- **`tasks`**: Represents an individual piece of work. Contains `title`, `description`, `status` (todo, in-progress, done), `due_date`, and links to a `project` and an assigned `profile`.

## Role-Based Access Control (RBAC)

Security is enforced at the database level using Supabase's **Row Level Security (RLS)** policies. This guarantees data security regardless of frontend manipulations.

### Roles
- **Admin:** Can create/edit projects, add members to projects, create/edit tasks, and assign tasks to members of that specific project.
- **Member:** Can view projects they are a part of, view teammates in those projects, and ONLY update the status of tasks assigned specifically to them.

### Auto-Admin Behavior
When you register users, the **very first user** to sign up is automatically assigned the `admin` role. All subsequent users are automatically assigned the `member` role. This enables smooth onboarding without requiring manual SQL commands.

## Setup Instructions

### 1. Supabase Setup
1. Create a new project on [Supabase](https://supabase.com).
2. Navigate to the **SQL Editor** in your Supabase dashboard.
3. Copy the contents of `supabase/schema.sql` and run it. This will create all tables, policies, and triggers.

### 2. Local Environment Setup
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
4. Fill in your Supabase credentials in `.env`:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

## Deployment (Railway)

This project is configured for deployment on [Railway](https://railway.app).

1. Connect your GitHub repository to a new Railway project.
2. Railway will automatically detect the `railway.json` configuration file.
3. In your Railway project settings, navigate to the **Variables** tab.
4. Add your environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Railway will automatically build the React app (`npm run build`) and serve the application using Vite's preview command bound to the correct port.
