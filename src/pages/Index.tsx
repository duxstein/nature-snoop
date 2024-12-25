import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Camera, Upload, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [identificationResult, setIdentificationResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [showCamera, setShowCamera] = useState(false);

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
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Failed to access camera');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        canvas.toBlob(async (blob) => {
          if (blob) {
            await handleImageUpload(blob);
          }
        }, 'image/jpeg');
      }
      stopCamera();
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

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await handleImageUpload(file);
    }
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
              
              {user && (
                <div className="flex justify-center gap-4 mb-8">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => {
                          setShowCamera(true);
                          startCamera();
                        }}
                        className="bg-natural-600 hover:bg-natural-700 text-white"
                      >
                        <Camera className="mr-2" /> Capture Photo
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Capture Plant Photo</DialogTitle>
                      </DialogHeader>
                      {showCamera && (
                        <div className="flex flex-col items-center gap-4">
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full max-w-md rounded-lg"
                          />
                          <Button onClick={captureImage}>Capture</Button>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>

                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-natural-600 hover:bg-natural-700 text-white"
                  >
                    <Upload className="mr-2" /> Upload Photo
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileSelect}
                  />
                </div>
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

            {isIdentifying && (
              <div className="flex justify-center items-center mt-8">
                <Loader2 className="animate-spin mr-2" />
                <span>Identifying plant...</span>
              </div>
            )}

            {identificationResult && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-8"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>{identificationResult.common_name}</CardTitle>
                    <CardDescription>{identificationResult.scientific_name}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold">Description</h3>
                        <p>{identificationResult.description}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold">Care Instructions</h3>
                        <p>{identificationResult.care_instructions}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold">Confidence Level</h3>
                        <p className="capitalize">{identificationResult.confidence_level}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
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