"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  UserIcon,
  BellIcon,
  ShieldIcon,
  GlobeIcon,
  PaletteIcon,
  SaveIcon,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";

export default function Settings() {
  const [isSaving, setIsSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    // Profile
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    company: "Company Inc.",
    
    // Notifications
    emailNotifications: true,
    pushNotifications: true,
    weeklyDigest: true,
    
    // Preferences
    language: "en",
    timezone: "America/New_York",
    currency: "USD",
    theme: "system",
  });

  // Load theme from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const savedThemeMode = localStorage.getItem("themeMode") as "light" | "dark" | "system" | null;
    
    if (savedThemeMode) {
      setFormData((prev) => ({ ...prev, theme: savedThemeMode }));
    } else if (savedTheme) {
      setFormData((prev) => ({ ...prev, theme: savedTheme }));
    }
  }, []);

  // Apply theme function
  const applyTheme = (themeMode: string) => {
    if (themeMode === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      localStorage.removeItem("theme");
      localStorage.setItem("themeMode", "system");
    } else {
      if (themeMode === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      localStorage.setItem("theme", themeMode);
      localStorage.setItem("themeMode", themeMode);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Apply theme change immediately
    if (name === "theme") {
      applyTheme(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log("Settings saved:", formData);
    setIsSaving(false);
  };

  return (
    <>
      <div className='w-full sticky top-0 z-50 bg-white dark:bg-neutral-950 flex-shrink-0 flex flex-row h-16 items-center px-8 border-b border-neutral-200 dark:border-neutral-800'>
        <h1 className='text-lg font-bold'>Settings</h1>
        <div className="ml-auto flex gap-2">
          <Button
            type="submit"
            form="settings-form"
            disabled={isSaving}
          >
            <SaveIcon className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="max-w-4xl w-full mx-auto flex-1 p-8">
        <form id="settings-form" onSubmit={handleSubmit} className="space-y-6">

          {/* Profile Information Card */}
          <Card className="bg-transparent p-0 overflow-hidden">
            <div className="bg-card p-4 border-none flex items-center gap-3">
              <div className="p-2 rounded-md bg-primary/10">
                <UserIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold">Profile Information</h2>
                <p className="text-xs text-muted-foreground">Update your personal details</p>
              </div>
            </div>
            <div className="space-y-4 px-4 pb-6">
              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium mb-2">
                    First Name
                  </label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium mb-2">
                    Last Name
                  </label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>

              {/* Phone and Company */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium mb-2">
                    Phone
                  </label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label htmlFor="company" className="block text-sm font-medium mb-2">
                    Company
                  </label>
                  <Input
                    id="company"
                    name="company"
                    type="text"
                    value={formData.company}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Security Card */}
          <Card className="bg-transparent p-0 overflow-hidden">
            <div className="bg-card p-4 border-none flex items-center gap-3">
              <div className="p-2 rounded-md bg-primary/10">
                <ShieldIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold">Security</h2>
                <p className="text-xs text-muted-foreground">Manage your password and security settings</p>
              </div>
            </div>
            <div className="px-4 pb-6">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <p className="font-medium">Password</p>
                  <p className="text-sm text-muted-foreground">Last changed 3 months ago</p>
                </div>
                <Button variant="outline" size="sm">
                  Change Password
                </Button>
              </div>
            </div>
          </Card>

          {/* Notifications Card */}
          <Card className="bg-transparent p-0 overflow-hidden">
            <div className="bg-card p-4 border-none flex items-center gap-3">
              <div className="p-2 rounded-md bg-primary/10">
                <BellIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold">Notifications</h2>
                <p className="text-xs text-muted-foreground">Choose what notifications you receive</p>
              </div>
            </div>
            <div className="space-y-4 px-4 pb-6">
              {/* Email Notifications */}
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive email updates about your account</p>
                </div>
                <Switch />
              </div>

              {/* Push Notifications */}
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive push notifications on your device</p>
                </div>
                <Switch />
              </div>

              {/* Weekly Digest */}
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <p className="font-medium">Weekly Digest</p>
                  <p className="text-sm text-muted-foreground">Get a weekly summary of your activity</p>
                </div>
                <Switch />
              </div>
            </div>
          </Card>

          {/* Preferences Card */}
          <Card className="bg-transparent p-0 overflow-hidden">
            <div className="bg-card p-4 border-none flex items-center gap-3">
              <div className="p-2 rounded-md bg-primary/10">
                <GlobeIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold">Preferences</h2>
                <p className="text-xs text-muted-foreground">Customize your experience</p>
              </div>
            </div>
            <div className="space-y-4 px-4 pb-6 pt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Language */}
              <div>
                <label htmlFor="language" className="block text-sm font-medium mb-2">
                  Language
                </label>
                <Select
                  value={formData.language}
                  onValueChange={(value) => handleSelectChange("language", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="it">Italian</SelectItem>
                    <SelectItem value="pt">Portuguese</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Timezone */}
              <div>
                <label htmlFor="timezone" className="block text-sm font-medium mb-2">
                  Timezone
                </label>
                <Select
                  value={formData.timezone}
                  onValueChange={(value) => handleSelectChange("timezone", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                    <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                    <SelectItem value="Europe/London">London (GMT)</SelectItem>
                    <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                    <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Currency */}
              <div>
                <label htmlFor="currency" className="block text-sm font-medium mb-2">
                  Currency
                </label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => handleSelectChange("currency", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="JPY">JPY (¥)</SelectItem>
                    <SelectItem value="AUD">AUD (A$)</SelectItem>
                    <SelectItem value="CAD">CAD (C$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Appearance Card */}
          <Card className="bg-transparent p-0 overflow-hidden">
            <div className="bg-card p-4 border-none flex items-center gap-3">
              <div className="p-2 rounded-md bg-primary/10">
                <PaletteIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold">Appearance</h2>
                <p className="text-xs text-muted-foreground">Customize how the app looks</p>
              </div>
            </div>
            <div className="px-4 pb-6">
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => handleSelectChange("theme", "light")}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.theme === "light"
                      ? "border-primary bg-primary/5"
                      : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700"
                  }`}
                >
                  <div className="w-full h-16 bg-white border border-neutral-200 rounded mb-2"></div>
                  <p className="text-sm font-medium">Light</p>
                </button>
                
                <button
                  type="button"
                  onClick={() => handleSelectChange("theme", "dark")}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.theme === "dark"
                      ? "border-primary bg-primary/5"
                      : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700"
                  }`}
                >
                  <div className="w-full h-16 bg-neutral-900 border border-neutral-800 rounded mb-2"></div>
                  <p className="text-sm font-medium">Dark</p>
                </button>
                
                <button
                  type="button"
                  onClick={() => handleSelectChange("theme", "system")}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.theme === "system"
                      ? "border-primary bg-primary/5"
                      : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700"
                  }`}
                >
                  <div className="w-full h-16 bg-gradient-to-r from-white via-neutral-400 to-neutral-900 border border-neutral-200 rounded mb-2"></div>
                  <p className="text-sm font-medium">System</p>
                </button>
              </div>
            </div>
          </Card>

        </form>
      </div>
    </>
  );
}
