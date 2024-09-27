import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GameContext } from "../../context";
import { toast } from "react-toastify";
import PageLoader from "../../Components/PageLoader";
import loginBg from "../../images/login-bg.jpg";
import player0 from "../../images/avatars/player0.png";
import player1 from "../../images/avatars/player1.png";
import player2 from "../../images/avatars/player2.png";
import player3 from "../../images/avatars/player3.png";
import player4 from "../../images/avatars/player4.png";

const Login = () => {
  const navigate = useNavigate();
  const { updateData, socket } = useContext(GameContext);
  const [data, setData] = useState({
    username: "",
    roomId: "",
  });
  const [loading, setLoading] = useState(false);
  const avatars = [player0, player1, player2, player3, player4];
  const [avatarIndex, setAvatarIndex] = useState(0);
  const [avatar, setAvatar] = useState(avatars[avatarIndex]);

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
    if (!socket) return; // Early return if socket is not initialized

    const handleNavigation = (roomId) => {
      const payload = { ...data, roomId };
      updateData(payload);
      navigate("/room/" + roomId);
    };

    socket.on("roomCreated", handleNavigation);
    socket.on("joinedRoom", handleNavigation);

    // Show toasts based on error or success
    socket.on("roomNotFoundError", showToast);
    socket.on("usernameTakenError", showToast);
    socket.on("userExistsError", showToast);
    socket.on("matchStartedError", showToast);
    socket.on("lobbyFullError", showToast);

    // Cleanup function to remove event listeners
    return () => {
      socket.off("roomCreated");
      socket.off("joinedRoom");
      socket.off("roomNotFoundError");
      socket.off("usernameTakenError");
      socket.off("userExistsError");
      socket.off("matchStartedError");
      socket.off("lobbyFullError");
    };
  }, [data, navigate, socket, updateData]);

  const joinRoomHandler = () => {
    if (!data.username) {
      toast.error("Please enter username!");
      return;
    }

    if (!data.roomId) {
      toast.error("Please enter Room Id!");
      return;
    }

    setLoading(true); // Set loading before emitting
    socket.emit("joinRoom", data.roomId, data.username, avatar);
    setLoading(false);
  };

  const changeHandler = (e) => {
    setData((prevData) => ({
      ...prevData,
      [e.target.name]: e.target.value,
    }));
  };

  const createRoomHandler = () => {
    if (!data.username) {
      toast.error("Please enter username!");
      return;
    }

    setLoading(true); // Set loading before emitting
    socket.emit("createRoom", data.username, avatar);
  };

  const handleAvatarChange = (direction) => {
    let nextIndex;
  
    if (direction === "prev") {
      nextIndex = (avatarIndex - 1 + avatars.length) % avatars.length; // Wrap around
    } else if (direction === "next") {
      nextIndex = (avatarIndex + 1) % avatars.length; // Wrap around
    } else {
      return; // Do nothing if the direction is not recognized
    }
  
    setAvatarIndex(nextIndex);
    setAvatar(avatars[nextIndex]);
  };
  
  return (
    <>
      {loading && <PageLoader />}
      <div
        style={{
          backgroundImage: `url(${loginBg})`,
        }}
        className="bg-cover bg-center w-full flex justify-center items-center min-h-screen"
      >
        <div className="text-white bg-black bg-opacity-80 shadow-lg rounded-2xl p-12 flex flex-col items-center justify-center">
          <h1 className="text-3xl">Multiplayer BlackJack</h1>
          <div className="login__form m-4 flex flex-wrap">
            <div>
              <h4 className="text-center">Select Avatar</h4>
              <div className="flex justify-center items-center gap-4">
                <button
                  onClick={() => handleAvatarChange("prev")}
                  className="h-fit text-[#f8e5c5] bg-black border-[#f8e5c5] border rounded-md px-2 py-1 transition-all duration-200 ease-in-out hover:bg-[#f8e5c5] hover:text-black"
                >
                  {"<"}
                </button>
                <img
                  className="w-24 h-24 rounded-full self-center"
                  src={avatar}
                  alt="avatar"
                />
                <button
                  onClick={() => handleAvatarChange("next")}
                  className="h-fit text-[#f8e5c5] bg-black border-[#f8e5c5] border rounded-md px-2 py-1 transition-all duration-200 ease-in-out hover:bg-[#f8e5c5] hover:text-black"
                >
                  {">"}
                </button>
              </div>
              <h4>Username</h4>
              <input
                name="username"
                type="text"
                value={data.username}
                placeholder="Enter Username"
                onChange={changeHandler}
                maxLength={10}
              />
              <button
                onClick={createRoomHandler}
                className="w-full text-[#f8e5c5] bg-black border-[#f8e5c5] border rounded-md px-2 py-1 mt-5 transition-all duration-200 ease-in-out hover:bg-[#f8e5c5] hover:text-black"
              >
                Create room
              </button>
            </div>

            <div className="w-[1px] bg-white mx-5 flex-grow hidden md:block">
            </div>

            <div>
              <h4>Room Id</h4>
              <input
                name="roomId"
                type="text"
                value={data.roomId}
                placeholder="Enter roomId"
                onChange={changeHandler}
                className="password__input"
              />

              <button
                onClick={joinRoomHandler}
                className="w-full text-[#f8e5c5] bg-black border-[#f8e5c5] border rounded-md px-2 py-1 mt-5 transition-all duration-200 ease-in-out hover:bg-[#f8e5c5] hover:text-black"
              >
                Join room
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
