export const PARK_TABS = [
  { id: 'parks', label: 'Park Profile', icon: 'Building2', description: 'Central Business Park profile and operational parameters' },
  { id: 'buildings', label: 'Buildings & Blocks', icon: 'Building', description: 'Physical commercial buildings, blocks, towers, and floor structures' },
  { id: 'floors', label: 'Floor Levels', icon: 'Layers', description: 'Building floors, office capacity, and blueprint layouts' },
  { id: 'offices', label: 'Office Units', icon: 'Grid', description: 'Office space inventory, floor area, and occupancy state machine' },
  { id: 'zones', label: 'Facility Zones', icon: 'MapPin', description: 'Green parks, parking lots, utility rooms, and security posts' },
  { id: 'locations', label: 'Campus Landmarks', icon: 'Compass', description: 'Physical campus location hierarchy and landmarks' }
];

export const OFFICE_AVAILABILITY_STATUSES = [
  { value: 'VACANT', label: 'Vacant', badgeClass: 'badge-success', color: 'var(--color-success)' },
  { value: 'OCCUPIED', label: 'Occupied', badgeClass: 'badge-info', color: 'var(--color-info)' },
  { value: 'MAINTENANCE', label: 'Under Maintenance', badgeClass: 'badge-warning', color: 'var(--color-warning)' },
  { value: 'RESERVED', label: 'Reserved', badgeClass: 'badge-secondary', color: 'var(--text-muted)' }
];

export const ZONE_TYPES = [
  { value: 'GREEN_ZONE', label: 'Green Park / Garden' },
  { value: 'PARKING_LOT', label: 'Parking Lot' },
  { value: 'SECURITY_OFFICE', label: 'Security & Access Post' },
  { value: 'UTILITY_ROOM', label: 'Utility / Technical Room' }
];

export const LOCATION_TYPES = [
  { value: 'CAMPUS', label: 'Campus' },
  { value: 'BLOCK', label: 'Block' },
  { value: 'TOWER', label: 'Tower' },
  { value: 'PARKING_BAY', label: 'Parking Bay' },
  { value: 'COMMON_ROOM', label: 'Common Area' }
];
