import React, { useState } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import Sidebar from './components/Sidebar';
import TopNavigation from './components/TopNavigation';
import Dashboard from './components/Dashboard';
import { NavItem } from './types';
import { mockCustomers, mockMachines, mockAvailableMachines } from './mockdata/mockdata';

function App() {
  const [activeNav, setActiveNav] = useState<NavItem>('dashboard');

  const renderContent = () => {
    switch (activeNav) {
      case 'dashboard':
        return (
          <Dashboard 
            customers={mockCustomers}
            machines={mockMachines}
            availableMachines={mockAvailableMachines}
          />
        );
      case 'customers':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <h2 className="text-2xl font-bold text-brand-accent dark:text-white mb-4">Customers</h2>
            <p className="text-gray-500 dark:text-gray-400">Customer management section coming soon...</p>
          </div>
        );
      case 'inventory':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <h2 className="text-2xl font-bold text-brand-accent dark:text-white mb-4">Rental Inventory</h2>
            <p className="text-gray-500 dark:text-gray-400">Inventory management section coming soon...</p>
          </div>
        );
      case 'alerts':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <h2 className="text-2xl font-bold text-brand-accent dark:text-white mb-4">Alerts</h2>
            <p className="text-gray-500 dark:text-gray-400">Alerts and notifications section coming soon...</p>
          </div>
        );
      case 'settings':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <h2 className="text-2xl font-bold text-brand-accent dark:text-white mb-4">Settings</h2>
            <p className="text-gray-500 dark:text-gray-400">Settings and profile section coming soon...</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <ThemeProvider>
      <div className="flex h-screen bg-gray-100 dark:bg-gray-950 transition-colors duration-200">
        <Sidebar activeNav={activeNav} onNavChange={setActiveNav} />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopNavigation dealerName="Prime Equipment Rentals" notificationCount={3} />
          
          <main className="flex-1 overflow-auto p-6">
            {renderContent()}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;