import { motion, useAnimation, useInView } from "framer-motion";
import React from "react";

interface AppearAnimationProps {
  children: React.ReactNode;
  width?: string;
  classes?: string;
}

const Appear = ({ children, width, classes }: AppearAnimationProps) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const isElementInView = useInView(ref, { once: true });

  const animationControls = useAnimation();

  React.useEffect(() => {
    if (isElementInView) {
      animationControls.start("visible");
    }
  }, [isElementInView]);

  return (
    <div ref={ref} style={{ width }} className={classes}>
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 },
        }}
        initial="hidden"
        animate={animationControls}
        transition={{ duration: 0.5,delay: 0.2, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default Appear;
