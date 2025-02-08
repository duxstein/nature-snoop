
import { User } from "@supabase/supabase-js";
import { Button } from "../ui/button";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface WelcomeProps {
  user: User | null;
}

const Welcome = ({ user }: WelcomeProps) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="text-center max-w-3xl mx-auto"
    >
      <h1 className="text-5xl font-bold bg-gradient-to-r from-natural-800 to-natural-600 bg-clip-text text-transparent mb-6">
        {user ? `Welcome Back!` : 'Discover the World of Plants'}
      </h1>
      <p className="text-xl text-natural-600 mb-8">
        {user
          ? "Start identifying plants and building your collection today."
          : "Instantly identify plants, learn about their characteristics, and track your botanical discoveries with our AI-powered platform."}
      </p>

      {!user && (
        <Button
          size="lg"
          className="bg-natural-600 hover:bg-natural-700 text-white"
          onClick={() => navigate("/signup")}
        >
          Start Identifying Plants
        </Button>
      )}
    </motion.div>
  );
};

export default Welcome;
