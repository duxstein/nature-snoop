import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import PlantIdentificationActions from "@/components/plant/PlantIdentificationActions";
import PlantIdentificationResult from "@/components/plant/PlantIdentificationResult";
import FeatureCard from "@/components/plant/FeatureCard";
import Footer from "@/components/Footer";
import WavingPlant from "@/components/WavingPlant";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [identificationResult, setIdentificationResult] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === 'SIGNED_OUT') {
        toast.success('Successfully signed out');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleImageUpload = async (file: Blob) => {
    if (!user) {
      toast.error('Please sign in to identify plants');
      return;
    }

    setIsIdentifying(true);
    try {
      const fileName = `${crypto.randomUUID()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('plant-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('plant-images')
        .getPublicUrl(fileName);

      const { data: identificationData, error: identificationError } = await supabase.functions
        .invoke('identify-plant', {
          body: { imageUrl: publicUrl },
          headers: { 'x-user-id': user.id }
        });

      if (identificationError) throw identificationError;

      setIdentificationResult(identificationData);
      toast.success('Plant identified successfully!');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to identify plant');
    } finally {
      setIsIdentifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-natural-50 via-white to-natural-100">
      <WavingPlant />
      <nav className="fixed w-full bg-white/80 backdrop-blur-sm border-b border-natural-200 z-50">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="text-2xl font-semibold text-natural-800 bg-gradient-to-r from-natural-600 to-natural-800 bg-clip-text text-transparent">
            PlantAI
          </div>
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

      <main className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-natural-200/30 via-transparent to-transparent pointer-events-none" />
        
        <section className="pt-32 pb-20 px-4 relative">
          <div className="container mx-auto">
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
              
              {user && (
                <PlantIdentificationActions
                  onImageCapture={handleImageUpload}
                  isIdentifying={isIdentifying}
                />
              )}

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

            {identificationResult && (
              <PlantIdentificationResult 
                result={identificationResult}
                imageUrl={identificationResult.image_url}
              />
            )}

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

      <Footer />
    </div>
  );
};

export default Index;