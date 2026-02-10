"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Settings,
  X,
  Plus,
  Trash2,
  Edit3,
  MessageSquare,
  Flag,
  AlertTriangle,
  Printer,
  ChevronDown,
  Coffee,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

// Task color options
const TASK_COLORS = [
  { id: "green", name: "Green", bg: "bg-emerald-500", light: "bg-emerald-100" },
  { id: "blue", name: "Blue", bg: "bg-blue-500", light: "bg-blue-100" },
  { id: "yellow", name: "Yellow", bg: "bg-amber-500", light: "bg-amber-100" },
  { id: "red", name: "Red", bg: "bg-red-500", light: "bg-red-100" },
  { id: "purple", name: "Purple", bg: "bg-purple-500", light: "bg-purple-100" },
  { id: "orange", name: "Orange", bg: "bg-orange-500", light: "bg-orange-100" },
  { id: "cyan", name: "Cyan", bg: "bg-cyan-500", light: "bg-cyan-100" },
]

interface Task {
  id: string
  name: string
  status: "completed" | "in-progress" | "upcoming"
  markedDays: number[]
  color: string
  notes: string
  deadline?: number // Day index for deadline
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

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function getDayName(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "short" })
}

function isSunday(date: Date): boolean {
  return date.getDay() === 0
}

function getTaskColor(colorId: string) {
  return TASK_COLORS.find((c) => c.id === colorId) || TASK_COLORS[0]
}

function getMilestoneColor(type: Milestone["type"]): string {
  switch (type) {
    case "delivery":
      return "bg-blue-500"
    case "inspection":
      return "bg-amber-500"
    case "progress":
      return "bg-emerald-500"
    case "completion":
      return "bg-purple-500"
    default:
      return "bg-muted"
  }
}

function normalizeDate(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

// Export types for use in other components
export type { ProjectData, Task, Milestone }
export { createDefaultProject, TASK_COLORS }

interface ProjectTimelineProps {
  initialProject?: ProjectData
  onBack?: () => void
  onUpdateProject?: (project: ProjectData) => void
}

export function ProjectTimeline({ initialProject, onBack, onUpdateProject }: ProjectTimelineProps) {
  const [project, setProject] = useState<ProjectData>(initialProject || createDefaultProject())
  const [viewStartDay, setViewStartDay] = useState(0)
  const [selectedTask, setSelectedTask] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(!initialProject)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isPrinting, setIsPrinting] = useState(false)

  // Modal states
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showMilestoneModal, setShowMilestoneModal] = useState(false)
  const [showHolidayModal, setShowHolidayModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [newTaskName, setNewTaskName] = useState("")
  const [newTaskColor, setNewTaskColor] = useState("green")
  const [newMilestoneLabel, setNewMilestoneLabel] = useState("")
  const [newMilestoneDay, setNewMilestoneDay] = useState<Date | undefined>(undefined)
  const [newMilestoneType, setNewMilestoneType] = useState<Milestone["type"]>("progress")
  const [newHolidayDate, setNewHolidayDate] = useState<Date | undefined>(undefined)

  // Print ref
  const timelineRef = useRef<HTMLDivElement>(null)


  // Update project helper
  const updateProject = (updates: Partial<ProjectData>) => {
    const updated = { ...project, ...updates }
    setProject(updated)
    if (onUpdateProject) {
      onUpdateProject(updated)
    }
  }

  // Update current date every minute for real-time tracking
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDate(new Date())
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  // Handle print events (Ctrl+P support)
  useEffect(() => {
    const handleBeforePrint = () => {
      setIsPrinting(true)
    }
    const handleAfterPrint = () => {
      setIsPrinting(false)
    }
    window.addEventListener("beforeprint", handleBeforePrint)
    window.addEventListener("afterprint", handleAfterPrint)
    return () => {
      window.removeEventListener("beforeprint", handleBeforePrint)
      window.removeEventListener("afterprint", handleAfterPrint)
    }
  }, [])

  // Calculate days elapsed from start date to current system date
  const daysElapsed = useMemo(() => {
    const start = normalizeDate(project.startDate)
    const now = normalizeDate(currentDate)
    const diffTime = now.getTime() - start.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }, [project.startDate, currentDate])

  // Calculate today's position in the timeline
  const todayIndex = useMemo(() => {
    return Math.max(0, daysElapsed)
  }, [daysElapsed])

  // Dynamic timeline - extends based on elapsed days, minimum 365 days view to support long projects
  const totalDays = Math.max(365, daysElapsed + 60)
  const visibleDays = 21

  const dates = useMemo(() => {
    return Array.from({ length: totalDays }, (_, i) => addDays(project.startDate, i))
  }, [project.startDate, totalDays])

  const printDates = useMemo(() => {
    // Calculate the absolute last day of any activity
    let maxDay = 0

    // Check all tasks for marked days
    project.tasks.forEach((t) => {
      if (t.markedDays.length > 0) {
        const taskMax = Math.max(...t.markedDays)
        if (taskMax > maxDay) maxDay = taskMax
      }
      // Also consider deadlines
      if (t.deadline && t.deadline > maxDay) maxDay = t.deadline
    })

    // Check milestones
    if (project.milestones.length > 0) {
      const milestoneMax = Math.max(...project.milestones.map(m => m.day))
      if (milestoneMax > maxDay) maxDay = milestoneMax
    }

    // Check holidays
    if (project.holidays.length > 0) {
      const holidayMax = Math.max(...project.holidays)
      if (holidayMax > maxDay) maxDay = holidayMax
    }

    // Ensure we cover at least "today" if the project is ongoing
    if (daysElapsed > maxDay) maxDay = daysElapsed

    // Add a small buffer of 7 days
    const endDay = maxDay + 7

    return Array.from({ length: endDay + 1 }, (_, i) => addDays(project.startDate, i))
  }, [project, daysElapsed])

  const datesToShow = dates.slice(viewStartDay, viewStartDay + visibleDays)

  const scrollTimeline = (direction: "left" | "right") => {
    setViewStartDay((prev) => {
      if (direction === "left") return Math.max(0, prev - 7)
      return Math.min(Math.max(0, totalDays - visibleDays), prev + 7)
    })
  }

  // Calculate overall progress based on task statuses
  const overallProgress = useMemo(() => {
    const totalTasks = project.tasks.length
    if (totalTasks === 0) return 0

    const completionWeight = project.tasks.reduce((acc, task) => {
      if (task.status === "completed") return acc + 1
      if (task.status === "in-progress") return acc + 0.5
      return acc
    }, 0)

    return Math.min(100, Math.round((completionWeight / totalTasks) * 100))
  }, [project.tasks])

  const getStatusIcon = (status: Task["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      case "in-progress":
        return <Clock className="h-4 w-4 text-amber-500" />
      default:
        return <Circle className="h-4 w-4 text-muted-foreground" />
    }
  }

  // Toggle day marking for a task
  const toggleDayMark = (taskId: string, dayIndex: number) => {
    // Prevent marking/unmarking on holidays
    if (project.holidays.includes(dayIndex)) return

    updateProject({
      tasks: project.tasks.map((task) => {
        if (task.id === taskId) {
          const markedDays = task.markedDays.includes(dayIndex)
            ? task.markedDays.filter((d) => d !== dayIndex)
            : [...task.markedDays, dayIndex].sort((a, b) => a - b)

          let status: Task["status"] = "upcoming"
          if (markedDays.length > 0) status = "in-progress"

          return { ...task, markedDays, status }
        }
        return task
      }),
    })
  }

  // Add new task
  const addTask = () => {
    if (!newTaskName.trim()) return
    const newTask: Task = {
      id: crypto.randomUUID(),
      name: newTaskName,
      status: "upcoming",
      markedDays: [],
      color: newTaskColor,
      notes: "",
    }
    updateProject({ tasks: [...project.tasks, newTask] })
    setNewTaskName("")
    setNewTaskColor("green")
    setShowTaskModal(false)
  }

  // Update task
  const updateTask = (taskId: string, updates: Partial<Task>) => {
    updateProject({
      tasks: project.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t)),
    })
  }

  // Delete task
  const deleteTask = (taskId: string) => {
    updateProject({ tasks: project.tasks.filter((t) => t.id !== taskId) })
    if (selectedTask === taskId) setSelectedTask(null)
  }

  // Add milestone
  const addMilestone = () => {
    if (!newMilestoneLabel.trim() || !newMilestoneDay) return

    // Normalize dates to prevent timezone issues
    const normalizedMilestoneDay = normalizeDate(newMilestoneDay)
    const normalizedStart = normalizeDate(project.startDate)

    const dayIndex = Math.floor(
      (normalizedMilestoneDay.getTime() - normalizedStart.getTime()) / (1000 * 60 * 60 * 24)
    )
    const newMilestone: Milestone = {
      id: crypto.randomUUID(),
      label: newMilestoneLabel,
      day: dayIndex,
      type: newMilestoneType,
    }
    updateProject({ milestones: [...project.milestones, newMilestone] })
    setNewMilestoneLabel("")
    setNewMilestoneDay(undefined)
    setShowMilestoneModal(false)
  }

  // Delete milestone
  const deleteMilestone = (milestoneId: string) => {
    updateProject({ milestones: project.milestones.filter((m) => m.id !== milestoneId) })
  }


  // Print timeline
  const handlePrint = () => {
    setIsPrinting(true)
    const originalTitle = document.title
    if (project.name) {
      document.title = project.name
    }

    setTimeout(() => {
      window.print()
      document.title = originalTitle
      setIsPrinting(false)
    }, 1000)
  }

  // Check deadline alerts
  const getDeadlineStatus = (task: Task) => {
    if (!task.deadline) return null
    const daysUntilDeadline = task.deadline - todayIndex
    if (task.status === "completed") return null
    if (daysUntilDeadline < 0) return "overdue"
    if (daysUntilDeadline <= 2) return "warning"
    return null
  }

  // Check if project is configured
  const isProjectConfigured =
    (project.name || "").trim() !== "" &&
    (project.client || "").trim() !== "" &&
    (project.scale || "").trim() !== ""

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 print:p-2 print:bg-white">
      {/* Print Styles */}
      <style type="text/css" media="print">
        {`
          @page { size: landscape; margin: 1cm; }
          body, html {
            width: fit-content !important;
            min-width: 100% !important;
            overflow: visible !important;
          }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        `}
      </style>

      {/* Project Setup Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm print:hidden">
          <div className="mx-4 w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                  <Settings className="h-5 w-5 text-primary-foreground" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Project Setup</h2>
              </div>
              {isProjectConfigured && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSettings(false)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="projectName" className="text-sm font-medium">
                  Project Name
                </Label>
                <Input
                  id="projectName"
                  placeholder="e.g., LACASA - DUBAI LIVING VILLA"
                  value={project.name}
                  onChange={(e) => updateProject({ name: e.target.value })}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientName" className="text-sm font-medium">
                  Client Name
                </Label>
                <Input
                  id="clientName"
                  placeholder="e.g., John Doe"
                  value={project.client}
                  onChange={(e) => updateProject({ client: e.target.value })}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="scale" className="text-sm font-medium">
                  Scale
                </Label>
                <Input
                  id="scale"
                  placeholder="e.g., 1:50"
                  value={project.scale}
                  onChange={(e) => updateProject({ scale: e.target.value })}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-12 w-full justify-start text-left font-normal bg-transparent"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {project.startDate ? (
                        project.startDate.toLocaleDateString("en-US", {
                          weekday: "short",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      ) : (
                        <span className="text-muted-foreground">Select start date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={project.startDate}
                      onSelect={(date) => date && updateProject({ startDate: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <Button
                className="mt-6 h-12 w-full"
                onClick={() => setShowSettings(false)}
                disabled={!isProjectConfigured}
              >
                {isProjectConfigured ? "Start Timeline" : "Please fill all fields"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between print:mb-2">
        <div className="flex items-center gap-4">
          <img
            src="/mimar-logo.png"
            alt="MIMAR MODELS"
            className="h-14 w-auto object-contain print:h-10"
          />
          <div className="hidden border-l border-border h-10 mx-2 md:block print:hidden" />
          <div className="hidden md:block print:block">
            <h1 className="text-xl font-bold text-foreground leading-none md:text-2xl print:text-lg">PROJECT CONTROL</h1>
            <p className="text-sm text-muted-foreground tracking-widest uppercase mt-1 print:text-xs">Production Timeline</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 print:hidden">
          {/* Project Switcher removed - handled by Dashboard */}

          <Button variant="outline" size="sm" onClick={() => setShowSettings(true)} className="gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </Button>

          <Button variant="outline" size="sm" onClick={onBack} className="gap-2 bg-transparent">
            <ChevronLeft className="h-4 w-4" />
            Dashboard
          </Button>

          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2 bg-transparent">
            <Printer className="h-4 w-4" />
            Print
          </Button>

          <div className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Overall Progress</p>
              <div className="flex items-center gap-2">
                <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-foreground">{overallProgress}%</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Project Info Bar */}
      <div className="mb-4 flex flex-wrap items-center gap-4 rounded-xl bg-primary px-4 py-3 text-primary-foreground print:rounded-none print:py-2">
        <div className="flex-1">
          <h2 className="text-lg font-semibold print:text-base">{project.name || "No Project Name"}</h2>
          <p className="text-xs opacity-80 font-medium">Client: {project.client}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm print:gap-4 print:text-xs">
          <span>Scale: {project.scale || "-"}</span>
          <span>Start: {formatDate(project.startDate)}</span>
          <span className="flex items-center gap-1">
            <span>Days:</span>
            <span
              className={cn(
                "rounded-md px-2 py-0.5 font-bold",
                daysElapsed >= 0 ? "bg-primary-foreground/20" : "bg-red-500/80"
              )}
            >
              {daysElapsed >= 0 ? daysElapsed + 1 : `${Math.abs(daysElapsed)} days to start`}
            </span>
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mb-4 flex flex-wrap items-center gap-2 print:hidden">
        {/* Add Task */}
        <Dialog open={showTaskModal} onOpenChange={setShowTaskModal}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Task Name</Label>
                <Input
                  placeholder="Enter task name"
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {TASK_COLORS.map((color) => (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => setNewTaskColor(color.id)}
                      className={cn(
                        "h-8 w-8 rounded-full transition-all",
                        color.bg,
                        newTaskColor === color.id && "ring-2 ring-offset-2 ring-primary"
                      )}
                    />
                  ))}
                </div>
              </div>
              <Button onClick={addTask} className="w-full">
                Add Task
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Milestone */}
        <Dialog open={showMilestoneModal} onOpenChange={setShowMilestoneModal}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-2 bg-transparent">
              <Flag className="h-4 w-4" />
              Add Milestone
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Milestone</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Milestone Label</Label>
                <Input
                  placeholder="e.g., Material Board Delivery"
                  value={newMilestoneLabel}
                  onChange={(e) => setNewMilestoneLabel(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Calendar className="mr-2 h-4 w-4" />
                      {newMilestoneDay ? formatDate(newMilestoneDay) : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={newMilestoneDay}
                      onSelect={setNewMilestoneDay}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={newMilestoneType} onValueChange={(v) => setNewMilestoneType(v as Milestone["type"])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="delivery">Delivery</SelectItem>
                    <SelectItem value="inspection">Inspection</SelectItem>
                    <SelectItem value="progress">Progress</SelectItem>
                    <SelectItem value="completion">Completion</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={addMilestone} className="w-full">
                Add Milestone
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Holiday */}
        <Dialog open={showHolidayModal} onOpenChange={setShowHolidayModal}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-2 bg-transparent">
              <Coffee className="h-4 w-4" />
              Add Holiday
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Project Holiday</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Holiday Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Calendar className="mr-2 h-4 w-4" />
                      {newHolidayDate ? formatDate(newHolidayDate) : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={newHolidayDate}
                      onSelect={setNewHolidayDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <Button
                onClick={() => {
                  if (!newHolidayDate) return
                  // Normalize dates to prevent timezone issues
                  const normalizedHolidayDate = normalizeDate(newHolidayDate)
                  const normalizedStart = normalizeDate(project.startDate)

                  const dayIndex = Math.floor(
                    (normalizedHolidayDate.getTime() - normalizedStart.getTime()) / (1000 * 60 * 60 * 24)
                  )
                  if (!project.holidays.includes(dayIndex)) {
                    updateProject({ holidays: [...project.holidays, dayIndex].sort((a, b) => a - b) })
                  }
                  setNewHolidayDate(undefined)
                  setShowHolidayModal(false)
                }}
                className="w-full"
                disabled={!newHolidayDate}
              >
                Set Holiday
              </Button>

              {project.holidays.length > 0 && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-2">Current Holidays:</p>
                  <div className="space-y-2">
                    {project.holidays.map(dayIdx => {
                      const date = addDays(project.startDate, dayIdx)
                      return (
                        <div key={dayIdx} className="flex items-center justify-between bg-primary/5 p-2 rounded text-sm">
                          <span>{date.toLocaleDateString()}</span>
                          <button
                            onClick={() => updateProject({ holidays: project.holidays.filter(h => h !== dayIdx) })}
                            className="text-destructive hover:text-destructive/80"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Timeline Navigation */}
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => scrollTimeline("left")}
          disabled={viewStartDay === 0}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <div className="text-sm text-muted-foreground">
          {formatDate(datesToShow[0])} - {formatDate(datesToShow[datesToShow.length - 1])}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => scrollTimeline("right")}
          disabled={viewStartDay >= totalDays - visibleDays}
          className="gap-1"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Main Timeline Grid Container (Screen View) */}
      <div className="rounded-xl bg-card shadow-lg overflow-hidden hide-on-print">
        <div ref={timelineRef} className="overflow-x-auto">
          <div className="min-w-[1000px] md:min-w-full">
            {/* Date Header */}
            <div
              className="grid border-b border-border"
              style={{ gridTemplateColumns: `300px repeat(${datesToShow.length}, minmax(40px, 1fr))` }}
            >
              <div className="border-r border-border bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground">
                Task
              </div>
              {datesToShow.map((date, index) => {
                const sunday = isSunday(date)
                const actualDayIndex = viewStartDay + index
                const isToday = actualDayIndex === todayIndex && daysElapsed >= 0
                const milestone = project.milestones.find((m) => m.day === actualDayIndex)
                const isHoliday = project.holidays.includes(actualDayIndex)
                return (
                  <div
                    key={index}
                    className={cn(
                      "relative border-r border-border px-1 py-2 text-center text-xs",
                      sunday ? "bg-muted/50" : "bg-secondary",
                      isToday && "bg-primary/20 ring-2 ring-inset ring-primary",
                      isHoliday && "bg-amber-100/50"
                    )}
                  >
                    {isHoliday && !isToday && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-40 pointer-events-none">
                        <Coffee className="h-4 w-4 text-amber-600" />
                      </div>
                    )}
                    {isHoliday && !isToday && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                        <Coffee className="h-4 w-4 text-amber-600" />
                      </div>
                    )}
                    {isToday && (
                      <div className="absolute -top-1 left-1/2 z-10 -translate-x-1/2 rounded bg-primary px-1 text-[8px] font-bold text-primary-foreground print:hidden">
                        TODAY
                      </div>
                    )}
                    {milestone && (
                      <div
                        className={cn(
                          "absolute -bottom-1 left-1/2 z-10 -translate-x-1/2 h-2 w-2 rounded-full",
                          getMilestoneColor(milestone.type)
                        )}
                        title={milestone.label}
                      />
                    )}
                    <div
                      className={cn(
                        "font-medium",
                        sunday ? "text-destructive" : isToday ? "text-primary" : "text-secondary-foreground"
                      )}
                    >
                      {date.getDate()}
                    </div>
                    <div
                      className={cn(
                        "text-[10px]",
                        sunday ? "text-destructive/70" : isToday ? "text-primary/70" : "text-muted-foreground"
                      )}
                    >
                      {getDayName(date)}
                    </div>
                  </div>
                )
              })}
            </div>


            {/* Task Rows */}
            {project.tasks.map((task) => {
              const taskColor = getTaskColor(task.color)
              const deadlineStatus = getDeadlineStatus(task)

              return (
                <div
                  key={task.id}
                  className={cn(
                    "grid border-b border-border transition-colors",
                    selectedTask === task.id ? "bg-primary/5" : "hover:bg-muted/30"
                  )}
                  style={{ gridTemplateColumns: `300px repeat(${datesToShow.length}, minmax(40px, 1fr))` }}
                >
                  {/* Task Name Cell */}
                  <div
                    className="flex items-center gap-2 border-r border-border px-3 py-3 cursor-pointer group"
                    onClick={() => setSelectedTask(selectedTask === task.id ? null : task.id)}
                  >
                    <div className={cn("h-3 w-3 rounded-full shrink-0", taskColor.bg)} />
                    {getStatusIcon(task.status)}
                    <span className="text-sm font-medium text-foreground truncate flex-1">{task.name}</span>
                    {deadlineStatus && (
                      <AlertTriangle
                        className={cn(
                          "h-4 w-4 shrink-0",
                          deadlineStatus === "overdue" ? "text-red-500" : "text-amber-500"
                        )}
                      />
                    )}
                    {task.notes && <MessageSquare className="h-3 w-3 text-muted-foreground shrink-0" />}
                    <div className="hidden group-hover:flex gap-1 print:hidden">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingTask(task)
                        }}
                        className="p-1 hover:bg-muted rounded"
                      >
                        <Edit3 className="h-3 w-3 text-muted-foreground" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteTask(task.id)
                        }}
                        className="p-1 hover:bg-destructive/10 rounded"
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </button>
                    </div>
                  </div>

                  {/* Timeline Cells */}
                  {datesToShow.map((date, dayIndex) => {
                    // When viewing, we start from viewStartDay
                    const actualDayIndex = viewStartDay + dayIndex
                    const isMarked = task.markedDays.includes(actualDayIndex)
                    const sunday = isSunday(date)
                    const isToday = actualDayIndex === todayIndex && daysElapsed >= 0
                    const isDeadline = task.deadline === actualDayIndex

                    const isPrevMarked = task.markedDays.includes(actualDayIndex - 1)
                    const isNextMarked = task.markedDays.includes(actualDayIndex + 1)
                    const isHoliday = project.holidays.includes(actualDayIndex)

                    return (
                      <div
                        key={dayIndex}
                        className={cn(
                          "relative border-r border-border py-3 cursor-pointer hover:bg-primary/5 transition-colors print:cursor-default overflow-hidden",
                          sunday ? "bg-muted/30" : "",
                          isToday && "bg-primary/10",
                          isHoliday && "bg-amber-100/30 cursor-not-allowed holiday-overlay"
                        )}
                        onClick={() => toggleDayMark(task.id, actualDayIndex)}
                      >
                        {isHoliday && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                            <div className="text-[10px] font-bold text-amber-600 tracking-widest animate-holiday opacity-60">
                              HOLIDAY
                            </div>
                          </div>
                        )}
                        {isMarked && !isHoliday && (
                          <div
                            className={cn(
                              "absolute top-1/2 h-6 -translate-y-1/2",
                              taskColor.bg,
                              !isPrevMarked ? "left-1 rounded-l-md" : "left-0",
                              !isNextMarked ? "right-1 rounded-r-md" : "right-0"
                            )}
                          />
                        )}
                        {isDeadline && (
                          <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
                            <Flag className="h-3 w-3 text-red-500" />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}

            {/* Milestones Row */}
            {project.milestones.length > 0 && (
              <div
                className="grid border-b border-border"
                style={{ gridTemplateColumns: `300px repeat(${datesToShow.length}, minmax(40px, 1fr))` }}
              >
                <div className="flex items-center gap-2 border-r border-border px-3 py-2">
                  <Flag className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground">Milestones</span>
                </div>
                {datesToShow.map((_, dayIndex) => {
                  const actualDayIndex = viewStartDay + dayIndex
                  const milestone = project.milestones.find((m) => m.day === actualDayIndex)

                  return (
                    <div key={dayIndex} className="relative border-r border-border py-2 group">
                      {milestone && (
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                          <div
                            className={cn("h-3 w-3 rounded-full cursor-pointer", getMilestoneColor(milestone.type))}
                            title={milestone.label}
                            onClick={() => deleteMilestone(milestone.id)}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Print Timeline Grid Container (Always rendered but hidden on screen) */}
      <div className="show-on-print border border-black/20 overflow-visible w-full bg-white text-black" style={{ maxWidth: 'none', width: 'auto' }}>
        <div className="w-full">
          <div className="w-full table-fixed relative" style={{ width: "max-content", minWidth: "100%" }}>
            {/* Month Header */}
            <div
              className="grid border-b border-black/20"
              style={{ gridTemplateColumns: `250px repeat(${printDates.length}, minmax(30px, 1fr))` }}
            >
              <div className="border-r border-black/20 px-2 py-2 text-sm font-bold text-black bg-white">
                Month
              </div>
              {(() => {
                const spans: { name: string; year: number; span: number }[] = []
                let currentMonth = -1
                let currentSpan = 0
                let currentName = ""
                let currentYear = 0

                printDates.forEach((date) => {
                  const month = date.getMonth()
                  const year = date.getFullYear()
                  const name = date.toLocaleDateString("en-US", { month: "long" })

                  if (month !== currentMonth) {
                    if (currentSpan > 0) {
                      spans.push({ name: currentName, year: currentYear, span: currentSpan })
                    }
                    currentMonth = month
                    currentSpan = 1
                    currentName = name
                    currentYear = year
                  } else {
                    currentSpan++
                  }
                })
                if (currentSpan > 0) {
                  spans.push({ name: currentName, year: currentYear, span: currentSpan })
                }
                return spans.map((month, index) => (
                  <div
                    key={index}
                    className="border-r border-black/20 px-2 py-1 text-center text-xs font-bold bg-gray-50 flex items-center justify-center"
                    style={{ gridColumn: `span ${month.span}` }}
                  >
                    {month.name} {month.year}
                  </div>
                ))
              })()}
            </div>

            {/* Date Header */}
            <div
              className="grid border-b border-black/20"
              style={{ gridTemplateColumns: `250px repeat(${printDates.length}, minmax(30px, 1fr))` }}
            >
              <div className="border-r border-black/20 px-2 py-2 text-sm font-bold text-black bg-gray-100 print:bg-gray-100">
                Task
              </div>
              {printDates.map((date, index) => {
                const sunday = isSunday(date)
                const actualDayIndex = index // Starts from 0 for printDates
                const isToday = actualDayIndex === todayIndex && daysElapsed >= 0
                const milestone = project.milestones.find((m) => m.day === actualDayIndex)
                const isHoliday = project.holidays.includes(actualDayIndex)
                return (
                  <div
                    key={index}
                    className={cn(
                      "relative border-r border-black/20 px-1 py-2 text-center text-xs break-inside-avoid",
                      sunday ? "bg-gray-100" : "bg-white",
                      isHoliday && "bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNCIgaGVpZ2h0PSI0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0xIDNMMyAxTTEgNUw1IDEiIHN0cm9rZT0iI2QxZDVEQiIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9zdmc+')] bg-repeat"
                    )}
                  >

                    {milestone && (
                      <div
                        className={cn(
                          "absolute -bottom-1 left-1/2 z-10 -translate-x-1/2 h-2 w-2 rounded-full border border-black/50",
                          getMilestoneColor(milestone.type)
                        )}
                      />
                    )}
                    <div className="font-bold text-black">
                      {date.getDate()}
                    </div>
                    <div className="text-[10px] text-gray-600">
                      {getDayName(date)}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Task Rows */}
            {project.tasks.map((task) => {
              const taskColor = getTaskColor(task.color)
              const deadlineStatus = getDeadlineStatus(task)

              return (
                <div
                  key={task.id}
                  className="grid border-b border-black/20 break-inside-avoid page-break-inside-avoid relative"
                  style={{ gridTemplateColumns: `250px repeat(${printDates.length}, minmax(30px, 1fr))` }}
                >
                  {/* Task Name Cell */}
                  <div className="flex items-center gap-2 border-r border-black/20 px-2 py-2 bg-white relative z-10">
                    <div className={cn("h-3 w-3 rounded-full shrink-0 border border-black/20", taskColor.bg)} />
                    <span className="text-sm font-medium text-black truncate flex-1">{task.name}</span>
                    {deadlineStatus && (
                      <span className="text-xs font-bold text-red-600">
                        {deadlineStatus === 'overdue' ? '!' : '⚠️'}
                      </span>
                    )}
                  </div>

                  {/* Timeline Cells */}
                  {printDates.map((date, dayIndex) => {
                    const actualDayIndex = dayIndex
                    const isMarked = task.markedDays.includes(actualDayIndex)
                    const sunday = isSunday(date)
                    const isToday = actualDayIndex === todayIndex && daysElapsed >= 0
                    const isDeadline = task.deadline === actualDayIndex

                    const isPrevMarked = task.markedDays.includes(actualDayIndex - 1)
                    const isNextMarked = task.markedDays.includes(actualDayIndex + 1)
                    const isHoliday = project.holidays.includes(actualDayIndex)

                    return (
                      <div
                        key={dayIndex}
                        className={cn(
                          "relative border-r border-black/20 py-2 overflow-hidden",
                          sunday ? "bg-gray-50" : "",
                          isHoliday && "bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNCIgaGVpZ2h0PSI0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0xIDNMMyAxTTEgNUw1IDEiIHN0cm9rZT0iI2QxZDVEQiIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9zdmc+')] bg-repeat"
                        )}
                      >

                        {isMarked && !isHoliday && (
                          <div
                            className={cn(
                              "absolute top-1/2 h-5 -translate-y-1/2 border border-black/10 print-color-exact",
                              taskColor.bg,
                              !isPrevMarked ? "left-1 rounded-l-md" : "left-0",
                              !isNextMarked ? "right-1 rounded-r-md" : "right-0"
                            )}
                            style={{ backgroundColor: taskColor.bg.replace('bg-', '') }} // Fallback for print color
                          />
                        )}
                        {isDeadline && (
                          <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
                            <Flag className="h-3 w-3 text-red-600" />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}

            {/* Milestones Row */}
            {project.milestones.length > 0 && (
              <div
                className="grid border-b border-border"
                style={{ gridTemplateColumns: `250px repeat(${printDates.length}, minmax(30px, 1fr))` }}
              >
                <div className="flex items-center gap-2 border-r border-black/20 px-2 py-2">
                  <Flag className="h-4 w-4 text-black" />
                  <span className="text-xs font-medium text-black">Milestones</span>
                </div>
                {printDates.map((_, dayIndex) => {
                  const actualDayIndex = dayIndex
                  const milestone = project.milestones.find((m) => m.day === actualDayIndex)

                  return (
                    <div key={dayIndex} className="relative border-r border-black/20 py-2">
                      {milestone && (
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                          <div
                            className={cn("h-3 w-3 rounded-full border border-black/50", getMilestoneColor(milestone.type))}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Holiday Overlay - One big badge per holiday column */}
            <div className="absolute inset-x-0 bottom-0 pointer-events-none z-20 grid"
              style={{
                top: '75px',
                gridTemplateColumns: `250px repeat(${printDates.length}, minmax(30px, 1fr))`
              }}>
              <div /> {/* Skip task col */}
              {printDates.map((date, index) => {
                const isHoliday = project.holidays.includes(index)
                return (
                  <div key={index} className="h-full relative">
                    {isHoliday && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white/90 border border-gray-400 px-3 py-1 rounded shadow-sm -rotate-90">
                          <span className="text-[10px] font-bold text-gray-700 tracking-widest whitespace-nowrap block">HOLIDAY</span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

          </div>
        </div>
      </div>

      {/* Milestones Legend */}
      {
        project.milestones.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 print:mt-2">
            {project.milestones
              .sort((a, b) => a.day - b.day)
              .map((milestone) => (
                <div
                  key={milestone.id}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-white shadow-sm",
                    getMilestoneColor(milestone.type)
                  )}
                >
                  <span>{formatDate(addDays(project.startDate, milestone.day))}</span>
                  <span>-</span>
                  <span>{milestone.label}</span>
                  <button
                    type="button"
                    onClick={() => deleteMilestone(milestone.id)}
                    className="ml-1 hover:opacity-70 print:hidden"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
          </div>
        )
      }

      {/* Task Detail Panel */}
      {
        selectedTask && (
          <div className="mt-4 rounded-xl bg-card p-4 shadow-lg print:hidden">
            {(() => {
              const task = project.tasks.find((t) => t.id === selectedTask)
              if (!task) return null

              const markedDaysCount = task.markedDays.length
              const firstDay = markedDaysCount > 0 ? Math.min(...task.markedDays) : null
              const lastDay = markedDaysCount > 0 ? Math.max(...task.markedDays) : null
              const taskColor = getTaskColor(task.color)
              const deadlineStatus = getDeadlineStatus(task)

              return (
                <div className="space-y-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn("h-4 w-4 rounded-full", taskColor.bg)} />
                      {getStatusIcon(task.status)}
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{task.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {markedDaysCount > 0 ? (
                            <>
                              {formatDate(addDays(project.startDate, firstDay!))} -{" "}
                              {formatDate(addDays(project.startDate, lastDay!))}
                              <span className="ml-2">({markedDaysCount} days marked)</span>
                            </>
                          ) : (
                            "Click on timeline cells to mark days for this task"
                          )}
                        </p>
                        {deadlineStatus && (
                          <p
                            className={cn(
                              "text-sm font-medium mt-1",
                              deadlineStatus === "overdue" ? "text-red-500" : "text-amber-500"
                            )}
                          >
                            {deadlineStatus === "overdue" ? "Task is overdue!" : "Deadline approaching!"}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center">
                        <span className="text-xs text-muted-foreground">Days Marked</span>
                        <span className="text-2xl font-bold text-foreground">{markedDaysCount}</span>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateTask(task.id, { markedDays: [], status: "upcoming" })}
                          disabled={markedDaysCount === 0}
                        >
                          Clear Days
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => updateTask(task.id, { status: "completed" })}
                          disabled={task.status === "completed"}
                        >
                          Mark Complete
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Notes Section */}
                  <div className="space-y-2 border-t border-border pt-4">
                    <Label className="text-sm font-medium">Notes</Label>
                    <Textarea
                      placeholder="Add notes for this task..."
                      value={task.notes}
                      onChange={(e) => updateTask(task.id, { notes: e.target.value })}
                      rows={3}
                    />
                  </div>

                  {/* Deadline Section */}
                  <div className="flex items-center gap-4 border-t border-border pt-4">
                    <Label className="text-sm font-medium">Deadline</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="bg-transparent">
                          <Calendar className="mr-2 h-4 w-4" />
                          {task.deadline !== undefined
                            ? formatDate(addDays(project.startDate, task.deadline))
                            : "Set deadline"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={task.deadline !== undefined ? addDays(project.startDate, task.deadline) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              const dayIndex = Math.floor(
                                (date.getTime() - project.startDate.getTime()) / (1000 * 60 * 60 * 24)
                              )
                              updateTask(task.id, { deadline: dayIndex })
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {task.deadline !== undefined && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateTask(task.id, { deadline: undefined })}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
              )
            })()}
          </div>
        )
      }

      {/* Edit Task Modal */}
      <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          {editingTask && (
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Task Name</Label>
                <Input
                  value={editingTask.name}
                  onChange={(e) => setEditingTask({ ...editingTask, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {TASK_COLORS.map((color) => (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => setEditingTask({ ...editingTask, color: color.id })}
                      className={cn(
                        "h-8 w-8 rounded-full transition-all",
                        color.bg,
                        editingTask.color === color.id && "ring-2 ring-offset-2 ring-primary"
                      )}
                    />
                  ))}
                </div>
              </div>
              <Button
                onClick={() => {
                  updateTask(editingTask.id, { name: editingTask.name, color: editingTask.color })
                  setEditingTask(null)
                }}
                className="w-full"
              >
                Save Changes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Print Styles */}
      <style type="text/css" media="print">
        {`
          @page { size: landscape; margin: 1cm; }
          body, html {
            width: fit-content !important;
            min-width: 100% !important;
            overflow: visible !important;
          }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .hide-on-print { display: none !important; }
          .show-on-print { display: block !important; }
        `}
      </style>
      <style type="text/css">
        {`
          .show-on-print { display: none; }
        `}
      </style>
    </div >
  )
}
