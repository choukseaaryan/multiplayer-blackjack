import React, { useEffect, useState } from "react";
import player0 from "../../images/avatars/player0.png";
import player1 from "../../images/avatars/player1.png";
import player2 from "../../images/avatars/player2.png";
import player3 from "../../images/avatars/player3.png";
import player4 from "../../images/avatars/player4.png";


const AvatarSelector = ({ avatar, setAvatar }) => {
  const avatars = [player0, player1, player2, player3, player4];
  const [avatarIndex, setAvatarIndex] = useState(0);

  useEffect(() => {
    setAvatar(avatars[0]);
    // eslint-disable-next-line
  }, []);


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
    </>
  );
};

export default AvatarSelector;
