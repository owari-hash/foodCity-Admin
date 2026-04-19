import { cookies } from "next/headers";

export async function getServerAdminAuthHeaders(): Promise<HeadersInit> {
  const jar = await cookies();
  const t = jar.get("fc_admin_token")?.value;
  return t ? { Authorization: `Bearer ${t}` } : {};
}
