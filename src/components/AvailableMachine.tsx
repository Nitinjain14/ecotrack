import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Settings, MapPin, Wrench, CheckCircle } from 'lucide-react';
import { AvailableMachine } from '../types';

interface AvailableMachinesProps {
  machines: AvailableMachine[];
}

const AvailableMachines: React.FC<AvailableMachinesProps> = ({ machines }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const getStatusBadge = (status: AvailableMachine['status']) => {
    const baseClasses = "px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all duration-200";
    switch (status) {
      case 'Available':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 shadow-sm`;
      case 'Maintenance':
        return `${baseClasses} bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 shadow-sm`;
      default:
        return baseClasses;
    }
  };

  const getStatusIcon = (status: AvailableMachine['status']) => {
    switch (status) {
      case 'Available':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Maintenance':
        return <Wrench className="h-4 w-4 text-amber-500" />;
      default:
        return null;
    }
  };

  const availableCount = machines.filter(m => m.status === 'Available').length;
  const maintenanceCount = machines.filter(m => m.status === 'Maintenance').length;

  return (
    <div className="bg-white dark:bg-brand-accent rounded-2xl shadow-brand border border-gray-200 dark:border-gray-700 overflow-hidden animate-fade-in">
      <div 
        className="px-8 py-6 border-b border-gray-200 dark:border-gray-700 cursor-pointer bg-gradient-to-r from-brand-primary/5 to-brand-primary/10 hover:from-brand-primary/10 hover:to-brand-primary/15 transition-all duration-300"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-brand-accent dark:text-white flex items-center space-x-3">
              <span>Available Equipment</span>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-600">{availableCount} Ready</span>
              </div>
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              <span className="font-semibold text-green-600">{availableCount} available</span>, 
              <span className="font-semibold text-amber-600 ml-1">{maintenanceCount} in maintenance</span>
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-3xl font-bold text-brand-primary">{machines.length}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Units</div>
            </div>
            <button className="p-2 hover:bg-brand-primary/10 rounded-lg transition-colors duration-200">
              {isExpanded ? (
                <ChevronUp className="h-6 w-6 text-gray-400 hover:text-brand-primary transition-colors duration-200" />
              ) : (
                <ChevronDown className="h-6 w-6 text-gray-400 hover:text-brand-primary transition-colors duration-200" />
              )}
            </button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-8 animate-scale-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {machines.map((machine, index) => (
              <div 
                key={machine.id} 
                className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-brand-secondary dark:to-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-brand-lg transition-all duration-300 transform hover:scale-105 animate-fade-in group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-xl font-bold text-brand-accent dark:text-white group-hover:text-brand-primary transition-colors duration-200">
                      {machine.id}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">{machine.type}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(machine.status)}
                    <span className={getStatusBadge(machine.status)}>
                      {machine.status}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 mb-6">
                  <MapPin className="h-5 w-5 text-brand-primary" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{machine.location}</span>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center py-2 px-3 bg-white dark:bg-brand-accent rounded-lg">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Equipment Type:</span>
                    <span className="text-sm font-bold text-brand-accent dark:text-white">{machine.type}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 px-3 bg-white dark:bg-brand-accent rounded-lg">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Location:</span>
                    <span className="text-sm font-bold text-brand-accent dark:text-white">{machine.location}</span>
                  </div>
                </div>

                <button 
                  className={`w-full px-6 py-3 text-sm font-bold rounded-xl transition-all duration-300 transform hover:scale-105 ${
                    machine.status === 'Available'
                      ? 'bg-brand-primary hover:bg-brand-primary-light text-brand-accent shadow-brand hover:shadow-brand-lg'
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  }`}
                  disabled={machine.status !== 'Available'}
                >
                  {machine.status === 'Available' ? 'Assign to Customer' : 'Under Maintenance'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AvailableMachines;