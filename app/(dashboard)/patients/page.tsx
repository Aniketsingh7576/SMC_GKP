import { PageHeading } from "@/components/ui/page-heading"; import { PatientManager } from "@/features/patients/patient-manager";
export default function PatientsPage() { return <><PageHeading title="Patients" description="Create patient profiles and review their report history"/><PatientManager/></>; }
