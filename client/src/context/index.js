import React, { createContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

export const GameContext = createContext();

export const GameProvider = ({ children }) => {
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io("https://multiplayer-blackjack-api.onrender.com");
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const updateUsername = (username) => setUsername(username);
  const updateRoomId = (id) => setRoomId(id);
  const updateSocket = (socket) => setSocket(socket);

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
        updateUsername,
        updateRoomId,
        updateData,
        updateSocket,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};
