import React, { useEffect, useState, useContext } from "react";
import { GameContext } from "../../context";
import dealerImg from "../../images/dealer.png";
import roomBg from "../../images/room-bg.jpg";
import { useNavigate, useParams } from "react-router-dom";
import showToast from "../../Components/ShowToast";
import RoomHeader from "../../Components/RoomHeader";
import GameControls from "../../Components/GameControls";
import CurrentPlayerCards from "../../Components/CurrentPlayerCards";
import WinOverlay from "../../Components/WinOverlay";
import CurrentPlayerCardItem from "../../Components/CurrentPlayerCardItem";
import OtherPlayerCardItem from "../../Components/OtherPlayerCardItem";
import RoomFooter from "../../Components/RoomFooter";
import Chatbox from "../../Components/Chatbox";

const Room = () => {
  const { roomId } = useParams();
  const { socket, currentPlayer, updateCurrentPlayer } =
    useContext(GameContext); // Get socket from context
  const navigate = useNavigate();

  const [players, setPlayers] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 850);

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

  useEffect(() => {
    if (!socket || !roomId) return; // Early return if socket is not initialized

    const handleReturningPlayerList = (updatedPlayers) => {
      // Find the current player based on socket.id
      const tempCurrentPlayer = updatedPlayers?.find(
        (player) => player?.id === socket.id
      );

      // Set the current player
      if (tempCurrentPlayer) {
        updateCurrentPlayer(tempCurrentPlayer);
      }

      // Filter out the current player to get the other players
      const otherPlayers = updatedPlayers?.filter(
        (player) => player?.id !== socket.id
      );
      // Update the players state with the filtered list
      setPlayers(setPlayerPositions(otherPlayers));
    };

    const handleKicked = (type, message) => {
      showToast(type, message);
      navigate("/");
    };

    socket.emit("getPlayerList", roomId);

    // Listen for socket events
    socket.on("returningPlayerList", handleReturningPlayerList);
    socket.on("updatePlayerList", handleReturningPlayerList);
    socket.on("updatePlayers", handleReturningPlayerList);
    socket.on("playerJoined", showToast);
    socket.on("playerLeft", showToast);
    socket.on("lessPlayersError", showToast);
    socket.on("insufficientBalanceError", showToast);
    socket.on("playerOutError", showToast);
    socket.on("notChanceError", showToast);
    socket.on("kicked", handleKicked);
    socket.on("playerKicked", showToast);
    socket.on("newHostAssigned", showToast);

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
      socket.off("lessPlayersError");
      socket.off("insufficientBalanceError");
      socket.off("playerOutError");
      socket.off("notChanceError");
      socket.off("kicked");
      socket.off("playerKicked");
      socket.off("newHostAssigned");
    };
    // eslint-disable-next-line
  }, [socket, roomId]);

  const setPlayerPositions = (players) => {
    players = players?.map((player, i) => {
      switch (i) {
        case 0:
          player.position = {
            x: 280,
            y: -170,
            initialCardX: -310,
          };
          break;
        case 1:
          player.position = {
            x: 280,
            y: 80,
            initialCardX: -310,
          };
          break;
        case 2:
          player.position = {
            x: -400,
            y: -170,
            initialCardX: 310,
          };
          break;
        case 3:
          player.position = {
            x: -400,
            y: 80,
            initialCardX: 310,
          };
          break;
        default:
          break;
      }

      return player;
    });

    return players;
  };

  return (
    <div
      className="flex justify-center items-center flex-col min-h-screen relative bg-cover bg-center"
      style={{
        backgroundImage: `url(${roomBg})`,
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
          {/* Room ID and Leave button */}
          <RoomHeader classes="-mt-8" />

          {/* Dealer's image */}
          <img
            src={dealerImg}
            alt="dealer"
            className="h-28 relative top-11 -mt-10 z-10 rounded-lg"
          />

          {/* Table */}
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
              {/* Game Controls */}
              <GameControls gameStarted={gameStarted} />

              {/* Current Player's Cards */}
              {currentPlayer?.cards_in_hand?.length > 0 && (
                <CurrentPlayerCards
                  cards={currentPlayer.cards_in_hand}
                  sum={currentPlayer?.cards_sum}
                />
              )}

              {/* Win Overlay */}
              <WinOverlay setGameStarted={setGameStarted} />
            </div>
          </div>

          {/* Current Player's Card Item */}
          <CurrentPlayerCardItem />

          {/* Other Players' Card Items */}
          {players?.map((player, index) => (
            <OtherPlayerCardItem
              player={player}
              index={index}
              gameStarted={gameStarted}
            />
          ))}

          {/* Balance and Bet size */}
          <RoomFooter
            balance={currentPlayer?.balance}
            isHost={currentPlayer?.is_host}
            gameStarted={gameStarted}
          />

          {/* Chat UI */}
          <Chatbox />
        </>
      )}
    </div>
  );
};

export default Room;
