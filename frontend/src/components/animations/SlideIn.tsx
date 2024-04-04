import { useEffect, useRef } from "react";
import { motion, useAnimation, useInView } from "framer-motion";

interface Props {
  children: JSX.Element;
  width?: "fit-content" | "w-full";
  direction: "left" | "right";
}

const SlideIn = ({ children, width = "fit-content", direction }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const isVisible = useInView(ref, { once: true });

  const animationControls = useAnimation();

  useEffect(() => {
    if (isVisible) {
      animationControls.start("visible");
    }
  }, [isVisible]);

  return (
    <div ref={ref} style={{ width, position: "relative" }} className={width}>
      <motion.div
        className="justify-center flex"
        variants={{
          hidden: { opacity: 0, x: direction === "left" ? -500 : 500 },
          visible: { opacity: 1, x: 0 },
        }}
        initial="hidden"
        animate={animationControls}
        transition={{
          duration: 0.7,
          ease: "easeOut",
          delay: 0.2,
        }}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default SlideIn;
