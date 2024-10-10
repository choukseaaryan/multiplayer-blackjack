import React, { useContext, useEffect } from "react";
import { GameContext } from "../../context";
import showToast from "../ShowToast";

const RoomFooter = ({ balance = 0, isHost = false, gameStarted }) => {
  const { socket, roomId, betSize, updateBetSize } = useContext(GameContext);
  
  useEffect(() => {
    const handleBetSizeUpdate = (value) => {
      showToast("info", `Bet size updated to $${value}`);
      updateBetSize(value);
    };

    socket.on("betSizeUpdated", handleBetSizeUpdate);

    return () => {
      socket.off("betSizeUpdated");
    }
  })

  const changeBetSize = (value) => {
    socket.emit("betSizeChanged", roomId, value);
    updateBetSize(value);
  };

  return (
    <>
      <div className="self-start bg-[rgba(0,0,0,0.5)] text-white -mt-20 ml-2 px-3 py-2 rounded-md">
        Balance: {balance}
      </div>

      <div className="flex items-center gap-2 self-end bg-[rgba(0,0,0,0.5)] text-white -mt-10 mr-2 px-3 py-2 rounded-md">
        <label htmlFor="bet-size" className="block">
          Bet Size:
        </label>
        <select
          id="bet-size"
          className="bg-gray-800 text-white border border-amber-500 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-500 transition duration-200"
          value={betSize} // Assuming betSize is a state variable
          onChange={(e) => changeBetSize(e.target.value)} // Call the function on change
          disabled={gameStarted || !isHost}
        >
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
          <option value="100">100</option>
          <option value="200">200</option>
          <option value="800">800</option>
        </select>
      </div>
    </>
  );
};

export default RoomFooter;
