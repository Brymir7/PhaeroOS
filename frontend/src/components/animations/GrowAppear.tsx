import React from "react";
import { motion } from "framer-motion";

interface Props {
  index: number;
  children: React.ReactNode;
  manualDelay?: number;
  extraClasses?: string;
}

const GrowAppear = ({ index, children, manualDelay, extraClasses }: Props) => {
  let delay;
  if (manualDelay) delay = manualDelay;
  else delay = index * 0.05 + 0.2; // Adjust the multiplier to control the delay between items

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: delay, duration: 0.4 }}
      className={extraClasses}
    >
      {children}
    </motion.div>
  );
};

export default GrowAppear;
