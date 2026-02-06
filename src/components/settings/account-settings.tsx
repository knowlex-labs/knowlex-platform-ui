import * as React from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export function AccountSettings() {
    const { user } = useAuth()
    const [formData, setFormData] = React.useState({
        username: user?.username || '',
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        phone: user?.phone || '',
        email: user?.email || '',
        password: '••••••••', // Placeholder for password
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
                password: '••••••••',
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
            // Show success message or update user context
        } catch (error) {
            console.error('Failed to save profile:', error)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="p-8 max-w-2xl">
            <div className="mb-8">
                <h1 className="text-3xl font-serif font-semibold text-ledger-black mb-2">
                    Account Settings
                </h1>
                <p className="text-ledger-gray-500">
                    Manage your account information and preferences
                </p>
            </div>

            <div className="space-y-6 bg-ledger-white border border-ledger-gray-200 rounded-lg p-6">
                {/* Username */}
                <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                        id="username"
                        type="text"
                        value={formData.username}
                        onChange={handleChange('username')}
                        placeholder="Enter username"
                    />
                </div>

                {/* First Name */}
                <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                        id="firstName"
                        type="text"
                        value={formData.firstName}
                        onChange={handleChange('firstName')}
                        placeholder="Enter first name"
                    />
                </div>

                {/* Last Name */}
                <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                        id="lastName"
                        type="text"
                        value={formData.lastName}
                        onChange={handleChange('lastName')}
                        placeholder="Enter last name"
                    />
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange('phone')}
                        placeholder="Enter phone number"
                    />
                </div>

                {/* Email - Read Only */}
                <div className="space-y-2">
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

                {/* Password - Read Only */}
                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password"
                        type="text"
                        value={formData.password}
                        disabled
                        className="bg-ledger-gray-50"
                    />
                    <p className="text-xs text-ledger-gray-500">Password cannot be changed here</p>
                </div>

                {/* Member Since */}
                <div className="space-y-2">
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

                {/* Save Button */}
                <div className="pt-4">
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </div>
        </div>
    )
}
