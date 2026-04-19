import AdminShell from "@/components/admin/AdminShell";

/** Always run with request cookies so server fetches include `fc_admin_token`. */
export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AdminShell>{children}</AdminShell>;
}
