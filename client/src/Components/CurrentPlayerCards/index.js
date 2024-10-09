import React from "react";
import { motion } from "framer-motion";
import cardOffsets from "../../util/cardOffsets";

const CurrentPlayerCards = ({ cards = [], sum = 0 }) => {
  const handLength = cards.length;

  return (
    <div className="flex absolute top-20">
      {cards.map((card, i) => {
        return (
          <motion.img
            key={`${card.value}-of-${card.suit}-${i}`}
            src={require(`../../images/cards/${card.suit}/${card.value}.png`)}
            alt={`${card.value} of ${card.suit}`}
            className="w-16 h-auto transition-all"
            initial={{
              opacity: 0,
              x: i * -40,
              y: -400,
              rotate: 180,
              scale: 0.2,
            }}
            animate={{
              opacity: 1,
              transform: `rotate(${cardOffsets[handLength].angleOffset[i]}deg) translateX(${cardOffsets[handLength].XOffset[i]}px) translateY(${cardOffsets[handLength].YOffset[i]}px)`,
              scale: 1,
            }}
            transition={{ duration: 0.5, delay: i * 0.2 }} // Stagger the cards
          />
        );
      })}
      {sum && (
        <div className="absolute top-14 left-[35%] rounded-full bg-black text-white px-2 py-1 z-2">
          {sum}
        </div>
      )}
    </div>
  );
};

export default CurrentPlayerCards;
