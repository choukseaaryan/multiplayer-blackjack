import React, { useContext } from "react";
import { motion } from "framer-motion";
import playerImg from "../../images/avatars/player0.png";
import { GameContext } from "../../context";

const OtherPlayerCardItem = ({ player, gameStarted, index }) => {
  const { socket, roomId, currentPlayer } = useContext(GameContext);

  const handleKickPlayer = (id) => {
    socket.emit("kickPlayer", roomId, id);
  };

  return (
    <div
      key={player?.id}
      className="absolute"
      style={{
        top: `calc(50% + ${player?.position?.y}px)`,
        left: `calc(50% + ${player?.position?.x}px)`,
      }}
    >
      <div className="flex absolute -top-24 z-1">
        {player?.cards_in_hand?.length > 0 &&
          player.cards_in_hand.map((card, i) => {
            return (
              <motion.img
                key={i}
                src={
                  gameStarted
                    ? require(`../../images/cards/card-back.jpg`)
                    : require(`../../images/cards/${card.suit}/${card.value}.png`)
                }
                alt={`card`}
                className={`w-16 h-auto`}
                initial={{
                  opacity: 0,
                  x: `${player.position.initialCardX - i * 40}px`,
                  y: `${index % 2 ? "-220px" : 0}`,
                  scale: 0.1,
                  rotate: 180,
                }}
                animate={{
                  opacity: 1,
                  x: i * -40,
                  y: 0,
                  scale: 1,
                  rotate: 0,
                }}
                transition={{ duration: 0.5, delay: i * 0.2 }} // Stagger the cards
              />
            );
          })}
      </div>
      {player?.cards_sum > 0 && !gameStarted && (
        <div className="absolute -top-10 rounded-full bg-black text-white px-2 py-1 z-2">
          {player?.cards_sum}
        </div>
      )}
      <div
        className={`px-3 py-2 flex max-w-60 gap-3 bg-black rounded-lg border-4 ${
          player?.is_chance ? "border-yellow-400" : "border-black"
        }`}
      >
        {/* Overlay for players who are out */}
        {player?.is_out && (!currentPlayer?.is_host || gameStarted) && (
          <div className="absolute inset-0 bg-black bg-opacity-70 flex justify-center items-center text-white text-2xl font-bold rounded-lg">
            Busted
          </div>
        )}
        {player?.is_stand && (!currentPlayer?.is_host || gameStarted) && (
          <div className="absolute inset-0 bg-black bg-opacity-70 flex justify-center items-center text-white text-2xl font-bold rounded-lg">
            Stood
          </div>
        )}
        <img
          key={index}
          src={player?.img || playerImg} // Use player image if available
          alt={`Player ${index + 1}`}
          className="rounded-full w-20 h-20"
        />
        <div className="text-white mt-2 max-w-32 text-wrap break-words">
          <p>{player?.username}</p>
          {currentPlayer?.is_host && (
            <button
              disabled={gameStarted}
              onClick={() => handleKickPlayer(player?.id)}
              className="mt-2 px-3 py-1 bg-red-500 text-white rounded-md disabled:bg-gray-600 disabled:text-gray-200"
            >
              Kick
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OtherPlayerCardItem;
