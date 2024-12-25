import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

interface PlantIdentificationResultProps {
  result: {
    common_name: string;
    scientific_name: string;
    description: string;
    care_instructions: string;
    confidence_level: string;
  };
  imageUrl?: string;
}

const PlantIdentificationResult = ({ result, imageUrl }: PlantIdentificationResultProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mt-8"
    >
      <Card className="overflow-hidden bg-white/80 backdrop-blur-sm border-natural-200">
        <CardHeader className="bg-gradient-to-r from-natural-50 to-natural-100">
          <CardTitle className="text-natural-800">{result.common_name}</CardTitle>
          <CardDescription className="text-natural-600 italic">{result.scientific_name}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {imageUrl && (
              <div className="rounded-lg overflow-hidden shadow-lg">
                <img 
                  src={imageUrl} 
                  alt={result.common_name}
                  className="w-full h-64 object-cover"
                />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-natural-800 mb-2">Description</h3>
              <p className="text-natural-600">{result.description}</p>
            </div>
            <div>
              <h3 className="font-semibold text-natural-800 mb-2">Care Instructions</h3>
              <p className="text-natural-600">{result.care_instructions}</p>
            </div>
            <div>
              <h3 className="font-semibold text-natural-800 mb-2">Confidence Level</h3>
              <p className="text-natural-600 capitalize">{result.confidence_level}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PlantIdentificationResult;