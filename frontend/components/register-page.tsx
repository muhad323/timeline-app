"use client"

import React, { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, UserPlus, ArrowLeft, Check, X } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { api } from "@/lib/api"
import { cn } from "@/lib/utils"

interface RegisterPageProps {
    onRegister: (username: string, token: string) => void
    onBackToLogin: () => void
}

export function RegisterPage({ onRegister, onBackToLogin }: RegisterPageProps) {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const [securityQuestion, setSecurityQuestion] = useState("")
    const [securityAnswer, setSecurityAnswer] = useState("")

    const passwordRequirements = useMemo(() => [
        { label: "At least 8 characters", test: (pw: string) => pw.length >= 8 },
        { label: "Contains uppercase letter", test: (pw: string) => /[A-Z]/.test(pw) },
        { label: "Contains lowercase letter", test: (pw: string) => /[a-z]/.test(pw) },
        { label: "Contains number", test: (pw: string) => /\d/.test(pw) },
        { label: "Contains special character", test: (pw: string) => /[!@#$%^&*(),.?":{}|<>]/.test(pw) },
    ], [])

    const passwordStrength = useMemo(() => {
        if (!password) return 0
        const met = passwordRequirements.filter(req => req.test(password)).length
        return (met / passwordRequirements.length) * 100
    }, [password, passwordRequirements])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (!username.trim() || !securityQuestion || !securityAnswer.trim()) {
            setError("All fields are required")
            return
        }

        const isStrong = passwordRequirements.every(req => req.test(password))
        if (!isStrong) {
            setError("Please meet all password requirements")
            return
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match")
            return
        }

        setIsLoading(true)

        try {
            const response = await api.auth.register({
                username: username.trim(),
                password,
                securityQuestion,
                securityAnswer: securityAnswer.trim()
            });
            onRegister(response.username, response.token)
        } catch (err: any) {
            setError(err.message || "Failed to create account. Please try again.")
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <div className="w-full max-w-md">
                {/* Logo and Header */}
                <div className="mb-8 text-center flex flex-col items-center">
                    <img
                        src="/mimar-logo.png"
                        alt="MIMAR MODELS"
                        className="h-20 w-auto mb-4 object-contain"
                    />
                    <p className="text-sm font-semibold text-muted-foreground tracking-[0.2em] uppercase">Create your account</p>
                </div>

                {/* Register Card */}
                <div className="rounded-2xl bg-card p-8 shadow-xl">
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-foreground">Sign Up</h2>
                        <button
                            onClick={onBackToLogin}
                            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Login
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username" className="text-sm font-medium">
                                Username
                            </Label>
                            <Input
                                id="username"
                                type="text"
                                placeholder="Choose a username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="h-12"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Security Question</Label>
                            <Select value={securityQuestion} onValueChange={setSecurityQuestion}>
                                <SelectTrigger className="h-12 bg-transparent">
                                    <SelectValue placeholder="Select a question" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="What was your first pet's name?">What was your first pet's name?</SelectItem>
                                    <SelectItem value="In what city were you born?">In what city were you born?</SelectItem>
                                    <SelectItem value="What is your mother's maiden name?">What is your mother's maiden name?</SelectItem>
                                    <SelectItem value="What was the name of your first school?">What was the name of your first school?</SelectItem>
                                    <SelectItem value="What is your favorite movie?">What is your favorite movie?</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="securityAnswer" className="text-sm font-medium">Security Answer</Label>
                            <Input
                                id="securityAnswer"
                                placeholder="Your answer"
                                value={securityAnswer}
                                onChange={(e) => setSecurityAnswer(e.target.value)}
                                className="h-12"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-sm font-medium">
                                Password
                            </Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Create a password"
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

                            {/* Password Strength Indicator */}
                            <div className="pt-1">
                                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                                    <div
                                        className={cn(
                                            "h-full transition-all duration-500",
                                            passwordStrength < 40 && "bg-destructive",
                                            passwordStrength >= 40 && passwordStrength < 80 && "bg-amber-500",
                                            passwordStrength >= 80 && "bg-emerald-500"
                                        )}
                                        style={{ width: `${passwordStrength}%` }}
                                    />
                                </div>
                                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
                                    {passwordRequirements.map((req, idx) => {
                                        const isMet = req.test(password)
                                        return (
                                            <div key={idx} className="flex items-center gap-2">
                                                {isMet ? (
                                                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                                                ) : (
                                                    <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/30 flex items-center justify-center">
                                                        <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                                                    </div>
                                                )}
                                                <span className={cn(
                                                    "text-[10px] transition-colors",
                                                    isMet ? "text-emerald-600 font-medium" : "text-muted-foreground"
                                                )}>
                                                    {req.label}
                                                </span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 mt-4">
                            <Label htmlFor="confirmPassword" className="text-sm font-medium">
                                Confirm Password
                            </Label>
                            <Input
                                id="confirmPassword"
                                type={showPassword ? "text" : "password"}
                                placeholder="Repeat password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="h-12"
                                disabled={isLoading}
                            />
                        </div>

                        {error && (
                            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                                {error}
                            </div>
                        )}

                        <Button type="submit" className="h-12 w-full gap-2 mt-2" disabled={isLoading}>
                            {isLoading ? (
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                            ) : (
                                <>
                                    <UserPlus className="h-5 w-5" />
                                    Create Account
                                </>
                            )}
                        </Button>
                    </form>
                </div>

                {/* Footer */}
                <p className="mt-6 text-center text-xs text-muted-foreground">
                    Join the Architectural Model Production Timeline System
                </p>
            </div>
        </div>
    )
}
