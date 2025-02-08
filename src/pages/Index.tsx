import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import PlantIdentificationActions from "@/components/plant/PlantIdentificationActions";
import PlantIdentificationResult from "@/components/plant/PlantIdentificationResult";
import FeatureCard from "@/components/plant/FeatureCard";
import Footer from "@/components/Footer";
import WavingPlant from "@/components/WavingPlant";
import Header from "@/components/layout/Header";
import SearchHistory from "@/components/plant/SearchHistory";
import { getValidUrl } from "@/utils/urlUtils";
import PlantAR from "@/components/plant/PlantAR";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [identificationResult, setIdentificationResult] = useState<any>(null);
  const [searchHistory, setSearchHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showAR, setShowAR] = useState(false);

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

  useEffect(() => {
    if (user) {
      fetchSearchHistory();
    }
  }, [user]);

  const fetchSearchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('search_history')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSearchHistory(data || []);
    } catch (error) {
      console.error('Error fetching search history:', error);
      toast.error('Failed to load search history');
    } finally {
      setIsLoadingHistory(false);
    }
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

      // Ensure the URL is properly formatted
      const validUrl = getValidUrl(publicUrl);

      const { data: identificationData, error: identificationError } = await supabase.functions
        .invoke('identify-plant', {
          body: { imageUrl: validUrl },
          headers: { 'x-user-id': user.id }
        });

      if (identificationError) throw identificationError;

      await supabase.from('search_history').insert({
        user_id: user.id,
        search_term: identificationData.name || 'Unknown plant',
        image_url: validUrl,
        result: identificationData
      });

      setIdentificationResult(identificationData);
      toast.success('Plant identified successfully!');
      fetchSearchHistory();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to identify plant');
    } finally {
      setIsIdentifying(false);
    }
  };

  const handleDeleteHistory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('search_history')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Search history entry deleted');
      fetchSearchHistory();
    } catch (error) {
      console.error('Error deleting history:', error);
      toast.error('Failed to delete history entry');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-natural-50 via-white to-natural-100">
      <WavingPlant />
      <Header user={user} />

      {showAR && <PlantAR />}

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
              <div>
                <PlantIdentificationResult 
                  result={identificationResult}
                  imageUrl={identificationResult.image_url}
                />
                <div className="mt-4 text-center">
                  <Button
                    onClick={() => setShowAR(true)}
                    className="bg-natural-600 hover:bg-natural-700 text-white"
                  >
                    View in AR
                  </Button>
                </div>
              </div>
            )}

            {user && searchHistory.length > 0 && (
              <SearchHistory 
                searchHistory={searchHistory}
                onDelete={handleDeleteHistory}
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
