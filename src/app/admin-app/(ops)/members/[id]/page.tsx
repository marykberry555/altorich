import { AdminMemberProfileView } from "@/components/admin-app/AdminMemberProfileView";

export const dynamic = "force-dynamic";

export default async function AdminMemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminMemberProfileView memberId={id} />;
}
