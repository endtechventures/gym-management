"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Save, Building, Clock, DollarSign, Bell, Shield, Mail, Smartphone } from "lucide-react"

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    // Gym Information
    gymName: "FitFlow Gym",
    address: "123 Fitness Street, Health City, HC 12345",
    phone: "+1 (555) 123-4567",
    email: "info@fitflow.com",
    website: "www.fitflow.com",

    // Operating Hours
    mondayHours: "06:00-22:00",
    tuesdayHours: "06:00-22:00",
    wednesdayHours: "06:00-22:00",
    thursdayHours: "06:00-22:00",
    fridayHours: "06:00-22:00",
    saturdayHours: "08:00-20:00",
    sundayHours: "08:00-18:00",

    // Financial Settings
    currency: "USD",
    taxRate: "8.5",
    lateFee: "10",
    gracePeriod: "3",

    // Notification Settings
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    reminderDays: "3",

    // Security Settings
    sessionTimeout: "30",
    passwordExpiry: "90",
    twoFactorAuth: false,

    // Terms and Policies
    termsOfService: "By using our gym facilities, you agree to follow all gym rules and regulations...",
    privacyPolicy: "We collect and use your personal information to provide gym services...",
    cancellationPolicy: "Memberships can be cancelled with 30 days written notice...",
  })

  const handleSave = () => {
    localStorage.setItem("gym_settings", JSON.stringify(settings))
    // Show success message
    alert("Settings saved successfully!")
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Configure your gym management system</p>
        </div>
        <Button onClick={handleSave} className="bg-teal-600 hover:bg-teal-700">
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Gym Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building className="h-5 w-5" />
              <span>Gym Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="gymName">Gym Name</Label>
              <Input
                id="gymName"
                value={settings.gymName}
                onChange={(e) => handleInputChange("gymName", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={settings.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={settings.phone} onChange={(e) => handleInputChange("phone", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={settings.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={settings.website}
                onChange={(e) => handleInputChange("website", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Operating Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Operating Hours</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { day: "Monday", field: "mondayHours" },
              { day: "Tuesday", field: "tuesdayHours" },
              { day: "Wednesday", field: "wednesdayHours" },
              { day: "Thursday", field: "thursdayHours" },
              { day: "Friday", field: "fridayHours" },
              { day: "Saturday", field: "saturdayHours" },
              { day: "Sunday", field: "sundayHours" },
            ].map(({ day, field }) => (
              <div key={day} className="flex items-center justify-between">
                <Label className="w-24">{day}</Label>
                <Input
                  value={settings[field as keyof typeof settings] as string}
                  onChange={(e) => handleInputChange(field, e.target.value)}
                  placeholder="09:00-17:00"
                  className="w-32"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Financial Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>Financial Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="currency">Currency</Label>
                <select
                  id="currency"
                  value={settings.currency}
                  onChange={(e) => handleInputChange("currency", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD ($)</option>
                </select>
              </div>
              <div>
                <Label htmlFor="taxRate">Tax Rate (%)</Label>
                <Input
                  id="taxRate"
                  value={settings.taxRate}
                  onChange={(e) => handleInputChange("taxRate", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lateFee">Late Fee ($)</Label>
                <Input
                  id="lateFee"
                  value={settings.lateFee}
                  onChange={(e) => handleInputChange("lateFee", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="gracePeriod">Grace Period (days)</Label>
                <Input
                  id="gracePeriod"
                  value={settings.gracePeriod}
                  onChange={(e) => handleInputChange("gracePeriod", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Notification Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <Label>Email Notifications</Label>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => handleInputChange("emailNotifications", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Smartphone className="h-4 w-4" />
                <Label>SMS Notifications</Label>
              </div>
              <Switch
                checked={settings.smsNotifications}
                onCheckedChange={(checked) => handleInputChange("smsNotifications", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell className="h-4 w-4" />
                <Label>Push Notifications</Label>
              </div>
              <Switch
                checked={settings.pushNotifications}
                onCheckedChange={(checked) => handleInputChange("pushNotifications", checked)}
              />
            </div>
            <div>
              <Label htmlFor="reminderDays">Payment Reminder (days before due)</Label>
              <Input
                id="reminderDays"
                value={settings.reminderDays}
                onChange={(e) => handleInputChange("reminderDays", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Security Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                <Input
                  id="sessionTimeout"
                  value={settings.sessionTimeout}
                  onChange={(e) => handleInputChange("sessionTimeout", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="passwordExpiry">Password Expiry (days)</Label>
                <Input
                  id="passwordExpiry"
                  value={settings.passwordExpiry}
                  onChange={(e) => handleInputChange("passwordExpiry", e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Two-Factor Authentication</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={settings.twoFactorAuth}
                  onCheckedChange={(checked) => handleInputChange("twoFactorAuth", checked)}
                />
                <Badge variant={settings.twoFactorAuth ? "default" : "secondary"}>
                  {settings.twoFactorAuth ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Terms and Policies */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Terms and Policies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="termsOfService">Terms of Service</Label>
              <Textarea
                id="termsOfService"
                value={settings.termsOfService}
                onChange={(e) => handleInputChange("termsOfService", e.target.value)}
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="privacyPolicy">Privacy Policy</Label>
              <Textarea
                id="privacyPolicy"
                value={settings.privacyPolicy}
                onChange={(e) => handleInputChange("privacyPolicy", e.target.value)}
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="cancellationPolicy">Cancellation Policy</Label>
              <Textarea
                id="cancellationPolicy"
                value={settings.cancellationPolicy}
                onChange={(e) => handleInputChange("cancellationPolicy", e.target.value)}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
