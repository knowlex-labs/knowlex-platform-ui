import * as React from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useSubscription } from '@/hooks/use-subscription'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { authApi } from '@knowlex/core/api/auth-api'
import { validatePassword } from '@/lib/password-policy'
import { AlertCircle, CheckCircle2, Mail } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'

export function AccountSettings() {
    const { user, updateProfile } = useAuth()
    const { subscription } = useSubscription()
    const [formData, setFormData] = React.useState({
        username: user?.username || '',
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        phone: user?.phone || '',
    })
    const [isSaving, setIsSaving] = React.useState(false)
    const [saveError, setSaveError] = React.useState('')
    const [saveSuccess, setSaveSuccess] = React.useState(false)

    React.useEffect(() => {
        if (user) {
            setFormData({
                username: user.username || '',
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                phone: user.phone || '',
            })
        }
    }, [user])

    if (!user) {
        return (
            <div className="p-8">
                <p className="text-ledger-gray-500">Please log in to view account settings.</p>
            </div>
        )
    }

    const handleChange = (field: keyof typeof formData) => (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        setFormData(prev => ({ ...prev, [field]: e.target.value }))
    }

    const handleSave = async () => {
        setIsSaving(true)
        setSaveError('')
        setSaveSuccess(false)
        try {
            await updateProfile({
                username: formData.username,
                firstName: formData.firstName,
                lastName: formData.lastName,
                phone: formData.phone,
            })
            setSaveSuccess(true)
            setTimeout(() => setSaveSuccess(false), 3000)
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Failed to save changes.'
            setSaveError(msg)
        } finally {
            setIsSaving(false)
        }
    }

    const getMemberSinceDate = () => {
        try {
            const date = typeof user.createdAt === 'string'
                ? new Date(user.createdAt)
                : user.createdAt
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
        } catch {
            return 'N/A'
        }
    }

    return (
        <div className="space-y-6 max-w-2xl">
            <h2 className="text-xl md:text-2xl font-serif font-semibold text-kx-primary-900">Account</h2>

            {/* Personal Information */}
            <div className="bg-kx-card border border-kx-card-border rounded-lg p-6">
                <h3 className="text-base font-semibold text-kx-primary-900 mb-5">Personal Information</h3>
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="username">Username</Label>
                        <Input
                            id="username"
                            type="text"
                            value={formData.username}
                            onChange={handleChange('username')}
                            placeholder="Enter username"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input
                                id="firstName"
                                type="text"
                                value={formData.firstName}
                                onChange={handleChange('firstName')}
                                placeholder="First name"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                                id="lastName"
                                type="text"
                                value={formData.lastName}
                                onChange={handleChange('lastName')}
                                placeholder="Last name"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={handleChange('phone')}
                            placeholder="Enter phone number"
                        />
                    </div>

                    <div className="pt-3 space-y-2">
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                        {saveSuccess && (
                            <p className="text-xs text-green-700 flex items-center gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Changes saved.
                            </p>
                        )}
                        {saveError && (
                            <p className="text-xs text-red-600 flex items-center gap-1">
                                <AlertCircle className="h-3.5 w-3.5" /> {saveError}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Email & Verification */}
            <EmailVerificationCard email={user.email} isVerified={user.emailVerified || false} />

            {/* Change / Reset Password */}
            <ChangePasswordCard />

            {/* Membership */}
            <div className="bg-kx-card border border-kx-card-border rounded-lg p-6">
                <h3 className="text-base font-semibold text-kx-primary-900 mb-5">Membership</h3>
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="plan">Plan</Label>
                        <Input
                            id="plan"
                            type="text"
                            value={subscription?.planDisplayName || subscription?.planName || user.plan || 'Free'}
                            disabled
                            className="bg-ledger-gray-50"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="memberSince">Member Since</Label>
                        <Input
                            id="memberSince"
                            type="text"
                            value={getMemberSinceDate()}
                            disabled
                            className="bg-ledger-gray-50"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

function EmailVerificationCard({ email, isVerified }: { email: string; isVerified: boolean }) {
    const [isVerifying, setIsVerifying] = React.useState(false)
    const [status, setStatus] = React.useState<'idle' | 'sent'>('idle')

    const handleSendVerification = async () => {
        setIsVerifying(true)
        try {
            await authApi.resendVerification(email)
            setStatus('sent')
            setTimeout(() => setStatus('idle'), 4000)
        } catch (err) {
            console.error('Failed to send verification email:', err)
            setStatus('idle')
        } finally {
            setIsVerifying(false)
        }
    }

    return (
        <div className="bg-kx-card border border-kx-card-border rounded-lg p-5">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-medium text-kx-primary-900">Email Address</h3>
                    <p className="text-xs text-ledger-gray-500 mt-0.5">{email}</p>
                </div>
                {isVerified ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="h-3 w-3" /> Verified
                    </span>
                ) : (
                    <span className="flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        <Mail className="h-3 w-3" /> Not Verified
                    </span>
                )}
            </div>

            {!isVerified && (
                <div className="mt-3 pt-3 border-t border-kx-card-border">
                    {status === 'sent' ? (
                        <p className="text-xs text-green-700 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Verification email sent. Check your inbox.
                        </p>
                    ) : (
                        <Button size="sm" variant="outline" onClick={handleSendVerification} disabled={isVerifying} className="text-xs h-7">
                            {isVerifying ? 'Sending...' : 'Send Verification Email'}
                        </Button>
                    )}
                </div>
            )}
        </div>
    )
}

function ChangePasswordCard() {
    const { user, replaceTokens } = useAuth()
    const [open, setOpen] = React.useState(false)
    // 'change' = enter current + new password, 'reset' = forgot password sub-flow
    const [mode, setMode] = React.useState<'change' | 'reset'>('change')

    // Change password state
    const [current, setCurrent] = React.useState('')
    const [next, setNext] = React.useState('')
    const [confirm, setConfirm] = React.useState('')
    const [status, setStatus] = React.useState<'idle' | 'saving' | 'success'>('idle')
    const [error, setError] = React.useState('')

    // Reset password state
    const [resetEmail, setResetEmail] = React.useState('')
    const [resetStatus, setResetStatus] = React.useState<'idle' | 'sending' | 'sent'>('idle')

    const handleClose = () => {
        setOpen(false)
        setMode('change')
        setCurrent(''); setNext(''); setConfirm('')
        setError(''); setStatus('idle')
        setResetEmail(''); setResetStatus('idle')
    }

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        const policyError = validatePassword(next)
        if (policyError) { setError(policyError); return }
        if (next !== confirm) { setError('New passwords do not match.'); return }
        if (current === next) { setError('New password must differ from your current password.'); return }
        setStatus('saving')
        try {
            const tokens = await authApi.changePassword(current, next)
            replaceTokens(tokens.token, tokens.refreshToken)
            setStatus('success')
            setTimeout(handleClose, 2000)
        } catch (err) {
            const message = err instanceof Error ? err.message : (err as { message?: string })?.message
            setError(message || 'Password change failed. Please try again.')
            setStatus('idle')
        }
    }

    const handleSendReset = async (e: React.FormEvent) => {
        e.preventDefault()
        setResetStatus('sending')
        try {
            await authApi.forgotPassword(resetEmail)
            setResetStatus('sent')
        } catch {
            setResetStatus('idle')
        }
    }

    return (
        <>
            <div className="bg-kx-card border border-kx-card-border rounded-lg p-5 flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-kx-primary-900">Password</p>
                    <p className="text-xs text-ledger-gray-500 mt-0.5">Update your account password</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setOpen(true)} className="text-xs h-7">
                    Change Password
                </Button>
            </div>

            <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent className="max-w-sm">
                    {mode === 'change' ? (
                        <>
                            <DialogHeader>
                                <DialogTitle>Change Password</DialogTitle>
                                <DialogDescription>
                                    Changing your password will sign you out of any other devices.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleChangePassword} className="space-y-3 pt-1">
                                {error && (
                                    <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-2.5 text-xs text-red-900">
                                        <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                        <span>{error}</span>
                                    </div>
                                )}
                                {status === 'success' && (
                                    <div className="flex items-start gap-2 rounded-md border border-green-200 bg-green-50 p-2.5 text-xs text-green-900">
                                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                        <span>Password updated successfully.</span>
                                    </div>
                                )}
                                <div className="space-y-1">
                                    <Label htmlFor="current-password" className="text-xs">Current Password</Label>
                                    <Input id="current-password" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required autoComplete="current-password" className="h-8 text-sm" />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="new-password" className="text-xs">New Password</Label>
                                    <Input id="new-password" type="password" value={next} onChange={(e) => setNext(e.target.value)} required autoComplete="new-password" className="h-8 text-sm" />
                                    <p className="text-xs text-ledger-gray-400">At least 8 characters, with a letter and a digit.</p>
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="confirm-password" className="text-xs">Confirm New Password</Label>
                                    <Input id="confirm-password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required autoComplete="new-password" className="h-8 text-sm" />
                                </div>
                                <div className="flex gap-2 pt-1">
                                    <Button type="submit" size="sm" disabled={status === 'saving' || !current || !next || !confirm}>
                                        {status === 'saving' ? 'Updating…' : 'Update Password'}
                                    </Button>
                                    <Button type="button" size="sm" variant="ghost" onClick={handleClose}>Cancel</Button>
                                </div>
                                <p className="text-xs text-ledger-gray-400 pt-1">
                                    Don't know your current password?{' '}
                                    <button
                                        type="button"
                                        onClick={() => { setMode('reset'); setResetEmail(user?.email || '') }}
                                        className="text-kx-primary-700 underline underline-offset-2 hover:text-kx-primary-900"
                                    >
                                        Reset via email
                                    </button>
                                </p>
                            </form>
                        </>
                    ) : (
                        <>
                            <DialogHeader>
                                <DialogTitle>Reset Password</DialogTitle>
                                <DialogDescription>
                                    Enter your email address and we'll send you a reset link.
                                </DialogDescription>
                            </DialogHeader>
                            {resetStatus === 'sent' ? (
                                <div className="flex items-start gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-900">
                                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                                    <span>Reset link sent. Check your inbox.</span>
                                </div>
                            ) : (
                                <form onSubmit={handleSendReset} className="space-y-3 pt-1">
                                    <div className="space-y-1">
                                        <Label htmlFor="reset-email" className="text-xs">Email Address</Label>
                                        <Input
                                            id="reset-email"
                                            type="email"
                                            value={resetEmail}
                                            onChange={(e) => setResetEmail(e.target.value)}
                                            placeholder="Enter your email"
                                            required
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button type="submit" size="sm" disabled={resetStatus === 'sending' || !resetEmail}>
                                            {resetStatus === 'sending' ? 'Sending…' : 'Send Reset Link'}
                                        </Button>
                                        <Button type="button" size="sm" variant="ghost" onClick={() => setMode('change')}>
                                            Back
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}
