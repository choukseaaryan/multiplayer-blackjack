import React, { useContext } from "react";
import { GameContext } from "../../context";

const GameControls = ({ gameStarted }) => {
  const { socket, roomId, currentPlayer } = useContext(GameContext);
  
  const hitHandler = () => {
    socket.emit("hit", roomId, currentPlayer?.id);
  };

  const standHandler = () => {
    socket.emit("stand", roomId, currentPlayer?.id);
  };

  const startGameHandler = () => {
    socket.emit("startGame", roomId);
  };
  
  return gameStarted ? (
    currentPlayer?.is_chance ? (
      <>
        <button
          onClick={hitHandler}
          className="bg-yellow-400 border border-yellow-400 hover:bg-transparent hover:text-white rounded-lg px-3 py-1 transition-all"
        >
          Hit
        </button>
        <button
          onClick={standHandler}
          className="bg-red-600 border border-red-600 hover:bg-transparent text-white rounded-lg px-3 py-1 transition-all"
        >
          Stand
        </button>
      </>
    ) : (
      <div className="h-[34px] w-[130px]"></div>
    )
  ) : currentPlayer?.is_host ? (
    <button
      onClick={startGameHandler}
      className="bg-green-700 text-white text-xl px-5 py-3 rounded-md transition-all hover:bg-green-900"
    >
      Start Game
    </button>
  ) : (
    <div className="h-[50px] w-[140px] text-white">
      {" "}
      Waiting for the host to start the game...
    </div>
  );
};

export default GameControls;