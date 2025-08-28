import React from 'react';
import { Bell, Sun, Moon, Search } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface TopNavigationProps {
  dealerName: string;
  notificationCount: number;
}

const TopNavigation: React.FC<TopNavigationProps> = ({ dealerName, notificationCount }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="bg-white dark:bg-brand-accent border-b border-gray-200 dark:border-gray-700 px-6 py-4 shadow-sm animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="animate-slide-in">
          <h2 className="text-3xl font-bold text-brand-accent dark:text-white bg-gradient-to-r from-brand-accent to-brand-secondary bg-clip-text">
            Dashboard
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Welcome back, <span className="font-semibold text-brand-primary">{dealerName}</span>
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative animate-scale-in">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search equipment..."
              className="pl-10 pr-4 py-2 w-64 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all duration-200"
            />
          </div>
          
          <button className="relative p-3 text-gray-500 dark:text-gray-400 hover:text-brand-primary dark:hover:text-brand-primary transition-all duration-200 hover:bg-brand-primary/10 rounded-lg group animate-bounce-subtle">
            <Bell className="h-6 w-6 group-hover:animate-pulse" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-brand-red text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold animate-pulse shadow-lg">
                {notificationCount}
              </span>
            )}
          </button>
          
          <button
            onClick={toggleTheme}
            className="p-3 text-gray-500 dark:text-gray-400 hover:text-brand-primary dark:hover:text-brand-primary transition-all duration-200 hover:bg-brand-primary/10 rounded-lg transform hover:scale-110 animate-scale-in"
          >
            {isDark ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
          </button>
          
          <div className="flex items-center space-x-3 pl-4 border-l border-gray-200 dark:border-gray-700 animate-fade-in">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-primary to-brand-primary-light rounded-full flex items-center justify-center text-brand-accent font-bold shadow-brand">
              {dealerName.charAt(0)}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-brand-accent dark:text-white">{dealerName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Administrator</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopNavigation;