"use client";

import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../../../lib/firebase";
import Loader from "../../../../components/Loader";
import { useStreamVideoClient } from "@stream-io/video-react-sdk";
import { useRouter } from "next/navigation";
import { useGetCallById } from "../../../../hooks/useGetCallById";
import { Button } from "../../../../components/ui/button";
import { useToast } from "../../../../components/ui/use-toast";

const Table = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => {
  return (
    <div className="flex flex-col items-start gap-2 xl:flex-row">
      <h1 className="text-base font-medium text-sky-1 lg:text-xl xl:min-w-32">
        {title}:
      </h1>
      <h1 className="truncate text-sm font-bold max-sm:max-w-[320px] lg:text-xl">
        {description}
      </h1>
    </div>
  );
};

const PersonalRoom = () => {
  const router = useRouter();
  const [user, loading] = useAuthState(auth);
  const client = useStreamVideoClient();
  const { toast } = useToast();

  const { call } = useGetCallById(user?.uid || "");

  const startRoom = async () => {
    if (!client || !user) return;

    // Use user.uid directly for safety
    const newCall = client.call("default", user.uid);

    if (!call) {
      await newCall.getOrCreate({
        data: {
          starts_at: new Date().toISOString(),
        },
      });
    }

    router.push(`/meeting/${user.uid}?personal=true`); // UPDATED to uid
  };

  if (loading) return <Loader />;

  if (!user) return <Loader />;

  // --- Define user-dependent variables *after* the user check ---
  const meetingId = user.uid;
  const meetingLink = `${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${meetingId}?personal=true`;

  return (
    <section className="flex size-full flex-col gap-10 text-white">
      <h1 className="text-xl font-bold lg:text-3xl">Personal Meeting Room</h1>
      <div className="flex w-full flex-col gap-8 xl:max-w-[900px]">
        {/* UPDATED to use displayName or email */}
        <Table
          title="Topic"
          description={`${
            user.displayName || user.email || "My"
          }'s Meeting Room`}
        />
        <Table title="Meeting ID" description={meetingId} />
        <Table title="Invite Link" description={meetingLink} />
      </div>
      <div className="flex gap-5">
        <Button className="bg-purple-1" onClick={startRoom}>
          Start Meeting
        </Button>
        <Button
          className="bg-dark-3"
          onClick={() => {
            navigator.clipboard.writeText(meetingLink);
            toast({
              title: "Link Copied",
            });
          }}
        >
          Copy Invitation
        </Button>
      </div>
    </section>
  );
};

export default PersonalRoom;
