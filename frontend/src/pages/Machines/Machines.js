import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { Plus, Search } from 'lucide-react';
import { machineAPI } from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import Badge from '../../components/UI/Badge';

const Machines = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [machine_type, setMachineType] = useState('');
  const [condition, setCondition] = useState('');

  const { data, isLoading, error } = useQuery(
    ['machines', page, search, machine_type, condition],
    () => machineAPI.getAll({ page, search, machine_type, condition, limit: 10 }),
    {
      keepPreviousData: true,
    }
  );

  const machineTypes = [
    'Bulldozer', 'Excavator', 'Loader', 'Crane', 'Grader', 'Dump Truck', 'Forklift', 'Backhoe', 'Skid Steer', 'Other'
  ];

  const conditions = ['available', 'reserved', 'rented', 'under_maintenance'];

  const getConditionBadge = (condition) => {
    const variants = {
      'available': 'success',
      'rented': 'info',
      'reserved': 'warning',
      'under_maintenance': 'danger'
    };
    return variants[condition] || 'secondary';
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading machines: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Machines</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your equipment inventory and rental status
          </p>
        </div>
        <Link
          to="/machines/new"
          className="btn btn-primary"
        >
          <Plus className="h-4 w-4" />
          Add Machine
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search machines..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 form-input"
              />
            </div>
          </div>
          <div>
            <select
              value={machine_type}
              onChange={(e) => setMachineType(e.target.value)}
              className="form-select"
            >
              <option value="">All Types</option>
              {machineTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="form-select"
            >
              <option value="">All Conditions</option>
              {conditions.map(cond => (
                <option key={cond} value={cond}>{cond.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Machine List */}
      <div className="bg-white shadow rounded-lg">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Machine</th>
                    <th>Type</th>
                    <th>Model</th>
                    <th>Condition</th>
                    <th>Daily Rate</th>
                    <th>Expected Return</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.data?.map((machine) => (
                    <tr key={machine._id}>
                      <td>
                        <div className="font-medium text-gray-900">{machine.machine_name}</div>
                      </td>
                      <td>
                        <Badge variant="secondary">{machine.machine_type}</Badge>
                      </td>
                      <td>
                        <span className="text-sm text-gray-900">{machine.model}</span>
                      </td>
                      <td>
                        <Badge variant={getConditionBadge(machine.condition)}>
                          {machine.condition.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td>
                        <span className="text-sm font-medium text-gray-900">
                          ${machine.daily_rate}
                        </span>
                      </td>
                      <td>
                        {machine.expected_return_date ? (
                          <span className="text-sm text-gray-900">
                            {new Date(machine.expected_return_date).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                      <td>
                        <Link
                          to={`/machines/${machine._id}`}
                          className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data?.pagination && data.pagination.pages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing page {data.pagination.current} of {data.pagination.pages}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="btn btn-outline btn-sm"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page >= data.pagination.pages}
                      className="btn btn-outline btn-sm"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Machines;