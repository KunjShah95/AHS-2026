import { useState } from 'react'
import { motion } from 'framer-motion'
import { Save, User, Bell, Palette, Shield, Key, Github } from 'lucide-react'

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'api', label: 'API Keys', icon: Key },
]

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile')

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
          Settings
        </h1>
        <p className="text-[var(--muted-foreground)]">Manage your account preferences and configurations</p>
      </motion.div>

      <div className="grid grid-cols-5 gap-6">
        {/* Sidebar */}
        <div className="col-span-1">
          <nav className="bg-white rounded-xl p-3 border border-[var(--border-subtle)] shadow-sm space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all ${
                    activeTab === tab.id
                      ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="col-span-4">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl p-6 border border-[var(--border-subtle)] shadow-sm"
          >
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Profile Information</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-[var(--muted-foreground)] mb-2">Full Name</label>
                      <input
                        type="text"
                        className="input-field"
                        defaultValue="John Developer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-[var(--muted-foreground)] mb-2">Email</label>
                      <input
                        type="email"
                        className="input-field"
                        defaultValue="john@example.com"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm text-[var(--muted-foreground)] mb-2">Bio</label>
                      <textarea
                        className="input-field"
                        rows={3}
                        defaultValue="Full-stack developer passionate about code intelligence systems."
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button className="btn btn-primary flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Notification Preferences</h2>
                <div className="space-y-4">
                  {[
                    { label: 'Email notifications for analysis completions', checked: true },
                    { label: 'Weekly digest of repository updates', checked: true },
                    { label: 'Team activity notifications', checked: false },
                    { label: 'Security alerts', checked: true },
                  ].map((item, i) => (
                    <label key={i} className="flex items-center justify-between py-3 border-b border-[var(--border-subtle)]">
                      <span className="text-[var(--text-primary)]">{item.label}</span>
                      <input
                        type="checkbox"
                        defaultChecked={item.checked}
                        className="w-5 h-5 accent-[var(--accent)]"
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Appearance</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-[var(--muted-foreground)] mb-2">Theme</label>
                    <select className="input-field">
                      <option>Light (Default)</option>
                      <option>Dark</option>
                      <option>System</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--muted-foreground)] mb-2">Accent Color</label>
                    <div className="flex gap-3">
                      {['#22D3EE', '#10B981', '#8B5CF6', '#F59E0B', '#F43F5E'].map((color) => (
                        <button
                          key={color}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${
                            color === '#22D3EE' ? 'border-gray-800 scale-110' : 'border-transparent hover:scale-110'
                          }`}
                          style={{ background: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Security Settings</h2>
                <div className="space-y-4">
                  <button className="btn btn-secondary w-full justify-start">
                    Change Password
                  </button>
                  <button className="btn btn-secondary w-full justify-start">
                    Enable Two-Factor Authentication
                  </button>
                  <button className="btn btn-secondary w-full justify-start">
                    View Active Sessions
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'api' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">API Keys</h2>
                <div className="p-4 bg-[var(--bg-surface)] rounded-lg border border-[var(--border-subtle)]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Github className="w-5 h-5" />
                      <span className="font-medium text-[var(--text-primary)]">GitHub Token</span>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                      Active
                    </span>
                  </div>
                  <p className="text-sm text-[var(--muted-foreground)]">Used for repository cloning and analysis</p>
                </div>
                <button className="btn btn-secondary">Generate New API Key</button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}