import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === 'SIGNED_OUT') {
        toast.success('Successfully signed out');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-natural-50 to-natural-100">
      <nav className="fixed w-full bg-white/80 backdrop-blur-sm border-b border-natural-200 z-50">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="text-2xl font-semibold text-natural-800">PlantAI</div>
          <div className="space-x-4">
            {user ? (
              <Button
                variant="ghost"
                className="text-natural-800 hover:text-natural-600"
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  className="text-natural-800 hover:text-natural-600"
                  onClick={() => navigate("/login")}
                >
                  Login
                </Button>
                <Button
                  className="bg-natural-600 hover:bg-natural-700 text-white"
                  onClick={() => navigate("/signup")}
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      <main>
        <section className="pt-32 pb-20 px-4">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto"
            >
              <h1 className="text-5xl font-bold text-natural-800 mb-6">
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

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              <FeatureCard
                title="Instant Identification"
                description="Upload a photo and get accurate plant identification in seconds using advanced AI technology."
                icon="🔍"
              />
              <FeatureCard
                title="Detailed Information"
                description="Access comprehensive plant care guides, growing tips, and botanical facts."
                icon="📚"
              />
              <FeatureCard
                title="Personal Collection"
                description="Build your own digital herbarium by saving and organizing your plant discoveries."
                icon="🌿"
              />
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
};

const FeatureCard = ({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: string;
}) => (
  <motion.div
    whileHover={{ y: -5 }}
    className="p-6 rounded-xl bg-white/80 backdrop-blur-sm border border-natural-200 shadow-sm"
  >
    <div className="text-4xl mb-4">{icon}</div>
    <h3 className="text-xl font-semibold text-natural-800 mb-2">{title}</h3>
    <p className="text-natural-600">{description}</p>
  </motion.div>
);

export default Index;