import { redirect } from "next/navigation";
import { ADMIN_BASE_PATH } from "@/lib/adminBasePath";

export default function Home() {
  redirect(`${ADMIN_BASE_PATH}/login/`);
}
