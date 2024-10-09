import React, { useContext, useEffect, useState } from "react";
import { motion } from "framer-motion";
import chatBubble from "../../images/chat-bubble.png";
import { GameContext } from "../../context";

const Chatbox = () => {
  const { socket, roomId, currentPlayer } = useContext(GameContext);

  const [chatMessages, setChatMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (!socket || !roomId) return; // Early return if socket is not initialized

    const handleReceiveMessage = (data) => {
      setChatMessages((prevMessages) => [...prevMessages, data]);
      // Check if the message is not from the current player
      if (data.id !== currentPlayer?.id && !isChatOpen) {
        setUnreadMessages((prev) => prev + 1); // Increment if chat is closed
      }
    };

    socket.on("receiveMessage", handleReceiveMessage);

    return () => {
      socket.off("receiveMessage");
    }
  }, [socket, roomId, currentPlayer, isChatOpen])

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
          <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full px-2 py-0.5 text-sm">
            {unreadMessages}
          </span>
        )}
      </button>
      <div className="flex flex-col bg-black rounded-br-lg p-4 w-80">
        <div className="flex-1 overflow-y-auto max-h-48 overflow-hidden">
          {chatMessages.map((msg, index) => (
            <div key={index} className="text-white mb-2 break-words max-w-full">
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
  );
};

export default Chatbox;
