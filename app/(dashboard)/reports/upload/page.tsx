import { PageHeading } from "@/components/ui/page-heading"; import { UploadForm } from "@/features/reports/upload-form";
export default function UploadPage() { return <><PageHeading title="Upload Report" description="Create a secure report URL and verification QR in one step"/><UploadForm/></>; }
