import { motion } from "framer-motion";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
}

const FeatureCard = ({ title, description, icon }: FeatureCardProps) => (
  <motion.div
    whileHover={{ y: -5 }}
    className="p-6 rounded-xl bg-white/80 backdrop-blur-sm border border-natural-200 shadow-sm"
  >
    <div className="text-4xl mb-4">{icon}</div>
    <h3 className="text-xl font-semibold text-natural-800 mb-2">{title}</h3>
    <p className="text-natural-600">{description}</p>
  </motion.div>
);

export default FeatureCard;