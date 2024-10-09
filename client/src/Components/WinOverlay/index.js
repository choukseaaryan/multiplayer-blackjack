import React, { useContext, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GameContext } from "../../context";

const WinOverlay = ({ setGameStarted }) => {
  const { socket } = useContext(GameContext);
  const [winners, setWinners] = useState([]);
  const [showWinOverlay, setShowWinOverlay] = useState(false);

  useEffect(() => {
    if (!socket) return; // Early return if socket is not initialized

    const handleWinEvent = (winners) => {
      setWinners(winners); // Set the winners array
      setShowWinOverlay(true); // Show the overlay
      setGameStarted(false);

      // Automatically hide the overlay after a delay
      setTimeout(() => {
        setShowWinOverlay(false);
        setWinners([]); // Clear winners after displaying
      }, 3500); // Duration for the overlay to be visible
    };

    socket.on("gameEnded", handleWinEvent);

    return () => {
      socket.off("gameEnded");
    };
    // eslint-disable-next-line
  }, [socket]);

  return (
    <AnimatePresence>
      {showWinOverlay && (
        <motion.div
          className="absolute inset-0 flex justify-center items-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          transition={{ duration: 0.5, type: "spring" }}
        >
          <div className="bg-white p-4 rounded-lg text-center">
            <h2 className="text-xl font-bold">{winners.length > 0 ? "Congratulations!" : "No Winners..."}</h2>
            {winners?.map((winner, index) => (
              <p key={index} className="mt-2">
                {winner?.name || ""} wins ${winner?.amount || 0}!
              </p>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WinOverlay;
