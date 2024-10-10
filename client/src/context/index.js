import React, { createContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

export const GameContext = createContext();

export const GameProvider = ({ children }) => {
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const [socket, setSocket] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState({});
  const [betSize, setBetSize] = useState(50);

  useEffect(() => {
    const newSocket = io("http://localhost:8000");
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const updateUsername = (username) => setUsername(username);
  const updateRoomId = (id) => setRoomId(id);
  const updateSocket = (socket) => setSocket(socket);
  const updateCurrentPlayer = (player) => setCurrentPlayer(player);
  const updateBetSize = (value) => setBetSize(value);

  const updateData = (data) => {
    setUsername(data?.username);
    setRoomId(data?.roomId);
  };

  return (
    <GameContext.Provider
      value={{
        username,
        roomId,
        socket,
        currentPlayer,
        betSize,
        updateUsername,
        updateRoomId,
        updateData,
        updateSocket,
        updateCurrentPlayer,
        updateBetSize
      }}
    >
      {children}
    </GameContext.Provider>
  );
};
