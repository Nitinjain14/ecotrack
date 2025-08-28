import React from 'react';
import { Eye, MapPin, Calendar, Wrench } from 'lucide-react';
import { Customer } from '../types';

interface CustomerRentalsTableProps {
  customers: Customer[];
  onViewDetails: (customer: Customer) => void;
}

const CustomerRentalsTable: React.FC<CustomerRentalsTableProps> = ({ customers, onViewDetails }) => {
  const getStatusBadge = (status: Customer['status']) => {
    const baseClasses = "px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all duration-200";
    switch (status) {
      case 'Active':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 shadow-sm`;
      case 'Overdue':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 shadow-sm animate-pulse`;
      case 'Maintenance':
        return `${baseClasses} bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 shadow-sm`;
      default:
        return baseClasses;
    }
  };

  const getStatusIcon = (status: Customer['status']) => {
    switch (status) {
      case 'Active':
        return <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>;
      case 'Overdue':
        return <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>;
      case 'Maintenance':
        return <Wrench className="w-3 h-3 text-amber-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-brand-accent rounded-2xl shadow-brand border border-gray-200 dark:border-gray-700 overflow-hidden animate-fade-in">
      <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-brand-primary/5 to-brand-primary/10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-brand-accent dark:text-white">Active Customer Rentals</h3>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Monitor and manage all active equipment rentals</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-brand-primary rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-brand-accent dark:text-gray-300">Live Data</span>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-brand-secondary">
            <tr>
              <th className="px-8 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Customer Details
              </th>
              <th className="px-8 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Site Information
              </th>
              <th className="px-8 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Equipment Count
              </th>
              <th className="px-8 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-8 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-brand-accent divide-y divide-gray-200 dark:divide-gray-700">
            {customers.map((customer, index) => (
              <tr 
                key={customer.id} 
                className="hover:bg-brand-primary/5 dark:hover:bg-gray-700 transition-all duration-200 animate-fade-in group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <td className="px-8 py-6 whitespace-nowrap">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-brand-primary to-brand-primary-light rounded-xl flex items-center justify-center text-brand-accent font-bold text-lg shadow-brand">
                      {customer.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-lg font-bold text-brand-accent dark:text-white group-hover:text-brand-primary transition-colors duration-200">
                        {customer.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">ID: {customer.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-brand-primary" />
                    <span className="text-sm font-medium text-brand-accent dark:text-white">{customer.siteId}</span>
                  </div>
                </td>
                <td className="px-8 py-6 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <div className="text-2xl font-bold text-brand-primary">{customer.machineCount}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">machines</div>
                  </div>
                </td>
                <td className="px-8 py-6 whitespace-nowrap">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(customer.status)}
                    <span className={getStatusBadge(customer.status)}>
                      {customer.status}
                    </span>
                  </div>
                </td>
                <td className="px-8 py-6 whitespace-nowrap">
                  <button
                    onClick={() => onViewDetails(customer)}
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-brand-primary hover:bg-brand-primary-light text-brand-accent text-sm font-bold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-brand hover:shadow-brand-lg"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View Details</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomerRentalsTable;