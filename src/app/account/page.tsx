import type { Metadata } from "next";
import { getOrCreateProfile } from "@/lib/customer";
import { ProfileForm } from "./ProfileForm";

export const metadata: Metadata = {
  title: "Profile",
  robots: { index: false },
};

export default async function AccountPage() {
  const profile = await getOrCreateProfile();

  return (
    <div>
      <h1 className="text-2xl font-semibold sm:text-3xl">Your profile</h1>
      <p className="mt-2 text-sm text-ink-soft">
        We use these details to confirm your orders.
      </p>

      <div className="mt-8 max-w-md">
        <ProfileForm
          initialName={profile?.fullName ?? ""}
          initialPhone={profile?.phone ?? ""}
          email={profile?.email ?? ""}
        />
      </div>
    </div>
  );
}
