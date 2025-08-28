export interface Customer {
  id: string;
  name: string;
  siteId: string;
  machineCount: number;
  status: 'Active' | 'Overdue' | 'Maintenance';
}

export interface Machine {
  id: string;
  type: string;
  customerId: string;
  customerName: string;
  site: string;
  checkIn: string;
  condition: 'Good' | 'Needs Maintenance' | 'Critical';
  runtime: number;
  idleTime: number;
  fuelUsed: number;
  co2Emitted: number;
  returnDue: string;
}

export interface AvailableMachine {
  id: string;
  type: string;
  location: string;
  status: 'Available' | 'Maintenance';
}

export type NavItem = 'dashboard' | 'customers' | 'inventory' | 'alerts' | 'settings';