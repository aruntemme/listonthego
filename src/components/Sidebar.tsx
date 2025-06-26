import React, { useState } from 'react';
import { CheckSquare, FileText, Calendar, Settings, ChevronLeft, User, LayoutDashboard } from 'lucide-react';
import { TabType } from '../types';

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const tabs = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'todos' as TabType, label: 'Todos', icon: CheckSquare },
    { id: 'notes' as TabType, label: 'Notes', icon: FileText },
    { id: 'habits' as TabType, label: 'Habits', icon: Calendar },
  ];

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-72'} flex flex-col h-full transition-all duration-300 ease-in-out`}>
      {/* App Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between pt-5">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
                <img src="/memo.png" alt="ListOnTheGo Logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 tracking-tight">ListOnTheGo</h1>
              </div>
            </div>
          )}
          {isCollapsed ?
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
             <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
                <img src="/memo.png" alt="ListOnTheGo Logo" className="w-full h-full object-cover" />
              </div>
          </button>
          :
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
        }
        </div>
      </div>

      {/* User Section */}
      {!isCollapsed && (
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">👋 Welcome</p>
              <p className="text-xs text-gray-500">Ready to be productive?</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <nav className="flex-1 pt-4">
        <div className="space-y-1 px-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-start px-3'} py-3 rounded-lg transition-all duration-200 group ${
                  isActive 
                    ? 'bg-gray-900 text-white shadow-lg' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                title={isCollapsed ? tab.label : undefined}
              >
                <Icon size={20} strokeWidth={1.5} className={isActive ? 'text-white' : ''} />
                {!isCollapsed && (
                  <span className="ml-3 text-sm font-medium">{tab.label}</span>
                )}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
                    {tab.label}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Settings at bottom */}
      <div className="p-2 border-t border-gray-200 bg-white">
        <button
          onClick={() => onTabChange('settings')}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-start px-3'} py-3 rounded-lg transition-all duration-200 group ${
            activeTab === 'settings' 
              ? 'bg-gray-900 text-white shadow-lg' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
          title={isCollapsed ? 'Settings' : undefined}
        >
          <Settings size={20} strokeWidth={1.5} />
          {!isCollapsed && (
            <span className="ml-3 text-sm font-medium">Settings</span>
          )}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
              Settings
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar; 