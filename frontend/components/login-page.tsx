"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, LogIn, KeyRound, CheckCircle2, AlertCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { api } from "@/lib/api"

interface LoginPageProps {
  onLogin: (username: string, token: string) => void
  onRegister: () => void
}

export function LoginPage({ onLogin, onRegister }: LoginPageProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Reset Password State
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [resetUsername, setResetUsername] = useState("")
  const [resetStep, setResetStep] = useState(1) // 1: Username, 2: Security Question, 3: New Password
  const [fetchedQuestion, setFetchedQuestion] = useState("")
  const [securityAnswer, setSecurityAnswer] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [resetError, setResetError] = useState("")
  const [resetSuccess, setResetSuccess] = useState("")
  const [isResetting, setIsResetting] = useState(false)

  const handleResetUsernameSubmit = async () => {
    if (!resetUsername.trim()) {
      setResetError("Username is required")
      return
    }
    setResetError("")
    setIsResetting(true)
    try {
      const response = await api.auth.getSecurityQuestion(resetUsername.trim())
      setFetchedQuestion(response.securityQuestion)
      setResetStep(2)
    } catch (err: any) {
      setResetError(err.message || "Username not found")
    } finally {
      setIsResetting(false)
    }
  }

  const handleVerifyAnswer = async () => {
    if (!securityAnswer.trim()) {
      setResetError("Answer is required")
      return
    }
    setResetError("")
    setIsResetting(true)
    try {
      await api.auth.verifyAnswer({
        username: resetUsername.trim(),
        securityAnswer: securityAnswer.trim()
      })
      setResetStep(3)
    } catch (err: any) {
      setResetError(err.message || "Incorrect answer")
    } finally {
      setIsResetting(false)
    }
  }

  const handleFinalReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetError("")
    setResetSuccess("")

    if (!newPassword.trim()) {
      setResetError("New password is required")
      return
    }

    setIsResetting(true)
    try {
      const response = await api.auth.resetPassword({
        username: resetUsername.trim(),
        securityAnswer: securityAnswer.trim(),
        newPassword
      });
      setResetSuccess(response.message)
      setTimeout(() => {
        setShowResetDialog(false)
        // Reset states
        setResetStep(1)
        setResetUsername("")
        setSecurityAnswer("")
        setNewPassword("")
        setResetSuccess("")
      }, 2000)
    } catch (err: any) {
      setResetError(err.message || "Password update failed")
    } finally {
      setIsResetting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!username.trim() || !password.trim()) {
      setError("Username and password are required")
      return
    }

    setIsLoading(true)

    try {
      const response = await api.auth.login({ username: username.trim(), password });
      onLogin(response.username, response.token)
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center flex flex-col items-center">
          <img src="/mimar-logo.png" alt="MIMAR MODELS" className="h-20 w-auto mb-4 object-contain" />
          <p className="text-sm font-semibold text-muted-foreground tracking-[0.2em] uppercase text-center">Project Timeline Management</p>
        </div>

        <div className="rounded-2xl bg-card p-8 shadow-xl">
          <h2 className="mb-6 text-xl font-semibold text-foreground">Sign In</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium">Username</Label>
              <Input
                id="username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-12"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <Dialog open={showResetDialog} onOpenChange={(open) => {
                  setShowResetDialog(open)
                  if (!open) setResetStep(1)
                }}>
                  <DialogTrigger asChild>
                    <button type="button" className="text-xs text-primary hover:underline font-medium">Forgot password?</button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <KeyRound className="h-5 w-5 text-primary" />
                        Recover Account
                      </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 pt-4">
                      {resetStep === 1 && (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Username</Label>
                            <Input placeholder="Enter username" value={resetUsername} onChange={(e) => setResetUsername(e.target.value)} disabled={isResetting} />
                          </div>
                          <Button onClick={handleResetUsernameSubmit} className="w-full h-11" disabled={isResetting}>
                            {isResetting ? "Verifying..." : "Find My Account"}
                          </Button>
                        </div>
                      )}

                      {resetStep === 2 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
                          <div className="rounded-lg bg-primary/10 p-4 border border-primary/20">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1 italic">Security Question</p>
                            <p className="text-sm font-medium text-foreground">{fetchedQuestion}</p>
                          </div>
                          <div className="space-y-2">
                            <Label>Your Answer</Label>
                            <Input placeholder="Enter answer" value={securityAnswer} onChange={(e) => setSecurityAnswer(e.target.value)} disabled={isResetting} />
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setResetStep(1)} className="flex-1">Back</Button>
                            <Button onClick={handleVerifyAnswer} className="flex-[2] h-11" disabled={isResetting}>
                              {isResetting ? "Checking..." : "Verify Answer"}
                            </Button>
                          </div>
                        </div>
                      )}

                      {resetStep === 3 && (
                        <form onSubmit={handleFinalReset} className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
                          <div className="flex items-center gap-2 text-emerald-600 bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">
                            <CheckCircle2 className="h-5 w-5 shrink-0" />
                            <p className="text-sm font-medium">Identity verified! Set your new password.</p>
                          </div>
                          <div className="space-y-2">
                            <Label>New Password</Label>
                            <Input type="password" placeholder="Enter new strong password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} disabled={isResetting} />
                            <p className="text-[10px] text-muted-foreground italic">Must include upper/lower, number, and symbol.</p>
                          </div>
                          <Button type="submit" className="w-full h-11" disabled={isResetting}>
                            {isResetting ? "Updating..." : "Update Password"}
                          </Button>
                        </form>
                      )}

                      {resetError && (
                        <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-3 rounded-lg text-xs">
                          <AlertCircle className="h-4 w-4" />
                          {resetError}
                        </div>
                      )}

                      {resetSuccess && (
                        <div className="flex flex-col items-center justify-center p-4 text-emerald-600 bg-emerald-500/10 rounded-lg animate-in zoom-in-95 duration-300">
                          <CheckCircle2 className="h-10 w-10 mb-2" />
                          <p className="text-sm font-bold text-center">{resetSuccess}</p>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pr-12"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

            <Button type="submit" className="h-12 w-full gap-2" disabled={isLoading}>
              {isLoading ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : <><LogIn className="h-5 w-5" />Sign In</>}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <button onClick={onRegister} className="font-medium text-primary hover:underline transition-all">Create one now</button>
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground text-center">Architectural Model Production Timeline System</p>
      </div>
    </div>
  )
}
