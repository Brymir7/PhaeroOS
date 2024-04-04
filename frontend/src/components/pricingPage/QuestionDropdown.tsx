import React from "react";
import { MinusBlack, PlusBlack } from "../../assets/SVGIcons";
import { AnimatePresence, motion } from "framer-motion";

interface Props {
  heading: string;
  text: string;
  isOpen: boolean;
  index: number;
  setIsOpen: (index: number) => void;
}

const QuestionDropdown: React.FC<Props> = ({
  heading,
  text,
  isOpen,
  index,
  setIsOpen,
}) => {
  return (
    <button
      onClick={() => setIsOpen(index)}
      className={`flex flex-col overflow-hidden hover:bg-[#d8d8d8] h-fit mx-10 py-4 px-6 rounded-md w-5/6 max-w-6xl ${
        isOpen ? "bg-[#d2d2d2]" : "bg-[#e8e8e8]"
      }`}
    >
      <div className="flex items-center justify-between w-full">
        <h1 className="text-lg lg:text-xl text-left">{heading}</h1>

        <div className="w-10 h-10 flex flex-shrink-0">
          {isOpen ? <MinusBlack /> : <PlusBlack />}
        </div>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="text-sm lg:text-base text-left"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <br />
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
};

export default QuestionDropdown;
