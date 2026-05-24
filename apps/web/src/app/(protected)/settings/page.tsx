import SettingsForm from "@/components/settings-form";
import { getServerSession } from "@/lib/server-session";

export default async function Page() {
  const session = await getServerSession();

  return (
    <SettingsForm
      initialEmail={session?.user.email ?? ""}
      initialName={session?.user.name ?? ""}
    />
  );
}
