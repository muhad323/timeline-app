"use client"

import { useState, useEffect } from "react"
import { LoginPage } from "@/components/login-page"
import { RegisterPage } from "@/components/register-page"
import { Dashboard } from "@/components/dashboard"
import { ProjectTimeline } from "@/components/project-timeline"
import type { ProjectData } from "@/components/project-timeline"
import { api } from "@/lib/api"

type ViewState = "login" | "register" | "dashboard" | "project-detail"

export default function Page() {
  const [view, setView] = useState<ViewState>("login")
  const [user, setUser] = useState<string | null>(null)
  const [projects, setProjects] = useState<ProjectData[]>([])
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load from localStorage and API on mount
  useEffect(() => {
    const init = async () => {
      const savedUser = localStorage.getItem("timeline_user")
      const token = api.getToken()

      if (savedUser && token) {
        setUser(savedUser)
        setView("dashboard")
        try {
          await fetchProjects()
        } catch (e) {
          console.error("Session expired or API error", e)
          handleLogout()
        }
      }
      setIsLoading(false)
    }
    init()
  }, [])

  const fetchProjects = async () => {
    try {
      const data = await api.projects.getAll()
      // MongoDB stores id as _id, let's map it for the frontend
      const formatted = data.map((p: any) => ({
        ...p,
        id: p._id,
        name: p.name || "",
        client: p.client || "",
        scale: p.scale || "",
        startDate: new Date(p.startDate),
        tasks: p.tasks || [],
        milestones: p.milestones || [],
        holidays: p.holidays || []
      }))
      setProjects(formatted)
    } catch (e) {
      console.error("Failed to fetch projects", e)
      throw e
    }
  }

  const handleLogin = (username: string, token: string) => {
    setUser(username)
    localStorage.setItem("timeline_user", username)
    api.setToken(token)
    setView("dashboard")
    fetchProjects()
  }

  const handleRegister = (username: string, token: string) => {
    setUser(username)
    localStorage.setItem("timeline_user", username)
    api.setToken(token)
    setView("dashboard")
    // Initially no projects for new user
    setProjects([])
  }

  const handleLogout = () => {
    setUser(null)
    api.removeToken()
    setView("login")
    setProjects([])
  }

  const handleSelectProject = (project: ProjectData) => {
    setSelectedProject(project)
    setView("project-detail")
  }

  const handleCreateProject = async (project: ProjectData) => {
    try {
      const saved = await api.projects.create(project);
      const formatted = {
        ...saved,
        id: saved._id,
        startDate: new Date(saved.startDate)
      };
      setProjects([formatted, ...projects])
    } catch (e) {
      console.error("Failed to create project", e)
    }
  }

  const handleUpdateProject = async (updatedProject: ProjectData) => {
    try {
      // Use the database _id (mapped to id in frontend)
      const saved = await api.projects.update(updatedProject.id, updatedProject);
      const formatted = {
        ...saved,
        id: saved._id,
        startDate: new Date(saved.startDate)
      };

      const newProjects = projects.map((p) =>
        p.id === formatted.id ? formatted : p
      )
      setProjects(newProjects)
      setSelectedProject(formatted)
    } catch (e) {
      console.error("Failed to update project", e)
    }
  }

  const handleBackToDashboard = () => {
    setSelectedProject(null)
    setView("dashboard")
    fetchProjects() // Refresh projects list
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (view === "login") {
    return (
      <LoginPage
        onLogin={(username, token) => handleLogin(username, token)}
        onRegister={() => setView("register")}
      />
    )
  }

  if (view === "register") {
    return (
      <RegisterPage
        onRegister={(username, token) => handleRegister(username, token)}
        onBackToLogin={() => setView("login")}
      />
    )
  }

  if (view === "dashboard" && user) {
    return (
      <Dashboard
        username={user}
        projects={projects}
        onSelectProject={handleSelectProject}
        onCreateProject={handleCreateProject}
        onLogout={handleLogout}
      />
    )
  }

  if (view === "project-detail" && selectedProject) {
    return (
      <ProjectTimeline
        initialProject={selectedProject}
        onBack={handleBackToDashboard}
        onUpdateProject={handleUpdateProject}
      />
    )
  }

  return null
}
