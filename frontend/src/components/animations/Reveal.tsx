import { useEffect, useRef } from "react";
import { motion, useAnimation, useInView } from "framer-motion";

interface Props {
  children: JSX.Element;
}

const Reveal = ({ children }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null!);
  const isInView = useInView(containerRef, { once: true });

  const mainControls = useAnimation();
  const slideControls = useAnimation();

  useEffect(() => {
    // Animate the main content and slide controls when the component is in view
    isInView
      ? Promise.all([
          mainControls.start("visible"),
          slideControls.start("visible"),
        ])
      : Promise.all([
          mainControls.start("hidden"),
          slideControls.start("hidden"),
        ]);
  }, [isInView]);

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", width: "fit-content", overflow: "hidden" }}
    >
      {/* Animate the main content */}
      <motion.div
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, y: 0 },
        }}
        initial="hidden"
        animate={mainControls}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
      >
        {children}
      </motion.div>

      {/* Animate the slide controls */}
      <motion.div
        variants={{ hidden: { left: 0 }, visible: { left: "100%" } }}
        initial="hidden"
        animate={slideControls}
        transition={{ duration: 0.5, ease: "easeIn" }}
        style={{
          position: "absolute",
          top: 4,
          bottom: 4,
          left: 0,
          right: 0,
          background: "skyblue",
          zIndex: 20,
        }}
      />
    </div>
  );
};

export default Reveal;