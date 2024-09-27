import React, { useEffect, useState, useContext } from "react";
import { GameContext } from "../../context";
import dealerImg from "../../images/dealer.png";
import playerImg from "../../images/avatars/player0.png";
import chatBubble from "../../images/chat-bubble.png";
// import roomBg from "../../images/room-bg.png";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import cardOffsets from "../../util/cardOffsets";
import { motion } from "framer-motion";

const Room = () => {
  const { roomId } = useParams();
  const { socket } = useContext(GameContext); // Get socket from context
  const navigate = useNavigate();

  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState({});
  const [gameStarted, setGameStarted] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 850);
  const [betSize, setBetSize] = useState(50);
  const [message, setMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Effect to handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 850);
    };

    window.addEventListener("resize", handleResize);

    // Cleanup on unmount
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const showToast = (type, message) => {
    switch (type) {
      case "success":
        toast.success(message);
        break;
      case "error":
        toast.error(message);
        break;
      case "warning":
        toast.warning(message);
        break;
      case "info":
        toast.info(message);
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    if (!socket || !roomId) return; // Early return if socket is not initialized

    const handleReturningPlayerList = (updatedPlayers) => {
      // Find the current player based on socket.id
      const tempCurrentPlayer = updatedPlayers?.find(
        (player) => player?.id === socket.id
      );

      // Set the current player
      if (tempCurrentPlayer) {
        setCurrentPlayer(tempCurrentPlayer);
      }

      // Filter out the current player to get the other players
      const otherPlayers = updatedPlayers?.filter(
        (player) => player?.id !== socket.id
      );
      // Update the players state with the filtered list
      setPlayers(setPlayerPositions(otherPlayers));
    };

    const handleGameEnded = (type, message) => {
      showToast(type, message);
      setGameStarted(false);
    };

    const handleBetSizeUpdate = (value) => {
      showToast("info", `Bet size updated to $${value}`);
      setBetSize(value);
    };

    const handleKicked = (type, message) => {
      showToast(type, message);
      navigate("/");
    };

    const handleReceiveMessage = (data) => {
      setChatMessages((prevMessages) => [...prevMessages, data]);
      // Check if the message is not from the current player
      if (data.id !== currentPlayer?.id && !isChatOpen) {
        setUnreadMessages((prev) => prev + 1); // Increment if chat is closed
      }
    };

    socket.emit("getPlayerList", roomId);

    // Listen for socket events
    socket.on("returningPlayerList", handleReturningPlayerList);
    socket.on("updatePlayerList", handleReturningPlayerList);
    socket.on("updatePlayers", handleReturningPlayerList);
    socket.on("betSizeUpdated", handleBetSizeUpdate);
    socket.on("gameEnded", handleGameEnded);
    socket.on("playerJoined", showToast);
    socket.on("playerLeft", showToast);
    socket.on("lessPlayersError", showToast);
    socket.on("insufficientBalanceError", showToast);
    socket.on("playerOutError", showToast);
    socket.on("notChanceError", showToast);
    socket.on("kicked", handleKicked);
    socket.on("playerKicked", showToast);
    socket.on("newHostAssigned", showToast);
    socket.on("receiveMessage", handleReceiveMessage);

    socket.on("gameStarted", (players) => {
      setGameStarted(true);
      showToast("info", "Game has started!");
      handleReturningPlayerList(players);
    });

    // Clean up the event listener on unmount
    return () => {
      socket.off("updatePlayerList");
      socket.off("returningPlayerList");
      socket.off("updatePlayers");
      socket.off("gameStarted");
      socket.off("playerJoined");
      socket.off("playerLeft");
      socket.off("betSizeUpdated");
      socket.off("lessPlayersError");
      socket.off("insufficientBalanceError");
      socket.off("playerOutError");
      socket.off("notChanceError");
      socket.off("kicked");
      socket.off("playerKicked");
      socket.off("newHostAssigned");
      socket.off("receiveMessage");
      socket.off("gameEnded");
    };
    // eslint-disable-next-line
  }, [socket, roomId, currentPlayer]);

  const setPlayerPositions = (players) => {
    players = players?.map((player, i) => {
      switch (i) {
        case 0:
          player.position = {
            x: 280,
            y: -150,
          };
          break;
        case 1:
          player.position = {
            x: 280,
            y: 80,
          };
          break;
        case 2:
          player.position = {
            x: -400,
            y: 80,
          };
          break;
        case 3:
          player.position = {
            x: -400,
            y: -150,
          };
          break;
        default:
          break;
      }

      return player;
    });

    return players;
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard
      .writeText(roomId)
      .then(() => {
        toast.success("Room ID copied to clipboard!");
      })
      .catch((err) => {
        toast.error("Failed to copy. Please try again!");
        console.error("Failed to copy: ", err);
      });
  };

  const hitHandler = () => {
    socket.emit("hit", roomId, currentPlayer.id);
  };

  const standHandler = () => {
    socket.emit("stand", roomId, currentPlayer.id);
  };

  const startGameHandler = () => {
    socket.emit("startGame", roomId);
  };

  const updateBetSize = (value) => {
    socket.emit("betSizeChanged", roomId, value);
    setBetSize(value);
  };

  const handleLeaveRoom = () => {
    socket.emit("leaveRoom", roomId);
    navigate("/");
  };

  const handleKickPlayer = (id) => {
    socket.emit("kickPlayer", roomId, id);
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      socket.emit("sendMessage", roomId, currentPlayer?.id, message);
      setMessage(""); // Clear input
    }
  };

  const toggleChat = () => {
    setIsChatOpen((prev) => {
      if (!prev) {
        setUnreadMessages(0); // Reset unread messages when opening chat
      }
      return !prev;
    });
  };

  return (
    <div
      className="flex justify-center items-center flex-col min-h-screen relative bg-cover bg-center"
      style={{
        background:
          "radial-gradient(circle, rgba(0,212,255,1) 0%, rgba(9,9,121,1) 47%, rgba(3,1,49,1) 90%, rgba(2,0,36,1) 100%)",
      }}
    >
      {isMobile ? (
        <div
          className="p-8 rounded-lg text-white"
          style={{ background: "rgba(0,0,0,0.6)" }}
        >
          <h1 className="text-lg">
            Sorry! Currently, this game can only be played on desktop
          </h1>
        </div>
      ) : (
        <>
          <div className="w-full px-3 -mt-8 flex justify-between">
            <div
              className="bg-[rgba(0,0,0,0.5)] w-fit px-3 py-2 rounded-lg cursor-pointer"
              onClick={handleCopyToClipboard}
            >
              <p className="text-white">
                Room ID: {roomId} (Click here to copy it)
              </p>
            </div>
            <button
              className="bg-red-600 text-white px-3 py-2 rounded-lg transition-all hover:bg-red-700"
              onClick={handleLeaveRoom}
            >
              Leave Room
            </button>
          </div>
          <img
            src={dealerImg}
            alt="dealer"
            className="h-28 relative top-10 -mt-10 z-10 rounded-lg"
          />
          <div
            className="flex justify-center items-center w-[800px] h-[400px] rounded-full border-[10px] border-amber-950 relative"
            style={{
              boxShadow:
                "inset 0 0 30px rgba(0, 0, 0, 0.6), 0 0 30px rgba(0, 0, 0, 0.6)",
              background:
                "radial-gradient(circle, rgba(186,4,4,1) 0%, rgba(79,0,0,1) 100%)",
              clipPath:
                'path("M -30 400 L -30 -30 L 350 -30 A 10 13 0 0 0 450 -30 L 830 -30 L 830 430 Z")',
            }}
          >
            <div className="flex relative gap-4 z-10">
              {gameStarted ? (
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
              )}
              <div className="flex absolute top-20">
                {currentPlayer?.cards_in_hand?.length > 0 &&
                  currentPlayer.cards_in_hand.map((card, i) => {
                    const handLength = currentPlayer.cards_in_hand.length;
                    return (
                      <motion.img
                        key={`${card.value}-of-${card.suit}-${i}`}
                        src={require(`../../images/cards/${card.suit}/${card.value}.png`)}
                        alt={`${card.value} of ${card.suit}`}
                        className="w-16 h-auto transition-all"
                        initial={{ opacity: 0, x: i * -40, y: -400 }}
                        animate={{
                          opacity: 1,
                          transform: `rotate(${cardOffsets[handLength].angleOffset[i]}deg) translateX(${cardOffsets[handLength].XOffset[i]}px) translateY(${cardOffsets[handLength].YOffset[i]}px)`,
                        }}
                        transition={{ duration: 0.5, delay: i * 0.2 }} // Stagger the cards
                      />
                    );
                  })}
                {currentPlayer?.cards_sum > 0 && (
                  <div className="absolute top-14 left-[35%] rounded-full bg-black text-white px-2 py-1 z-2">
                    {currentPlayer?.cards_sum}
                  </div>
                )}
              </div>
            </div>
          </div>
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
            <img
              src={currentPlayer?.img || playerImg} // Use player image if available
              alt={`Current Player`}
              className="rounded-full w-20 h-20"
            />
            <div className="text-white ">
              <p>{currentPlayer?.username}</p>
            </div>
          </div>
          {players?.map((player, index) => (
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
                      <img
                        key={`${card.value}-of-${card.suit}-${i}`}
                        src={require(`../../images/cards/${card.suit}/${card.value}.png`)}
                        alt={`${card.value} of ${card.suit}`}
                        className={`w-16 h-auto`}
                        style={{
                          transform: `translateX(-${i * 40}px)`,
                        }}
                      />
                    );
                  })}
              </div>
              {player?.cards_sum > 0 && (
                <div className="absolute -top-10 rounded-full bg-black text-white px-2 py-1 z-2">
                  {player?.cards_sum}
                </div>
              )}
              <div
                className={`px-3 py-2 flex max-w-52 gap-3 bg-black rounded-lg border-4 ${
                  player?.is_chance ? "border-yellow-400" : "border-black"
                }`}
              >
                {/* Overlay for players who are out */}
                {player?.is_out && gameStarted && (
                  <div className="absolute inset-0 bg-black bg-opacity-70 flex justify-center items-center text-white text-2xl font-bold rounded-lg">
                    Busted
                  </div>
                )}
                <img
                  key={index}
                  src={player?.img || playerImg} // Use player image if available
                  alt={`Player ${index + 1}`}
                  className="rounded-full w-20 h-20"
                />
                <div className="text-white mt-2">
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
          ))}
          <div className="self-start bg-[rgba(0,0,0,0.5)] text-white -mt-20 ml-2 px-3 py-2 rounded-md">
            Balance: {currentPlayer?.balance}
          </div>

          <div className="flex items-center gap-2 self-end bg-[rgba(0,0,0,0.5)] text-white -mt-10 mr-2 px-3 py-2 rounded-md">
            <label htmlFor="bet-size" className="block">
              Bet Size:
            </label>
            <select
              id="bet-size"
              className="bg-gray-800 text-white border border-amber-500 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-500 transition duration-200"
              value={betSize} // Assuming betSize is a state variable
              onChange={(e) => updateBetSize(e.target.value)} // Call the function on change
              disabled={gameStarted || !currentPlayer?.is_host}
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="200">200</option>
            </select>
          </div>

          {/* Chat UI */}
          <motion.div
            className="absolute top-20 flex flex-row-reverse"
            initial={{ left: "-320px" }} // Start off-screen to the left
            animate={{ left: isChatOpen ? 0 : "-320px" }} // Slide in or out based on state
          >
            {/* Chat Toggle Button */}
            <button
              onClick={toggleChat}
              className="bg-blue-600 text-white rounded-r-md px-4 py-2 h-fit"
            >
              <img src={chatBubble} alt="Chat" className="w-10 h-10" />
              {unreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full px-1 text-xs">
                  {unreadMessages}
                </span>
              )}
            </button>
            <div className="flex flex-col bg-black rounded-br-lg p-4 w-80">
              <div className="flex-1 overflow-y-auto max-h-48 overflow-hidden">
                {chatMessages.map((msg, index) => (
                  <div
                    key={index}
                    className="text-white mb-2 break-words max-w-full"
                  >
                    <strong>{msg.username}:</strong> {msg.message}
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-1">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-white text-black rounded-md p-2"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSendMessage();
                    }
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-blue-600 text-white rounded-md px-4"
                >
                  Send
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
};

export default Room;
