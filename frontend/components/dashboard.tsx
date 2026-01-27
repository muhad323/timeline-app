"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Plus,
  Calendar,
  FolderOpen,
  Clock,
  CheckCircle2,
  Circle,
  LogOut,
  Search,
  LayoutGrid,
  List,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Task {
  id: string
  name: string
  status: "completed" | "in-progress" | "upcoming"
  markedDays: number[]
  color: string
  notes: string
  deadline?: number
}

interface Milestone {
  id: string
  label: string
  day: number
  type: "delivery" | "inspection" | "progress" | "completion"
}

interface ProjectData {
  id: string
  name: string
  client: string
  scale: string
  startDate: Date
  tasks: Task[]
  milestones: Milestone[]
  holidays: number[]
}

interface DashboardProps {
  username: string
  projects: ProjectData[]
  onSelectProject: (project: ProjectData) => void
  onCreateProject: (project: ProjectData) => void
  onLogout: () => void
}

const createDefaultProject = (): ProjectData => ({
  id: crypto.randomUUID(),
  name: "",
  client: "Private Client",
  scale: "",
  startDate: new Date(),
  tasks: [
    { id: "1", name: "Information Received", status: "upcoming", markedDays: [], color: "green", notes: "" },
    { id: "2", name: "Editing (Computer Works)", status: "upcoming", markedDays: [], color: "blue", notes: "" },
    { id: "3", name: "Laser Cutting & 3D Printing", status: "upcoming", markedDays: [], color: "yellow", notes: "" },
    { id: "4", name: "Fabrication & Assembly", status: "upcoming", markedDays: [], color: "orange", notes: "" },
    { id: "5", name: "Electrical", status: "upcoming", markedDays: [], color: "purple", notes: "" },
    { id: "6", name: "Landscaping", status: "upcoming", markedDays: [], color: "cyan", notes: "" },
    { id: "7", name: "Delivery & Shipping", status: "upcoming", markedDays: [], color: "red", notes: "" },
  ],
  milestones: [],
  holidays: [],
})

export function Dashboard({
  username,
  projects,
  onSelectProject,
  onCreateProject,
  onLogout,
}: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showNewProject, setShowNewProject] = useState(false)
  const [newProject, setNewProject] = useState<ProjectData>(createDefaultProject())

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.scale.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getProjectStatus = (project: ProjectData) => {
    const totalTasks = project.tasks.length
    const completedTasks = project.tasks.filter((t) => t.status === "completed").length
    const inProgressTasks = project.tasks.filter((t) => t.status === "in-progress").length

    if (completedTasks === totalTasks) return "completed"
    if (inProgressTasks > 0 || completedTasks > 0) return "in-progress"
    return "not-started"
  }

  const getCurrentTask = (project: ProjectData) => {
    const inProgressTask = project.tasks.find((t) => t.status === "in-progress")
    if (inProgressTask) return inProgressTask.name
    const upcomingTask = project.tasks.find((t) => t.status === "upcoming")
    if (upcomingTask) return upcomingTask.name
    return "All tasks completed"
  }

  const getProgressPercentage = (project: ProjectData) => {
    const totalTasks = project.tasks.length
    if (totalTasks === 0) return 0

    const completionWeight = project.tasks.reduce((acc, task) => {
      if (task.status === "completed") return acc + 1
      if (task.status === "in-progress") return acc + 0.5
      return acc
    }, 0)

    return Math.min(100, Math.round((completionWeight / totalTasks) * 100))
  }

  const getDaysElapsed = (startDate: Date) => {
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const diffTime = now.getTime() - start.getTime()
    return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  const handleCreateProject = () => {
    if (newProject.name.trim() && newProject.client.trim() && newProject.scale.trim()) {
      onCreateProject({ ...newProject, id: crypto.randomUUID() })
      setNewProject(createDefaultProject())
      setShowNewProject(false)
    }
  }

  const statusColors = {
    completed: "bg-emerald-500",
    "in-progress": "bg-amber-500",
    "not-started": "bg-muted",
  }

  const statusLabels = {
    completed: "Completed",
    "in-progress": "In Progress",
    "not-started": "Not Started",
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/mimar-logo.png"
              alt="MIMAR MODELS"
              className="h-10 w-auto object-contain"
            />
            <div className="hidden border-l border-border h-8 mx-1 md:block" />
            <div className="hidden md:block">
              <h1 className="text-lg font-bold text-foreground leading-none">MIMAR MODELS</h1>
              <p className="text-[10px] text-muted-foreground tracking-widest uppercase mt-0.5">Project Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {username.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-foreground">{username}</span>
            </div>
            <Button variant="outline" size="sm" onClick={onLogout} className="gap-2 bg-transparent">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl p-6">
        {/* Stats Bar */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-xl bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <FolderOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{projects.length}</p>
                <p className="text-xs text-muted-foreground">Total Projects</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {projects.filter((p) => getProjectStatus(p) === "in-progress").length}
                </p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {projects.filter((p) => getProjectStatus(p) === "completed").length}
                </p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Circle className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {projects.filter((p) => getProjectStatus(p) === "not-started").length}
                </p>
                <p className="text-xs text-muted-foreground">Not Started</p>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 md:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex rounded-lg border border-border p-1">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="px-3"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="px-3"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            <Dialog open={showNewProject} onOpenChange={setShowNewProject}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="projectName">Project Name</Label>
                    <Input
                      id="projectName"
                      placeholder="e.g., LACASA - DUBAI LIVING VILLA"
                      value={newProject.name}
                      onChange={(e) =>
                        setNewProject((prev) => ({ ...prev, name: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clientName">Client Name</Label>
                    <Input
                      id="clientName"
                      placeholder="e.g., John Doe"
                      value={newProject.client}
                      onChange={(e) =>
                        setNewProject((prev) => ({ ...prev, client: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="scale">Scale</Label>
                    <Input
                      id="scale"
                      placeholder="e.g., 1:50"
                      value={newProject.scale}
                      onChange={(e) =>
                        setNewProject((prev) => ({ ...prev, scale: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                          <Calendar className="mr-2 h-4 w-4" />
                          {formatDate(newProject.startDate)}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={newProject.startDate}
                          onSelect={(date) =>
                            date && setNewProject((prev) => ({ ...prev, startDate: date }))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <Button
                    onClick={handleCreateProject}
                    className="w-full"
                    disabled={!newProject.name.trim() || !newProject.scale.trim()}
                  >
                    Create Project
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Projects Grid/List */}
        {filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl bg-card py-16">
            <FolderOpen className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-medium text-foreground">No projects found</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              {projects.length === 0
                ? "Create your first project to get started"
                : "Try a different search term"}
            </p>
            {projects.length === 0 && (
              <Button onClick={() => setShowNewProject(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => {
              const status = getProjectStatus(project)
              const progress = getProgressPercentage(project)
              const days = getDaysElapsed(project.startDate)

              return (
                <div
                  key={project.id}
                  onClick={() => onSelectProject(project)}
                  className="group cursor-pointer rounded-xl bg-card p-5 shadow-sm transition-all hover:shadow-md hover:ring-2 hover:ring-primary/20"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {project.name}
                      </h3>
                      <p className="mt-1 text-xs font-medium text-muted-foreground">{project.client}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground/80">Scale: {project.scale}</p>
                    </div>
                    <div
                      className={cn(
                        "rounded-full px-2 py-1 text-xs font-medium text-white",
                        statusColors[status]
                      )}
                    >
                      {statusLabels[status]}
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium text-foreground">{progress}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Day {days}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{formatDate(project.startDate)}</span>
                    </div>
                  </div>

                  <div className="mt-3 rounded-lg bg-secondary/50 p-2">
                    <p className="text-xs text-muted-foreground">Current Task:</p>
                    <p className="text-sm font-medium text-foreground truncate">
                      {getCurrentTask(project)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredProjects.map((project) => {
              const status = getProjectStatus(project)
              const progress = getProgressPercentage(project)
              const days = getDaysElapsed(project.startDate)

              return (
                <div
                  key={project.id}
                  onClick={() => onSelectProject(project)}
                  className="group flex cursor-pointer items-center gap-4 rounded-xl bg-card p-4 shadow-sm transition-all hover:shadow-md hover:ring-2 hover:ring-primary/20"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {project.name}
                      </h3>
                      <div
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium text-white",
                          statusColors[status]
                        )}
                      >
                        {statusLabels[status]}
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Client: {project.client} | Scale: {project.scale} | Current: {getCurrentTask(project)}
                    </p>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-lg font-bold text-foreground">{progress}%</p>
                      <p className="text-xs text-muted-foreground">Complete</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-foreground">{days}</p>
                      <p className="text-xs text-muted-foreground">Days</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground">
                        {formatDate(project.startDate)}
                      </p>
                      <p className="text-xs text-muted-foreground">Start Date</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
