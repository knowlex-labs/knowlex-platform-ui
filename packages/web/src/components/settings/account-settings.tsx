import * as React from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { authApi } from '@knowlex/core/api/auth-api'
import { validatePassword } from '@/lib/password-policy'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

export function AccountSettings() {
    const { user } = useAuth()
    const [formData, setFormData] = React.useState({
        username: user?.username || '',
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        phone: user?.phone || '',
        email: user?.email || '',
    })
    const [isSaving, setIsSaving] = React.useState(false)

    React.useEffect(() => {
        if (user) {
            setFormData({
                username: user.username || '',
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                phone: user.phone || '',
                email: user.email || '',
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
        try {
            // TODO: Implement API call to update user profile
            console.log('Saving profile:', {
                username: formData.username,
                firstName: formData.firstName,
                lastName: formData.lastName,
                phone: formData.phone,
            })
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 500))
        } catch (error) {
            console.error('Failed to save profile:', error)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            <h2 className="text-xl md:text-2xl font-serif font-semibold text-kx-primary-900">Account</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
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

                        <div className="pt-3">
                            <Button onClick={handleSave} disabled={isSaving}>
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Account Details (read-only) */}
                <div className="space-y-5">
                    <div className="bg-kx-card border border-kx-card-border rounded-lg p-6">
                        <h3 className="text-base font-semibold text-kx-primary-900 mb-5">Account Details</h3>
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    disabled
                                    className="bg-ledger-gray-50"
                                />
                                <p className="text-xs text-ledger-gray-500">Email cannot be changed</p>
                            </div>

                        </div>
                    </div>

                    <ChangePasswordCard />

                    <div className="bg-kx-card border border-kx-card-border rounded-lg p-6">
                        <h3 className="text-base font-semibold text-kx-primary-900 mb-5">Membership</h3>
                        <div className="space-y-1.5">
                            <Label htmlFor="memberSince">Member Since</Label>
                            <Input
                                id="memberSince"
                                type="text"
                                value={user.createdAt.toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                                disabled
                                className="bg-ledger-gray-50"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function ChangePasswordCard() {
    const { replaceTokens } = useAuth()
    const [current, setCurrent] = React.useState('')
    const [next, setNext] = React.useState('')
    const [confirm, setConfirm] = React.useState('')
    const [status, setStatus] = React.useState<'idle' | 'saving' | 'success'>('idle')
    const [error, setError] = React.useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        const policyError = validatePassword(next)
        if (policyError) {
            setError(policyError)
            return
        }
        if (next !== confirm) {
            setError('New passwords do not match.')
            return
        }
        if (current === next) {
            setError('New password must differ from your current password.')
            return
        }
        setStatus('saving')
        try {
            const tokens = await authApi.changePassword(current, next)
            replaceTokens(tokens.token, tokens.refreshToken)
            setStatus('success')
            setCurrent('')
            setNext('')
            setConfirm('')
            setTimeout(() => setStatus('idle'), 4000)
        } catch (err) {
            const message = err instanceof Error ? err.message : (err as { message?: string })?.message
            setError(message || 'Password change failed. Please try again.')
            setStatus('idle')
        }
    }

    return (
        <div className="bg-kx-card border border-kx-card-border rounded-lg p-6">
            <h3 className="text-base font-semibold text-kx-primary-900 mb-1">Change Password</h3>
            <p className="text-xs text-ledger-gray-500 mb-5">
                Changing your password will sign you out of any other devices.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
                        <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-900">
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        <span>Password updated.</span>
                    </div>
                )}

                <div className="space-y-1.5">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input
                        id="current-password"
                        type="password"
                        value={current}
                        onChange={(e) => setCurrent(e.target.value)}
                        required
                        autoComplete="current-password"
                    />
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                        id="new-password"
                        type="password"
                        value={next}
                        onChange={(e) => setNext(e.target.value)}
                        required
                        autoComplete="new-password"
                    />
                    <p className="text-xs text-ledger-gray-500">
                        At least 8 characters, with a letter and a digit.
                    </p>
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input
                        id="confirm-password"
                        type="password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        required
                        autoComplete="new-password"
                    />
                </div>

                <div className="pt-2">
                    <Button
                        type="submit"
                        disabled={status === 'saving' || !current || !next || !confirm}
                    >
                        {status === 'saving' ? 'Updating…' : 'Update Password'}
                    </Button>
                </div>
            </form>
        </div>
    )
}
