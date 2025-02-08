
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import FeatureCard from "@/components/plant/FeatureCard";
import Footer from "@/components/Footer";
import WavingPlant from "@/components/WavingPlant";
import Header from "@/components/layout/Header";
import SearchHistory from "@/components/plant/SearchHistory";
import Welcome from "@/components/plant/Welcome";
import PlantIdentification from "@/components/plant/PlantIdentification";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [searchHistory, setSearchHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

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

      <main className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-natural-200/30 via-transparent to-transparent pointer-events-none" />
        
        <section className="pt-32 pb-20 px-4 relative">
          <div className="container mx-auto">
            <Welcome user={user} />
            
            {user && (
              <PlantIdentification 
                user={user}
                onIdentificationComplete={fetchSearchHistory}
              />
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
