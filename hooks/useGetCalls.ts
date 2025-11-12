import { useEffect, useState } from 'react';
// import { useUser } from '@clerk/nextjs'; // REMOVED
import { useAuthState } from 'react-firebase-hooks/auth'; // ADDED
import { auth } from '@/lib/firebase'; // ADDED
import { Call, useStreamVideoClient } from '@stream-io/video-react-sdk';

export const useGetCalls = () => {
  // const { user } = useUser(); // REMOVED
  const [user, authLoading] = useAuthState(auth); // ADDED
  const client = useStreamVideoClient();
  const [calls, setCalls] = useState<Call[]>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadCalls = async () => {
      // if (!client || !user?.id) return; // OLD
      if (!client || !user?.uid) return; // UPDATED to check for uid

      setIsLoading(true);

      try {
        const { calls } = await client.queryCalls({
          sort: [{ field: 'starts_at', direction: -1 }],
          filter_conditions: {
            starts_at: { $exists: true },
            $or: [
              // { created_by_user_id: user.id }, // OLD
              // { members: { $in: [user.id] } }, // OLD
              { created_by_user_id: user.uid }, // UPDATED to uid
              { members: { $in: [user.uid] } }, // UPDATED to uid
            ],
          },
        });

        setCalls(calls);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCalls();
  // }, [client, user?.id]); // OLD
  }, [client, user?.uid]); // UPDATED to uid

  const now = new Date();

  const endedCalls = calls?.filter(({ state: { startsAt, endedAt } }: Call) => {
    return (startsAt && new Date(startsAt) < now) || !!endedAt;
  });

  const upcomingCalls = calls?.filter(({ state: { startsAt } }: Call) => {
    return startsAt && new Date(startsAt) > now;
  });

  return {
    endedCalls,
    upcomingCalls,
    callRecordings: calls,
    // Combine auth loading and call loading
    isLoading: isLoading || authLoading, 
  };
};