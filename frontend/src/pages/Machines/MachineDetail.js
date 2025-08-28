import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { ArrowLeft, Edit, Calendar, DollarSign } from 'lucide-react';
import { machineAPI } from '../../services/api';
import { format } from 'date-fns';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import Badge from '../../components/UI/Badge';

const MachineDetail = () => {
  const { id } = useParams();

  const { data, isLoading, error } = useQuery(
    ['machine', id],
    () => machineAPI.getById(id)
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading machine: {error.message}</p>
      </div>
    );
  }

  const { machine, rentalHistory, currentRental } = data.data;

  const getConditionBadge = (condition) => {
    const variants = {
      'available': 'success',
      'rented': 'info',
      'reserved': 'warning',
      'under_maintenance': 'danger'
    };
    return variants[condition] || 'secondary';
  };

  const getRentalStatusBadge = (status) => {
    const variants = {
      'active': 'success',
      'completed': 'secondary',
      'overdue': 'danger'
    };
    return variants[status] || 'secondary';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/machines"
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{machine.machine_name}</h1>
            <p className="text-sm text-gray-500">
              {machine.machine_type} - {machine.model}
            </p>
          </div>
        </div>
        <button className="btn btn-primary">
          <Edit className="h-4 w-4" />
          Edit Machine
        </button>
      </div>

      {/* Machine Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Machine Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <Badge variant="secondary">{machine.machine_type}</Badge>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Condition
                </label>
                <Badge variant={getConditionBadge(machine.condition)}>
                  {machine.condition.replace('_', ' ')}
                </Badge>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model
                </label>
                <p className="text-sm text-gray-900">{machine.model}</p>
              </div>
              {machine.year && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year
                  </label>
                  <p className="text-sm text-gray-900">{machine.year}</p>
                </div>
              )}
              {machine.serial_number && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Serial Number
                  </label>
                  <p className="text-sm text-gray-900">{machine.serial_number}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Daily Rate
                </label>
                <p className="text-sm font-medium text-gray-900">${machine.daily_rate}</p>
              </div>
            </div>
          </div>

          {/* Current Rental */}
          {currentRental && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Current Rental</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer
                  </label>
                  <Link
                    to={`/customers/${currentRental.customer_id._id}`}
                    className="text-blue-600 hover:text-blue-500 font-medium"
                  >
                    {currentRental.customer_id.name}
                  </Link>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rented On
                  </label>
                  <p className="text-sm text-gray-900">
                    {format(new Date(currentRental.rented_on), 'MMM d, yyyy')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rental Amount
                  </label>
                  <p className="text-sm font-medium text-gray-900">
                    ${currentRental.rental_amount}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <Badge variant={getRentalStatusBadge(currentRental.status)}>
                    {currentRental.status}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Rental History */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Rental History</h3>
            {rentalHistory.length === 0 ? (
              <p className="text-gray-500">No rental history found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Rented On</th>
                      <th>Returned On</th>
                      <th>Condition</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rentalHistory.slice(0, 10).map((rental) => (
                      <tr key={rental._id}>
                        <td>
                          <Link
                            to={`/customers/${rental.customer_id._id}`}
                            className="text-blue-600 hover:text-blue-500 font-medium"
                          >
                            {rental.customer_id.name}
                          </Link>
                        </td>
                        <td>
                          <span className="text-sm text-gray-900">
                            {format(new Date(rental.rented_on), 'MMM d, yyyy')}
                          </span>
                        </td>
                        <td>
                          {rental.returned_on ? (
                            <span className="text-sm text-gray-900">
                              {format(new Date(rental.returned_on), 'MMM d, yyyy')}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-500">-</span>
                          )}
                        </td>
                        <td>
                          {rental.return_condition ? (
                            <Badge variant={rental.return_condition === 'good' ? 'success' : 'warning'}>
                              {rental.return_condition}
                            </Badge>
                          ) : (
                            <span className="text-sm text-gray-500">-</span>
                          )}
                        </td>
                        <td>${rental.rental_amount}</td>
                        <td>
                          <Badge variant={getRentalStatusBadge(rental.status)}>
                            {rental.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Availability */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Availability
            </h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600">Current Status</span>
                <div className="mt-1">
                  <Badge variant={getConditionBadge(machine.condition)} size="lg">
                    {machine.condition.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
              {machine.expected_return_date && (
                <div>
                  <span className="text-sm text-gray-600">Expected Return</span>
                  <p className="text-sm font-medium">
                    {format(new Date(machine.expected_return_date), 'MMM d, yyyy')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              <DollarSign className="inline h-5 w-5 mr-2" />
              Pricing
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Daily Rate</span>
                <span className="text-sm font-medium">${machine.daily_rate}</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div>
                <div className="text-2xl font-bold text-gray-900">{rentalHistory.length}</div>
                <div className="text-sm text-gray-500">Total Rentals</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {rentalHistory.filter(r => r.return_condition === 'good').length}
                </div>
                <div className="text-sm text-gray-500">Good Returns</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MachineDetail;