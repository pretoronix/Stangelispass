import React from "react";
import { Modal, Dimensions } from "react-native";
import { MVPModal } from "@/components/features/MVPModal";
import { QRScanner } from "@/components/features/QRScanner";
import { StartRoundPrompt } from "@/components/home/StartRoundPrompt";
import { InviteModal } from "@/components/features/InviteModal";
import { BroadcastModal } from "@/components/notifications/BroadcastModal";
import { Confetti } from "@/components/animations/Confetti";

interface HomeModalsProps {
  showRecap: boolean;
  setShowRecap: (val: boolean) => void;
  winner: any;
  scanning: boolean;
  setScanning: (val: boolean) => void;
  handleScan: (data: string) => void;
  eventActions: any;
  activeEvent: any;
  currentUser: any;
  showInvite: boolean;
  setShowInvite: (val: boolean) => void;
  showBroadcast: boolean;
  setShowBroadcast: (val: boolean) => void;
  showConfetti: boolean;
  setShowConfetti: (val: boolean) => void;
}

export function HomeModals({
  showRecap,
  setShowRecap,
  winner,
  scanning,
  setScanning,
  handleScan,
  eventActions,
  activeEvent,
  currentUser,
  showInvite,
  setShowInvite,
  showBroadcast,
  setShowBroadcast,
  showConfetti,
  setShowConfetti,
}: HomeModalsProps) {
  return (
    <>
      {/* MVP Recap Modal */}
      <MVPModal
        visible={showRecap}
        onClose={() => setShowRecap(false)}
        winnerName={winner?.name || "Unknown"}
        totalBeers={winner?.count || 0}
      />

      {/* QR Scanner Modal */}
      <Modal
        visible={scanning}
        animationType="slide"
        onRequestClose={() => setScanning(false)}
      >
        <QRScanner onScan={handleScan} onClose={() => setScanning(false)} />
      </Modal>

      {/* Start Round / Join Event Prompt */}
      <StartRoundPrompt
        visible={eventActions.showStartRoundPrompt}
        pendingAction={eventActions.pendingAction}
        startRoundName={eventActions.startRoundName}
        setStartRoundName={eventActions.setStartRoundName}
        beerPrice={eventActions.beerPrice}
        setBeerPrice={eventActions.setBeerPrice}
        pendingJoinEventName={eventActions.pendingJoinEventName}
        promptSubmitting={eventActions.promptSubmitting}
        onSubmit={eventActions.submitNamePrompt}
        onCancel={() => {
          eventActions.setStartRoundName("");
          eventActions.setBeerPrice("5.00");
          eventActions.setShowStartRoundPrompt(false);
        }}
      />

      <InviteModal
        visible={showInvite}
        onClose={() => setShowInvite(false)}
        eventId={activeEvent?.id || ""}
        eventName={activeEvent?.name || ""}
      />

      {activeEvent && currentUser && (
        <BroadcastModal
          visible={showBroadcast}
          onClose={() => setShowBroadcast(false)}
          eventId={activeEvent.id}
          senderId={currentUser.id}
          eventName={activeEvent.name}
        />
      )}

      {/* 🎉 Confetti Animation for leader changes & achievements */}
      <Confetti
        trigger={showConfetti}
        count={150}
        origin={{ x: Dimensions.get("window").width / 2, y: 0 }}
        explosionSpeed={350}
        fallSpeed={2500}
        onAnimationEnd={() => setShowConfetti(false)}
      />
    </>
  );
}
