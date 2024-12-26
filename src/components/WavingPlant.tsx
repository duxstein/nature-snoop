import { motion } from 'framer-motion';

const WavingPlant = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-10">
      <motion.svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        initial={{ rotate: -2 }}
        animate={{ 
          rotate: 2,
          y: [0, -5, 0]
        }}
        transition={{
          repeat: Infinity,
          duration: 2,
          ease: "easeInOut"
        }}
      >
        <motion.path
          d="M50 90 C30 90, 30 70, 30 50 C30 30, 40 20, 50 10 C60 20, 70 30, 70 50 C70 70, 70 90, 50 90"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-natural-600"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{
            duration: 2,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
      </motion.svg>
    </div>
  );
};

export default WavingPlant;