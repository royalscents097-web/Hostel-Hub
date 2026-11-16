export interface LahoreAreaInfo {
  name: string;
  nearbyCampuses: string;
  corridor: string;
}

export const LAHORE_AREAS: LahoreAreaInfo[] = [
  {
    name: 'DHA',
    nearbyCampuses: 'LUMS, Garrison University, DHA Phases 1-6',
    corridor: 'East Lahore',
  },
  {
    name: 'Muslim Town',
    nearbyCampuses: 'Punjab University, FCCU, Canal Bank',
    corridor: 'Central Canal',
  },
  {
    name: 'Canal Road',
    nearbyCampuses: 'PU New Campus, UET Link, Tech Hubs',
    corridor: 'Canal Corridor',
  },
  {
    name: 'Allama Iqbal Town',
    nearbyCampuses: 'PU, UCP Link, Karim Block Transit',
    corridor: 'West Central',
  },
  {
    name: 'Awan Town',
    nearbyCampuses: 'Multan Road, Orange Line Station',
    corridor: 'West Lahore',
  },
  {
    name: 'Johar Town',
    nearbyCampuses: 'UMT, UCP, Shaukat Khanum Corridor',
    corridor: 'South West',
  },
  {
    name: 'Faisal Town',
    nearbyCampuses: 'FAST NUCES, Kotha Pind, Akbar Chowk',
    corridor: 'Central South',
  },
  {
    name: 'Garden Town',
    nearbyCampuses: 'ITU, Barkat Market, Kalma Chowk',
    corridor: 'Central Hub',
  },
  {
    name: 'New Garden Town',
    nearbyCampuses: 'PU Gate 4, FCCU, Ali Institute',
    corridor: 'Central Canal',
  },
  {
    name: 'Model Town',
    nearbyCampuses: 'FAST Link, Ittefaq Corridor, Ferozepur Rd',
    corridor: 'Central South',
  },
  {
    name: 'Shadbagh',
    nearbyCampuses: 'UET GT Road, GCU, KEMU Transit',
    corridor: 'North Lahore',
  },
  {
    name: 'Raiwind',
    nearbyCampuses: 'COMSATS, Beaconhouse National, Superior',
    corridor: 'Raiwind Road',
  },
  {
    name: 'Thokar Niaz Baig',
    nearbyCampuses: 'UOL Link, Motorway Entry, Canal Terminal',
    corridor: 'South Gate',
  },
];

export const LAHORE_AREA_NAMES = LAHORE_AREAS.map((a) => a.name);

export const STANDARD_FACILITIES = [
  'High-Speed Wi-Fi',
  'Generator / UPS Backup',
  '3-Time Mess Available',
  'Air-Conditioned Rooms',
  'Laundry Service',
  '24/7 Security Guard & CCTV',
  'Dedicated Study Room',
  'Bike / Car Parking',
  'Filtered Drinking Water',
  'Attached Bathrooms',
] as const;

export const ROOM_SHARING_TYPES = [
  'Single Private',
  '2-Seater',
  '3-Seater',
  '4-Seater',
] as const;

export const CONTACT_STATUSES = [
  'Not Contacted',
  'Contacted',
  'Interested',
  'Not Interested',
  'Awaiting Information',
  'Verification Pending',
  'Approved',
  'Rejected',
] as const;

export const AUTHORIZED_PHOTO_GALLERY = [
  {
    label: 'Exterior & Courtyard View',
    url: '/src/assets/images/hero_lahore_hostel_campus_1794843376764.jpg',
  },
  {
    label: 'Twin-Sharing Study Room',
    url: '/src/assets/images/hostel_boys_study_room_1794843376255.jpg',
  },
  {
    label: 'Girls Residence Lounge & Study Area',
    url: '/src/assets/images/hostel_girls_residence_1794843376853.jpg',
  },
  {
    label: 'Dining Hall & Kitchen Commons',
    url: '/src/assets/images/hostel_dining_commons_1794843378031.jpg',
  },
] as const;
