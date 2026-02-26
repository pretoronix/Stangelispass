import React from "react";
import { AddQrModal } from "@/components/add/AddQrModal";
import { PourAnimation } from "@/components/animations/PourAnimation";
import { SimplePourFeedback } from "@/components/animations/SimplePourFeedback";

interface AddBeerModalsProps {
  showQR: boolean;
  closeQrModal: () => void;
  selectedUser: any;
  activeEvent: any;
  stampId: string | undefined;
  qrMode: "stamp" | "log" | "participant_log";
  handleShareQr: () => void;
  shareLoading: boolean;
  qrRef: any;
  qrViewRef: any;
  useFullAnimation: boolean;
  showAnimation: boolean;
  handleAnimationComplete: () => void;
}

export function AddBeerModals({
  showQR,
  closeQrModal,
  selectedUser,
  activeEvent,
  stampId,
  qrMode,
  handleShareQr,
  shareLoading,
  qrRef,
  qrViewRef,
  useFullAnimation,
  showAnimation,
  handleAnimationComplete,
}: AddBeerModalsProps) {
  return (
    <>
      <AddQrModal
        visible={showQR}
        onClose={closeQrModal}
        selectedUser={selectedUser}
        eventName={activeEvent?.name}
        eventId={activeEvent?.id}
        stampId={stampId}
        mode={qrMode}
        onShareQr={handleShareQr}
        shareLoading={shareLoading}
        onQrRef={(ref) => {
          qrRef.current = ref;
        }}
        qrViewRef={qrViewRef}
      />

      {/* Pour Animation */}
      {useFullAnimation ? (
        <PourAnimation
          visible={showAnimation}
          onComplete={handleAnimationComplete}
        />
      ) : (
        <SimplePourFeedback
          visible={showAnimation}
          onComplete={handleAnimationComplete}
        />
      )}
    </>
  );
}
