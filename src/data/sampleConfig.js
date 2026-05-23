export const roleOptions = [
  'Admin',
  'Network Engineer',
  'Network Assistant',
  'Field Technician',
]

export const deviceTypeOptions = [
  'Router',
  'OLT',
  'Server',
  'Switch',
  'ONU',
  'Monitoring System',
  'Other',
]

export const statusOptions = ['Pending', 'In Progress', 'Completed', 'Failed', 'Escalated']

export const sampleTeamMembers = [
  {
    id: 'member-1001',
    name: 'Adrian Cruz',
    role: 'Network Engineer',
    status: 'Active',
  },
  {
    id: 'member-1002',
    name: 'Mika Reyes',
    role: 'Field Technician',
    status: 'Active',
  },
  {
    id: 'member-1003',
    name: 'Jernan',
    role: 'Admin',
    status: 'Active',
  },
  {
    id: 'member-1004',
    name: 'Lea Tan',
    role: 'Network Assistant',
    status: 'Inactive',
  },
]

export const sampleDevices = [
  {
    id: 'device-1001',
    name: 'BNG-RTR-01',
    type: 'Router',
    ipAddress: '10.12.4.1',
    siteBranch: 'Manila Core POP',
    status: 'Active',
  },
  {
    id: 'device-1002',
    name: 'OLT-CEB-03',
    type: 'OLT',
    ipAddress: '172.16.8.20',
    siteBranch: 'Cebu Branch',
    status: 'Active',
  },
  {
    id: 'device-1003',
    name: 'RADIUS-SRV-02',
    type: 'Server',
    ipAddress: '10.22.11.12',
    siteBranch: 'Davao Data Center',
    status: 'Active',
  },
  {
    id: 'device-1004',
    name: 'AGG-SW-07',
    type: 'Switch',
    ipAddress: '192.168.30.7',
    siteBranch: 'Baguio Relay Site',
    status: 'Inactive',
  },
]

export const sampleActivityTypes = [
  { id: 'activity-1001', name: 'Router configuration', status: 'Active' },
  { id: 'activity-1002', name: 'OLT ports configuration', status: 'Active' },
  { id: 'activity-1003', name: 'Fiber troubleshooting', status: 'Active' },
  { id: 'activity-1004', name: 'ONU activation', status: 'Active' },
  { id: 'activity-1005', name: 'DHCP maintenance', status: 'Active' },
  { id: 'activity-1006', name: 'Server maintenance', status: 'Active' },
  { id: 'activity-1007', name: 'Monitoring', status: 'Active' },
  { id: 'activity-1008', name: 'Backup', status: 'Active' },
]
