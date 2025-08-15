export interface Equipment {
  id: string;
  name: string;
  model: string;
  location: string | null;
  status: "available" | "assigned";
  assignedTo: string | null;
}

export interface Assignment {
  id: string;
  customer: string;
  equipment: string;
  startDate: string;
  endDate: string;
  duration: string;
  hasConflict: boolean;
  assignedEquipment?: string;
}

export const mockEquipmentData: Equipment[] = [
  {
    id: "JLG-943",
    name: "JLG 943",
    model: "TH001",
    location: "Warehouse A",
    status: "available",
    assignedTo: null,
  },
  {
    id: "JLG-943-2",
    name: "JLG 943",
    model: "TH003",
    location: "Warehouse B",
    status: "available",
    assignedTo: null,
  },
  {
    id: "CAT-320",
    name: "CAT 320",
    model: "EX001",
    location: "Warehouse A",
    status: "available",
    assignedTo: null,
  },
  {
    id: "TL3570",
    name: "Bobcat TL3570",
    model: "TH005",
    location: "Rental from Home Depot",
    status: "available",
    assignedTo: null,
  },
  {
    id: "GTH-1056",
    name: "Genie GTH-1056",
    model: "TH006",
    location: "Warehouse C",
    status: "assigned",
    assignedTo: "Assigned:\nGenie GTH-1056 (TH006)",
  },
  {
    id: "TH417",
    name: "Caterpillar TH417",
    model: "TH002",
    location: "Job Site - Metro Construction",
    status: "assigned",
    assignedTo: null,
  },
  {
    id: "PC200",
    name: "Komatsu PC200",
    model: "EX002",
    location: null,
    status: "assigned",
    assignedTo: null,
  },
];

export const mockAssignments: Assignment[] = [
  {
    id: "1",
    customer: "Bob's Roofing",
    equipment: "Telehandler",
    startDate: "2025-08-15",
    endDate: "2025-08-21",
    duration: "7d",
    hasConflict: true,
    assignedEquipment: undefined,
  },
  {
    id: "2",
    customer: "Metro Construction",
    equipment: "Telehandler",
    startDate: "2025-08-14",
    endDate: "2025-08-27",
    duration: "14d",
    hasConflict: false,
    assignedEquipment: "Caterpillar TH417 (TH002)",
  },
  {
    id: "3",
    customer: "Metro Construction",
    equipment: "Excavator",
    startDate: "2025-08-17",
    endDate: "2025-08-26",
    duration: "10d",
    hasConflict: false,
    assignedEquipment: "Komatsu PC200 (EX002)",
  },
  {
    id: "4",
    customer: "Downtown Developers",
    equipment: "Telehandler",
    startDate: "2025-08-19",
    endDate: "2025-08-30",
    duration: "12d",
    hasConflict: false,
    assignedEquipment: "Genie GTH-1056 (TH006)",
  },
  {
    id: "5",
    customer: "Riverside Builders",
    equipment: "Excavator",
    startDate: "2025-08-21",
    endDate: "2025-08-28",
    duration: "8d",
    hasConflict: true,
    assignedEquipment: undefined,
  },
  {
    id: "6",
    customer: "Highland Construction",
    equipment: "Telehandler",
    startDate: "2025-08-24",
    endDate: "2025-08-28",
    duration: "5d",
    hasConflict: true,
    assignedEquipment: undefined,
  },
];
