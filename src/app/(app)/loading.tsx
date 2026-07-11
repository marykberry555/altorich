import { AppLoader } from "@/components/brand/AppLoader";

export default function AppSectionLoading() {
  return (
    <div className="min-h-[60vh] bg-[var(--surface)]">
      <AppLoader compact />
    </div>
  );
}
