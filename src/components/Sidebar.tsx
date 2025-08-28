import React from 'react';
import { LayoutDashboard, Users, Package, AlertTriangle, Settings, Truck } from 'lucide-react';
import { NavItem } from '../types';

interface SidebarProps {
  activeNav: NavItem;
  onNavChange: (nav: NavItem) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeNav, onNavChange }) => {
  const navItems = [
    { id: 'dashboard' as NavItem, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'customers' as NavItem, label: 'Customers', icon: Users },
    { id: 'inventory' as NavItem, label: 'Rental Inventory', icon: Package },
    { id: 'alerts' as NavItem, label: 'Alerts', icon: AlertTriangle },
    { id: 'settings' as NavItem, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-white dark:bg-brand-accent border-r border-gray-200 dark:border-gray-700 h-full flex flex-col shadow-lg animate-slide-in">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-brand-primary to-brand-primary-light">
        <div className="flex items-center space-x-3 animate-fade-in">
          <div className="bg-brand-accent p-3 rounded-xl shadow-brand transform hover:scale-110 transition-transform duration-200">
            <Truck className="h-7 w-7 text-brand-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-brand-accent">EcoTrackAI</h1>
            <p className="text-sm text-brand-secondary opacity-80">Dealer Portal</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4 bg-white dark:bg-brand-accent">
        <ul className="space-y-2">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <li key={item.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <button
                  onClick={() => onNavChange(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-300 transform hover:scale-105 group ${
                    activeNav === item.id
                      ? 'bg-brand-primary text-brand-accent shadow-brand-lg'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-brand-primary/10 dark:hover:bg-gray-800 hover:shadow-md'
                  }`}
                >
                  <Icon className={`h-5 w-5 transition-colors duration-200 ${
                    activeNav === item.id 
                      ? 'text-brand-accent' 
                      : 'text-gray-500 group-hover:text-brand-primary'
                  }`} />
                  <span className="font-medium">{item.label}</span>
                  {activeNav === item.id && (
                    <div className="ml-auto w-2 h-2 bg-brand-accent rounded-full animate-pulse-slow"></div>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-brand-secondary">
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 px-3 py-2 bg-brand-primary/10 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium text-brand-accent dark:text-gray-300">System Online</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;