import React, { useState } from 'react';
import { TrendingUp, Users, Package, AlertTriangle } from 'lucide-react';
import CustomerRentalsTable from './CustomerRentalTable';
import MachineDetailsModal from './MachinesDetailModel';
import AvailableMachines from './AvailableMachine';
import { Customer, Machine, AvailableMachine } from '../types';

interface DashboardProps {
  customers: Customer[];
  machines: Machine[];
  availableMachines: AvailableMachine[];
}

const Dashboard: React.FC<DashboardProps> = ({ customers, machines, availableMachines }) => {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCustomer(null);
  };

  // Calculate statistics
  const activeCustomers = customers.filter(c => c.status === 'Active').length;
  const overdueCustomers = customers.filter(c => c.status === 'Overdue').length;
  const totalMachines = machines.length;
  const availableEquipment = availableMachines.filter(m => m.status === 'Available').length;

  const stats = [
    {
      title: 'Active Customers',
      value: activeCustomers,
      icon: Users,
      color: 'from-green-400 to-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-600',
    },
    {
      title: 'Total Equipment',
      value: totalMachines,
      icon: Package,
      color: 'from-brand-primary to-brand-primary-light',
      bgColor: 'bg-brand-primary/10',
      textColor: 'text-brand-primary',
    },
    {
      title: 'Available Units',
      value: availableEquipment,
      icon: TrendingUp,
      color: 'from-blue-400 to-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-600',
    },
    {
      title: 'Overdue Rentals',
      value: overdueCustomers,
      icon: AlertTriangle,
      color: 'from-red-400 to-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      textColor: 'text-red-600',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="bg-white dark:bg-brand-accent rounded-2xl p-6 shadow-brand border border-gray-200 dark:border-gray-700 hover:shadow-brand-lg transition-all duration-300 transform hover:scale-105 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-brand-accent dark:text-white">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-4 rounded-2xl ${stat.bgColor}`}>
                  <Icon className={`h-8 w-8 ${stat.textColor}`} />
                </div>
              </div>
              <div className="mt-4">
                <div className={`h-2 bg-gradient-to-r ${stat.color} rounded-full opacity-20`}></div>
                <div 
                  className={`h-2 bg-gradient-to-r ${stat.color} rounded-full -mt-2 animate-pulse`}
                  style={{ width: `${Math.min((stat.value / 10) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Customer Rentals Table */}
      <CustomerRentalsTable 
        customers={customers} 
        onViewDetails={handleViewDetails} 
      />
      
      {/* Available Machines */}
      <AvailableMachines machines={availableMachines} />

      {/* Machine Details Modal */}
      {selectedCustomer && (
        <MachineDetailsModal
          customer={selectedCustomer}
          machines={machines}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default Dashboard;