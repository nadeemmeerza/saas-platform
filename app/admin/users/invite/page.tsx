// app/admin/users/invite/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  User, 
  Mail, 
  Shield, 
  Send, 
  ArrowLeft,
  Loader2,
  Check
} from 'lucide-react';

export default function InviteUserPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'USER',
    sendInvite: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleRoleChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      role: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validation
    if (!formData.name.trim()) {
      setError('Please enter the user\'s name');
      setLoading(false);
      return;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.toLowerCase().trim(),
          role: formData.role,
          sendInvite: formData.sendInvite
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(formData.sendInvite 
          ? 'Invitation sent successfully! The user will receive an email to set up their account.'
          : 'User created successfully! You can now share the login details with them.'
        );
        
        // Reset form
        setFormData({
          name: '',
          email: '',
          role: 'USER',
          sendInvite: true
        });

        // Optionally redirect after success
        setTimeout(() => {
          router.push('/admin/users');
        }, 3000);
      } else {
        setError(data.error || 'Failed to create user. Please try again.');
      }
    } catch (err) {
      console.error('User creation error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/users">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Invite New User</h1>
          <p className="text-gray-600">
            Create a new user account and send them an invitation
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invite Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
              <CardDescription>
                Enter the details for the new user account
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="bg-green-50 border-green-200 mb-6">
                  <Check className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    {success}
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Enter user's full name"
                      value={formData.name}
                      onChange={handleChange}
                      className="pl-10"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter user's email address"
                      value={formData.email}
                      onChange={handleChange}
                      className="pl-10"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Role Selection */}
                <div className="space-y-3">
                  <Label>User Role</Label>
                  <RadioGroup 
                    value={formData.role} 
                    onValueChange={handleRoleChange}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                  >
                    <div>
                      <RadioGroupItem value="USER" id="user-role" className="peer sr-only" />
                      <Label
                        htmlFor="user-role"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        <User className="mb-2 h-6 w-6" />
                        <span className="font-medium">User</span>
                        <span className="text-sm text-gray-500 text-center">
                          Standard user access with limited permissions
                        </span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="ADMIN" id="admin-role" className="peer sr-only" />
                      <Label
                        htmlFor="admin-role"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        <Shield className="mb-2 h-6 w-6" />
                        <span className="font-medium">Admin</span>
                        <span className="text-sm text-gray-500 text-center">
                          Full administrative access to all features
                        </span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Invitation Option */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="sendInvite"
                    checked={formData.sendInvite}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      sendInvite: e.target.checked
                    }))}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    disabled={loading}
                  />
                  <label htmlFor="sendInvite" className="text-sm text-gray-700">
                    Send invitation email to set up account
                  </label>
                </div>

                {/* Submit Button */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/admin/users')}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating User...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        {formData.sendInvite ? 'Send Invitation' : 'Create User'}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Information */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">About User Roles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <div className="font-semibold flex items-center gap-2 mb-1">
                  <User className="h-4 w-4 text-blue-600" />
                  User Role
                </div>
                <p className="text-gray-600">
                  Standard users can manage their own account, subscriptions, and billing.
                  They cannot access admin features or other users' data.
                </p>
              </div>
              <div>
                <div className="font-semibold flex items-center gap-2 mb-1">
                  <Shield className="h-4 w-4 text-red-600" />
                  Admin Role
                </div>
                <p className="text-gray-600">
                  Administrators have full access to all features including user management,
                  system settings, and analytics. Use this role carefully.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/admin/users">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Users
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/admin/users/bulk-invite">
                  <Send className="mr-2 h-4 w-4" />
                  Bulk Invite
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}