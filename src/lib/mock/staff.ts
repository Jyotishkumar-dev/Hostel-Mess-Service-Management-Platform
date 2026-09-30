import type { StaffMember } from "@/types/complaint";

/**
 * Sample support staff used by the mock data layer.
 * Replaced by a `staff` table read through Supabase in a later phase.
 */
export const MOCK_STAFF: StaffMember[] = [
  {
    id: "stf-01",
    name: "Rakesh Yadav",
    role: "Maintenance Technician",
    team: "Hostel Operations",
    initials: "RY",
  },
  {
    id: "stf-02",
    name: "Sunita Devi",
    role: "Housekeeping Supervisor",
    team: "Hostel Operations",
    initials: "SD",
  },
  {
    id: "stf-03",
    name: "Imran Qureshi",
    role: "Mess Coordinator",
    team: "Mess Services",
    initials: "IQ",
  },
  {
    id: "stf-04",
    name: "Deepak Rathore",
    role: "Electrician",
    team: "Facilities",
    initials: "DR",
  },
  {
    id: "stf-05",
    name: "Anjali Menon",
    role: "Mess Coordinator",
    team: "Mess Services",
    initials: "AM",
  },
  {
    id: "stf-06",
    name: "Vikas Chauhan",
    role: "Network Administrator",
    team: "IT Services",
    initials: "VC",
  },
];

export function staffById(id: string | undefined): StaffMember | null {
  return MOCK_STAFF.find((member) => member.id === id) ?? null;
}

/** The staff member whose dashboard is being previewed. */
export const MOCK_CURRENT_STAFF_ID = "stf-01";
