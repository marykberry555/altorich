import { AppLoader } from "@/components/brand/AppLoader";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <AppLoader />
    </div>
  );
}
