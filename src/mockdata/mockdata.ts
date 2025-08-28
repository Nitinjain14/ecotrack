import { Customer, Machine, AvailableMachine } from '../types';

export const mockCustomers: Customer[] = [
  { id: 'C001', name: 'BuildCorp Construction', siteId: 'SITE001', machineCount: 3, status: 'Active' },
  { id: 'C002', name: 'Metro Infrastructure', siteId: 'SITE002', machineCount: 2, status: 'Overdue' },
  { id: 'C003', name: 'Skyline Developers', siteId: 'SITE003', machineCount: 4, status: 'Active' },
  { id: 'C004', name: 'Urban Projects Ltd', siteId: 'SITE004', machineCount: 1, status: 'Maintenance' },
  { id: 'C005', name: 'Coastal Construction', siteId: 'SITE005', machineCount: 2, status: 'Active' },
];

export const mockMachines: Machine[] = [
  {
    id: 'EQX1001',
    type: 'Bulldozer',
    customerId: 'C001',
    customerName: 'BuildCorp Construction',
    site: 'SITE001',
    checkIn: '25 Aug 2025',
    condition: 'Good',
    runtime: 6.5,
    idleTime: 2.0,
    fuelUsed: 35,
    co2Emitted: 90,
    returnDue: '28 Aug 2025'
  },
  {
    id: 'EQX1002',
    type: 'Excavator',
    customerId: 'C001',
    customerName: 'BuildCorp Construction',
    site: 'SITE001',
    checkIn: '24 Aug 2025',
    condition: 'Needs Maintenance',
    runtime: 8.2,
    idleTime: 1.5,
    fuelUsed: 42,
    co2Emitted: 108,
    returnDue: '29 Aug 2025'
  },
  {
    id: 'EQX1003',
    type: 'Loader',
    customerId: 'C001',
    customerName: 'BuildCorp Construction',
    site: 'SITE001',
    checkIn: '26 Aug 2025',
    condition: 'Good',
    runtime: 4.8,
    idleTime: 3.2,
    fuelUsed: 28,
    co2Emitted: 72,
    returnDue: '30 Aug 2025'
  },
  {
    id: 'EQX1004',
    type: 'Crane',
    customerId: 'C002',
    customerName: 'Metro Infrastructure',
    site: 'SITE002',
    checkIn: '20 Aug 2025',
    condition: 'Critical',
    runtime: 12.5,
    idleTime: 0.8,
    fuelUsed: 65,
    co2Emitted: 168,
    returnDue: '26 Aug 2025'
  },
  {
    id: 'EQX1005',
    type: 'Grader',
    customerId: 'C002',
    customerName: 'Metro Infrastructure',
    site: 'SITE002',
    checkIn: '22 Aug 2025',
    condition: 'Good',
    runtime: 7.3,
    idleTime: 2.1,
    fuelUsed: 38,
    co2Emitted: 98,
    returnDue: '27 Aug 2025'
  }
];

export const mockAvailableMachines: AvailableMachine[] = [
  { id: 'EQX1006', type: 'Grader', location: 'Depot A', status: 'Available' },
  { id: 'EQX1007', type: 'Bulldozer', location: 'Depot B', status: 'Available' },
  { id: 'EQX1008', type: 'Excavator', location: 'Depot A', status: 'Maintenance' },
  { id: 'EQX1009', type: 'Loader', location: 'Depot C', status: 'Available' },
  { id: 'EQX1010', type: 'Crane', location: 'Depot A', status: 'Available' },
];