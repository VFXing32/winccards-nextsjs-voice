// app/card/[collectionId]/page.tsx

"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  LiveKitRoom,
  useVoiceAssistant,
  BarVisualizer,
  RoomAudioRenderer,
  VoiceAssistantControlBar,
  AgentState,
  DisconnectButton,
} from "@livekit/components-react";
import { useCallback, useEffect, useState, use } from "react";
import { MediaDeviceFailure } from "livekit-client";
import type { ConnectionDetails } from "@/app/api/connection-details/route";
import { NoAgentNotification } from "@/app/components/NoAgentNotification";
import { CloseIcon } from "@/app/components/CloseIcon";
import { useKrispNoiseFilter } from "@livekit/components-react/krisp";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Define a type for the card data based on your Firestore structure
type CardData = {
  senderName: string;
  recipientName: string;
  message: string;
  templateImageUrl: string;
};

// Card component with blur and flip functionality
function BlurredCard({
  cardData,
  isRevealed,
  isFlipped,
  onReveal,
  onFlip,
}: {
  cardData: CardData;
  isRevealed: boolean;
  isFlipped: boolean;
  onReveal: () => void;
  onFlip: () => void;
}) {
  const handleCardClick = () => {
    if (!isRevealed) {
      onReveal();
    } else {
      onFlip();
    }
  };

  return (
    <div className="relative w-full max-w-sm mx-auto ">
      {/* Card Container with 3D flip effect */}
      <div 
        className={`relative w-[450px] h-[600px] transition-transform duration-700 preserve-3d ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front of Card */}
        <div 
          className="absolute inset-0 w-full h-full backface-hidden rounded-2xl overflow-hidden shadow-2xl cursor-pointer"
          style={{ backfaceVisibility: 'hidden' }}
          onClick={handleCardClick}
        >
          {/* Card Image */}
          <img
            src={cardData.templateImageUrl}
            alt={`A card from ${cardData.senderName}`}
            className={`w-full h-full object-cover transition-all duration-1000 ${
              !isRevealed ? 'blur-lg scale-110' : 'blur-none scale-100'
            }`}
          />
          
          {/* Blur Overlay */}
          {!isRevealed && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          )}
          
          {/* Content Overlay */}
          <div className="absolute inset-0 flex flex-col text-white">
            {!isRevealed ? (
              // Pre-reveal content
              <div className="flex flex-col h-full">
                {/* Top Section - Facial Recognition */}
                <div className="flex flex-col items-center pt-12 space-y-4">
                  {/* <div className="text-sm font-medium text-green-400 tracking-wider uppercase">
                    Facial Recognition
                  </div>
                  <div className="w-16 h-16 rounded-full border-4 border-ping-400 flex items-center justify-center">
                    <div className="w-8 h-8 bg-green-400 rounded-full animate-pulse" />
                  </div> */}
                </div>
                
                {/* Middle Section - Main Text */}
                <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                  <h1 className="text-4xl font-bold text-center leading-tight">
                    HEY <span className="text-green-400">{cardData.recipientName.toUpperCase()}</span>
                  </h1>
                  <p className="text-4xl font-bold">FOR YOUR EYES ONLY!</p>
                </div>
                
                {/* Bottom Section - Logo */}
                <div className="pb-12 flex justify-center">
                  <img 
                    src="/logo.png" 
                    alt="Winc Logo" 
                    className="h-12 w-auto"
                  />
                </div>
              </div>
            ) : (
              // Post-reveal content (tap to flip indicator)
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 rounded-full px-4 py-2">
                <div className="text-sm text-white/90">Tap to flip</div>
              </div>
            )}
          </div>
        </div>
        
        {/* Back of Card */}
        <div 
          className="absolute inset-0 w-full h-full backface-hidden rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 rotate-y-180 cursor-pointer"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          onClick={onFlip}
        >
          <div className="flex flex-col items-center justify-center h-full text-white p-8 text-center space-y-6">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-pink-400">From:</h2>
              <p className="text-xl font-semibold">{cardData.senderName}</p>
            </div>
            
            <div className="space-y-4 max-w-xs">
              <h3 className="text-lg font-bold text-green-400">Message:</h3>
              <p className="text-base leading-relaxed">{cardData.message}</p>
            </div>
            
            <div className="mt-8">
              <img 
                src="/logo.png" 
                alt="Winc Logo" 
                className="h-12 w-auto"
              />
            </div>
            
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 rounded-full px-4 py-2">
              <div className="text-sm text-white/90">Tap to flip back</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main component that lives inside LiveKitRoom
function WincCardExperience({
  cardData,
  onConnect,
}: {
  cardData: CardData;
  onConnect: () => void;
}) {
  const { state: agentState, audioTrack } = useVoiceAssistant();
  const [isRevealed, setIsRevealed] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleReveal = () => {
    setIsRevealed(true);
    onConnect(); // Start the AI agent when card is revealed
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="flex flex-col items-center justify-between h-full max-w-lg mx-auto p-4">
      {/* The Card Display */}
      <div className="flex-grow flex items-center justify-center w-full">
        <BlurredCard
          cardData={cardData}
          isRevealed={isRevealed}
          isFlipped={isFlipped}
          onReveal={handleReveal}
          onFlip={handleFlip}
        />
      </div>

      {/* Voice Visualizer and Controls - Only show when revealed and connected */}
      {isRevealed && (
        <div className="flex flex-col items-center gap-4 w-full">
          <div className="h-12 w-full">
            <BarVisualizer
              state={agentState}
              barCount={30}
              trackRef={audioTrack}
              className="agent-visualizer"
              options={{ minHeight: 4, maxHeight: 50 }}
            />
          </div>
          <ControlBar
            onConnectButtonClicked={onConnect}
            agentState={agentState}
          />
        </div>
      )}
      <NoAgentNotification state={agentState} />
    </div>
  );
}

export default function CardPage({ params }: { params: Promise<{ collectionId: string }> }) {
  const { collectionId } = use(params);
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionDetails, updateConnectionDetails] = useState<ConnectionDetails | undefined>(undefined);

  useEffect(() => {
    if (!collectionId) return;
    const fetchCardData = async () => {
      setIsLoading(true);
      try {
        const cardDocRef = doc(db, "cards", collectionId);
        const docSnap = await getDoc(cardDocRef);
        if (docSnap.exists()) {
          setCardData(docSnap.data() as CardData);
        } else {
          console.error("No such document found");
        }
      } catch (error) {
        console.error("Error fetching card data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCardData();
  }, [collectionId]);

  const onConnectButtonClicked = useCallback(async () => {
    if (!cardData) {
      alert("Card data is still loading, please wait.");
      return;
    }
    const url = new URL("/api/connection-details", window.location.origin);

    const userName = "Card Recipient";
    const agentId = "agentId_1234567";
    const userId = "userId_123456789";

    const cleanCardData = {
      senderName: cardData.senderName,
      recipientName: cardData.recipientName,
      message: cardData.message,
      templateImageUrl: cardData.templateImageUrl,
    };

    const payload = { userName, agentId, userId, cardData: cleanCardData };

    JSON.stringify(payload, null, 2);

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    
    const data = await response.json();
    updateConnectionDetails(data);
  }, [cardData]);

  const handleDataReceived = useCallback((data: Uint8Array) => {
    const decoder = new TextDecoder();
    const message = decoder.decode(data);
    try {
      const parsed = JSON.parse(message);
      if (parsed.type === "user_disconnect") {
        console.log("Received disconnect signal from agent.");
        updateConnectionDetails(undefined);
      }
    } catch (e) {
      console.error("Failed to parse data message", e);
    }
  }, []);

  if (isLoading) {
    return (
      <main className="h-screen grid content-center bg-[var(--lk-bg)] text-white text-center">
        <p>Loading your card...</p>
      </main>
    );
  }

  if (!cardData) {
    return (
      <main className="h-screen grid content-center bg-[var(--lk-bg)] text-white text-center">
        <p>Sorry, we couldn't find that card.</p>
      </main>
    );
  }

  return (
    <main data-lk-theme="default" className="h-screen bg-[var(--lk-bg)] flex flex-col justify-center items-center">
      <LiveKitRoom
        token={connectionDetails?.participantToken}
        serverUrl={connectionDetails?.serverUrl}
        connect={connectionDetails !== undefined}
        audio={true}
        video={false}
        onMediaDeviceFailure={onDeviceFailure}
        onDisconnected={() => updateConnectionDetails(undefined)}
      >
        <WincCardExperience cardData={cardData} onConnect={onConnectButtonClicked} />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </main>
  );
}

function ControlBar(props: {
  onConnectButtonClicked: () => void;
  agentState: AgentState;
}) {
  const krisp = useKrispNoiseFilter();
  useEffect(() => {
    krisp.setNoiseFilterEnabled(true);
  }, []);

  return (
    <div className="relative h-[100px] flex">
      <AnimatePresence>
        {props.agentState === "disconnected" && (
          <motion.button
            initial={{ opacity: 0, top: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, top: "-10px" }}
            transition={{ duration: 1, ease: [0.09, 1.04, 0.245, 1.055] }}
            className="uppercase absolute left-1/2 -translate-x-1/2 px-4 py-2 bg-white text-black rounded-md"
            onClick={props.onConnectButtonClicked}
          >
            Start Conversation
          </motion.button>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {props.agentState !== "disconnected" &&
          props.agentState !== "connecting" && (
            <motion.div
              initial={{ opacity: 0, top: "10px" }}
              animate={{ opacity: 1, top: 0 }}
              exit={{ opacity: 0, top: "-10px" }}
              transition={{ duration: 0.4, ease: [0.09, 1.04, 0.245, 1.055] }}
              className="flex h-8 absolute left-1/2 -translate-x-1/2 justify-center"
            >
              <VoiceAssistantControlBar controls={{ leave: false }} />
              <DisconnectButton>
                <CloseIcon />
              </DisconnectButton>
            </motion.div>
          )}
      </AnimatePresence>
    </div>
  );
}

function onDeviceFailure(error?: MediaDeviceFailure) {
  console.error(error);
  alert(
    "Error acquiring camera or microphone permissions. Please make sure you grant the necessary permissions in your browser and reload the tab"
  );
}