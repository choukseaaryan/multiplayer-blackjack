import React, { useContext } from "react";
import playerImg from "../../images/avatars/player0.png";
import { GameContext } from "../../context";

const CurrentPlayerCardItem = () => {
  const { currentPlayer } = useContext(GameContext);
  
  return (
    <div
      className={`flex items-center px-3 py-1 relative bg-black rounded-lg gap-4 border-4 ${
        currentPlayer?.is_chance ? "border-yellow-400" : "border-black"
      } -top-10`}
    >
      {/* Overlay for players who are out */}
      {currentPlayer?.is_out && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex justify-center items-center text-white text-2xl font-bold rounded-lg">
          Busted
        </div>
      )}
      {currentPlayer?.is_stand && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex justify-center items-center text-white text-2xl font-bold rounded-lg">
          Stood
        </div>
      )}
      <img
        src={currentPlayer?.img || playerImg} // Use player image if available
        alt={`Current Player`}
        className="rounded-full w-20 h-20"
      />
      <div className="text-white text-wrap max-w-32 break-words">
        {currentPlayer?.username}
      </div>
    </div>
  );
};

export default CurrentPlayerCardItem;
