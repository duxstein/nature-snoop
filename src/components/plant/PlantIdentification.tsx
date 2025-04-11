
import { useState } from "react";
import { toast } from "sonner";
import PlantIdentificationActions from "./PlantIdentificationActions";
import PlantIdentificationResult from "./PlantIdentificationResult";
import PlantAR from "./PlantAR";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { getValidUrl } from "@/utils/urlUtils";

interface PlantIdentificationProps {
  user: User | null;
  onIdentificationComplete: () => void;
}

const PlantIdentification = ({ user, onIdentificationComplete }: PlantIdentificationProps) => {
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [identificationResult, setIdentificationResult] = useState<any>(null);
  const [showAR, setShowAR] = useState(false);
  const [arModelUrl, setArModelUrl] = useState<string | undefined>(undefined);

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
      onIdentificationComplete();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to identify plant');
    } finally {
      setIsIdentifying(false);
    }
  };

  const handleViewInAR = () => {
    // In a production app, we would set the model URL based on the plant type
    // For now, we'll use our default plant model
    setShowAR(true);
    toast.info("Launching AR experience");
  };

  return (
    <>
      <PlantIdentificationActions
        onImageCapture={handleImageUpload}
        isIdentifying={isIdentifying}
      />

      {identificationResult && (
        <div>
          <PlantIdentificationResult 
            result={identificationResult}
            imageUrl={identificationResult.image_url}
          />
          <div className="mt-4 text-center">
            <button
              onClick={handleViewInAR}
              className="bg-natural-600 hover:bg-natural-700 text-white px-4 py-2 rounded"
            >
              View in AR
            </button>
          </div>
        </div>
      )}

      {showAR && <PlantAR modelUrl={arModelUrl} onClose={() => setShowAR(false)} />}
    </>
  );
};

export default PlantIdentification;
