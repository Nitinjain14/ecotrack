import React from 'react';
import { X, Clock, Fuel, Leaf, Wrench, Calendar, MapPin, Activity } from 'lucide-react';
import { Customer, Machine } from '../types';

interface MachineDetailsModalProps {
  customer: Customer;
  machines: Machine[];
  isOpen: boolean;
  onClose: () => void;
}

const MachineDetailsModal: React.FC<MachineDetailsModalProps> = ({ 
  customer, 
  machines, 
  isOpen, 
  onClose 
}) => {
  if (!isOpen) return null;

  const customerMachines = machines.filter(m => m.customerId === customer.id);

  const getConditionBadge = (condition: Machine['condition']) => {
    const baseClasses = "px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide";
    switch (condition) {
      case 'Good':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`;
      case 'Needs Maintenance':
        return `${baseClasses} bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200`;
      case 'Critical':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 animate-pulse`;
      default:
        return baseClasses;
    }
  };

  const getConditionIcon = (condition: Machine['condition']) => {
    switch (condition) {
      case 'Good':
        return <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>;
      case 'Needs Maintenance':
        return <div className="w-4 h-4 bg-amber-500 rounded-full animate-pulse"></div>;
      case 'Critical':
        return <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>;
      default:
        return <div className="w-4 h-4 bg-gray-500 rounded-full"></div>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto animate-fade-in">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-black bg-opacity-50 backdrop-blur-sm" onClick={onClose}></div>

        <div className="inline-block w-full max-w-7xl p-8 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-brand-accent shadow-2xl rounded-2xl animate-scale-in">
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-brand-primary to-brand-primary-light rounded-2xl flex items-center justify-center text-brand-accent font-bold text-2xl shadow-brand">
                {customer.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-3xl font-bold text-brand-accent dark:text-white">{customer.name}</h3>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-brand-primary" />
                    <span className="text-gray-600 dark:text-gray-400">Site: {customer.siteId}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-green-600">{customerMachines.length} Active Machines</span>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-3 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 transform hover:scale-110"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {customerMachines.map((machine, index) => (
              <div 
                key={machine.id} 
                className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-brand-secondary dark:to-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-brand-lg transition-all duration-300 transform hover:scale-105 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h4 className="text-xl font-bold text-brand-accent dark:text-white">{machine.id}</h4>
                    <p className="text-gray-600 dark:text-gray-300 font-medium">{machine.type}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getConditionIcon(machine.condition)}
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center py-3 px-4 bg-white dark:bg-brand-accent rounded-xl">
                    <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>Site:</span>
                    </span>
                    <span className="text-sm font-bold text-brand-accent dark:text-white">{machine.site}</span>
                  </div>

                  <div className="flex justify-between items-center py-3 px-4 bg-white dark:bg-brand-accent rounded-xl">
                    <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>Check-In:</span>
                    </span>
                    <span className="text-sm font-bold text-brand-accent dark:text-white">{machine.checkIn}</span>
                  </div>

                  <div className="flex justify-between items-center py-3 px-4 bg-white dark:bg-brand-accent rounded-xl">
                    <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>Return Due:</span>
                    </span>
                    <span className="text-sm font-bold text-brand-accent dark:text-white">{machine.returnDue}</span>
                  </div>

                  <div className="flex justify-between items-center py-3 px-4 bg-white dark:bg-brand-accent rounded-xl">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Condition:</span>
                    <span className={getConditionBadge(machine.condition)}>{machine.condition}</span>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-200 dark:border-gray-600">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                      <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                        <Clock className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Runtime</p>
                        <p className="text-lg font-bold text-brand-accent dark:text-white">{machine.runtime}h</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                      <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-lg">
                        <Wrench className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Idle Time</p>
                        <p className="text-lg font-bold text-brand-accent dark:text-white">{machine.idleTime}h</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                      <div className="p-2 bg-orange-100 dark:bg-orange-800 rounded-lg">
                        <Fuel className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Fuel Used</p>
                        <p className="text-lg font-bold text-brand-accent dark:text-white">{machine.fuelUsed}L</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                      <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg">
                        <Leaf className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">CO₂ Emitted</p>
                        <p className="text-lg font-bold text-brand-accent dark:text-white">{machine.co2Emitted}kg</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
            <button
              onClick={onClose}
              className="px-8 py-3 bg-brand-primary hover:bg-brand-primary-light text-brand-accent font-bold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-brand hover:shadow-brand-lg"
            >
              Close Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MachineDetailsModal;