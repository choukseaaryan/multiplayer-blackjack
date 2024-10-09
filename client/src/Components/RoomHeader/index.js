import React, { useContext } from "react";
import { GameContext } from "../../context";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const RoomHeader = ({ classes = "" }) => {
  const navigate = useNavigate();
  const { socket, roomId } = useContext(GameContext);

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

  const handleLeaveRoom = () => {
    socket.emit("leaveRoom", roomId);
    navigate("/");
  };

  return (
    <div className={"w-full px-3 flex justify-between " + classes}>
      <div
        className="bg-[rgba(0,0,0,0.5)] w-fit px-3 py-2 rounded-lg cursor-pointer"
        onClick={handleCopyToClipboard}
      >
        <p className="text-white">Room ID: {roomId} (Click here to copy it)</p>
      </div>
      <button
        className="bg-red-600 text-white px-3 py-2 rounded-lg transition-all hover:bg-red-700"
        onClick={handleLeaveRoom}
      >
        Leave Room
      </button>
    </div>
  );
};

export default RoomHeader;
