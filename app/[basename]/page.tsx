import { resolveBasename } from "@/lib/basename";
import { TipForm } from "@/components/TipForm";
import { ProfileIdentity } from "@/components/ProfileIdentity";
import { notFound } from "next/navigation";

export default async function ProfilePage({
  params,
}: {
  params: { basename: string };
}) {
  const basename = decodeURIComponent(params.basename);
  const address = await resolveBasename(basename);

  if (!address) {
    notFound();
  }

  return (
    <main>
      <a href="/" className="wordmark" style={{ color: "inherit" }}>
        <span className="wordmark-dot" />
        Basecard
      </a>
      <ProfileIdentity address={address} />
      <TipForm recipient={address} recipientLabel={basename} />
    </main>
  );
}
