"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Briefcase, 
  UserCheck, 
  Settings, 
  BarChart, 
  Upload,
  Search,
  MessageSquare,
  Activity,
  Building
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [activeTab, setActiveTab] = useState('jobs');

  const navigation = [
    { id: 'companies', name: 'Companies', icon: Building },
    { id: 'users', name: 'Users', icon: Users },
    { id: 'jobs', name: 'Jobs', icon: Briefcase },
    { id: 'candidates', name: 'Candidates', icon: UserCheck },
    { id: 'matches', name: 'Job Matches', icon: Search },
    { id: 'batch-uploads', name: 'Batch Uploads', icon: Upload },
    { id: 'analytics', name: 'Analytics', icon: BarChart },
    { id: 'audit-logs', name: 'Audit Logs', icon: Activity },
    { id: 'settings', name: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900">JobMatcher</h1>
          <p className="text-sm text-gray-600">SaaS Platform</p>
        </div>
        <nav className="mt-6">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center px-6 py-3 text-left hover:bg-gray-50 ${
                  activeTab === item.id ? 'bg-blue-50 border-r-2 border-blue-500 text-blue-700' : 'text-gray-700'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}