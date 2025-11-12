"use client";

import { ReactNode, useEffect, useState } from "react";
import { StreamVideoClient, StreamVideo } from "@stream-io/video-react-sdk";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { createToken } from "@/actions/stream.actions";
import Loader from "@/components/Loader";
import { useRouter } from "next/navigation";

const API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY;

const StreamVideoProvider = ({ children }: { children: ReactNode }) => {
  const [videoClient, setVideoClient] = useState<StreamVideoClient>();
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Still loading, do nothing

    // --- THIS IS THE UPDATED LOGIC ---
    if (user) {
      // If user exists, create the client
      if (!API_KEY) throw new Error("Stream API key is missing");

      const myTokenProvider = async () => {
        try {
          // This is now safe, user is guaranteed to exist
          const token = await createToken(user.uid);
          return token;
        } catch (error) {
          console.error("Error creating stream token", error);
          throw error;
        }
      };

      const client = new StreamVideoClient({
        apiKey: API_KEY,
        user: {
          // All of these are now safe
          id: user.uid,
          name: user.displayName || user.email || user.uid,
          image: user.photoURL || undefined,
        },
        tokenProvider: myTokenProvider,
      });

      setVideoClient(client);
    } else {
      // If no user and loading is finished, redirect
      router.push("/login");
    }
    // --- END OF UPDATED LOGIC ---
  }, [user, loading, router]); // Dependencies are correct

  // This logic is still correct. It will show a loader while
  // 1. Firebase is loading
  // 2. The user is being redirected (because videoClient is not set)
  // 3. The videoClient is being created
  if (loading || !videoClient) return <Loader />;

  return <StreamVideo client={videoClient}>{children}</StreamVideo>;
};

export default StreamVideoProvider;
