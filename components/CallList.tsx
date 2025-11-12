"use client";

import { Call, CallRecording } from "@stream-io/video-react-sdk";
import Loader from "./Loader";
import { useGetCalls } from "@/hooks/useGetCalls";
import MeetingCard from "./MeetingCard";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const CallList = ({ type }: { type: "ended" | "upcoming" | "recordings" }) => {
  const router = useRouter();
  const { endedCalls, upcomingCalls, callRecordings, isLoading } =
    useGetCalls();
  const [recordings, setRecordings] = useState<CallRecording[]>([]);

  // Fetch recordings when type is "recordings"
  useEffect(() => {
    const fetchRecordings = async () => {
      const callData = await Promise.all(
        callRecordings?.map((meeting) => meeting.queryRecordings()) ?? []
      );

      const allRecordings = callData
        .filter((call) => call.recordings.length > 0)
        .flatMap((call) => call.recordings);

      setRecordings(allRecordings);
    };

    if (type === "recordings") {
      fetchRecordings();
    }
  }, [type, callRecordings]);

  if (isLoading) return <Loader />;

  // Ensure calls is always an array
  const calls: (Call | CallRecording)[] =
    type === "ended"
      ? endedCalls ?? []
      : type === "upcoming"
      ? upcomingCalls ?? []
      : recordings ?? [];

  const noCallsMessage =
    type === "ended"
      ? "No Previous Calls"
      : type === "upcoming"
      ? "No Upcoming Calls"
      : "No Recordings";

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      {calls.length > 0 ? (
        calls.map((meeting) => {
          let key: string;
          let title: string;
          let date: string;
          let link: string;

          if ("id" in meeting) {
            // meeting is Call
            key = meeting.id;
            title = meeting.state?.custom?.description || "No Description";
            date = meeting.state?.startsAt?.toLocaleString() || "No Date";
            link = `${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${meeting.id}`;
          } else if ("url" in meeting) {
            // meeting is CallRecording
            key = meeting.url;
            title = meeting.filename?.substring(0, 20) || "No Description";
            date = meeting.start_time?.toLocaleString() || "No Date";
            link = meeting.url;
          } else {
            // fallback
            key = Math.random().toString();
            title = "No Description";
            date = "No Date";
            link = "#";
          }

          return (
            <MeetingCard
              key={key}
              icon={
                type === "ended"
                  ? "/icons/previous.svg"
                  : type === "upcoming"
                  ? "/icons/upcoming.svg"
                  : "/icons/recordings.svg"
              }
              title={title}
              date={date}
              isPreviousMeeting={type === "ended"}
              link={link}
              buttonIcon1={
                type === "recordings" ? "/icons/play.svg" : undefined
              }
              buttonText={type === "recordings" ? "Play" : "Start"}
              handleClick={() => router.push(link)} // always a function
            />
          );
        })
      ) : (
        <h1 className="text-2xl font-bold text-white">{noCallsMessage}</h1>
      )}
    </div>
  );
};

export default CallList;
