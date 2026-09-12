import { createAdminClient } from "@/lib/supabase/admin";
import { SettingsClient } from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const admin = createAdminClient();
  const { data } = await admin.from("showcase_settings").select("data").eq("id", 1).single();
  return <SettingsClient initialData={data?.data || {}} />;
}
