import { motion } from "framer-motion";

const WavingPlant = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-10">
      <motion.svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        className="w-full h-full"
        initial={{ rotate: -5 }}
        animate={{
          rotate: 5,
          y: [0, -5, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
      >
        <path
          d="M50 90 C30 90, 30 70, 30 50 C30 30, 40 20, 50 10 C60 20, 70 30, 70 50 C70 70, 70 90, 50 90"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-natural-600"
        />
        <path
          d="M45 85 C35 85, 25 75, 25 55 C25 35, 35 25, 45 15"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-natural-500"
        />
        <path
          d="M55 85 C65 85, 75 75, 75 55 C75 35, 65 25, 55 15"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-natural-500"
        />
      </motion.svg>
    </div>
  );
};

export default WavingPlant;