// app/api/connection-details/route.ts

import {
  AccessToken,
  AccessTokenOptions,
  VideoGrant,
  AgentDispatchClient,
} from "livekit-server-sdk";
import { NextResponse } from "next/server";

const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;

export const revalidate = 0;

export type ConnectionDetails = {
  serverUrl: string;
  roomName: string;
  participantName: string;
  participantToken: string;
};

// Simplified interface for card data
interface CardData {
  senderName: string;
  recipientName: string;
  message: string;
  templateImageUrl: string;
}

export async function POST(req: Request) {
  try {
    console.log("API route received POST request.");
    const body = await req.json();
    console.log("Full request body received:", JSON.stringify(body, null, 2));

    // Safely access the cardData from the parsed body
    const cardData: CardData | undefined = body.cardData;

    if (!cardData) {
      throw new Error("cardData not found in the request body");
    }

    if (!LIVEKIT_URL || !API_KEY || !API_SECRET) {
      throw new Error("LiveKit server environment variables are not set.");
    }
    
    const participantIdentity = `voice_assistant_user_${Math.floor(
      Math.random() * 10_000
    )}`;
    const roomName = `voice_assistant_room_${Math.floor(
      Math.random() * 10_000
    )}`;

    const agentName = "inbound-agent";
    const agentDispatchClient = new AgentDispatchClient(
      LIVEKIT_URL,
      API_KEY,
      API_SECRET
    );

    // CRITICAL: We stringify the cardData to pass as metadata
    const dispatchOptions = { metadata: JSON.stringify(cardData) };

    const dispatch = await agentDispatchClient.createDispatch(
      roomName,
      agentName,
      dispatchOptions
    );
    // This log should now show the correct data
    console.log("Dispatch created with metadata:", dispatch.metadata);

    const participantToken = await createParticipantToken(
      {
        identity: participantIdentity,
        name: "Card Recipient", // We can hardcode this now
      },
      roomName
    );

    const data: ConnectionDetails = {
      serverUrl: LIVEKIT_URL,
      roomName,
      participantToken: participantToken,
      participantName: participantIdentity,
    };
    
    return NextResponse.json(data, { 
      headers: { 
        "Cache-Control": "no-store",
        "Content-Type": "application/json"
      } 
    });
  } catch (error) {
    console.error("Error in API route:", error);
    
    if (error instanceof Error) {
      return new NextResponse(
        JSON.stringify({ 
          error: error.message,
          timestamp: new Date().toISOString()
        }), 
        { 
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    
    return new NextResponse(
      JSON.stringify({ 
        error: "An unexpected error occurred",
        timestamp: new Date().toISOString()
      }), 
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}

function createParticipantToken(
  userInfo: AccessTokenOptions,
  roomName: string
) {
  const at = new AccessToken(API_KEY, API_SECRET, {
    ...userInfo,
    ttl: "15m", // Consider extending to 30m for longer conversations if needed
  });
  
  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
    // Add specific permissions for agent interactions
    canUpdateOwnMetadata: true,
  };
  
  at.addGrant(grant);
  return at.toJwt();
}