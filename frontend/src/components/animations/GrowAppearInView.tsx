import React from "react";
import { motion, useAnimation, useInView } from "framer-motion";

interface Props {
  children: React.ReactNode;
  manualDelay?: number;
  extraClasses?: string;
}

const GrowAppearInView = ({ children, manualDelay, extraClasses }: Props) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const isElementInView = useInView(ref, { once: true });

  const animationControls = useAnimation();

  React.useEffect(() => {
    if (isElementInView) {
      animationControls.start("visible");
    }
  }, [isElementInView]);
  let delay;
  if (manualDelay) delay = manualDelay;
  else delay = 0.2; // Adjust the multiplier to control the delay between items

  return (
    <div ref={ref} className={extraClasses}>
      <motion.div
        variants={{
          hidden: { opacity: 0, scale: 0.7 },
          visible: { opacity: 1, scale: 1 },
        }}
        initial="hidden"
        animate={animationControls}
        transition={{ delay: delay, duration: 0.4 }}
        className={extraClasses}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default GrowAppearInView;
