
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

interface CareInstructions {
  light?: string;
  water?: string;
  soil?: string;
  temperature?: string;
  humidity?: string;
  fertilizer?: string;
  propagation?: string;
}

interface HealthAnalysis {
  status: string;
  issues: string;
  treatment: string;
}

interface PlantIdentificationResultProps {
  result: {
    common_name: string;
    scientific_name: string;
    description: string;
    care_instructions: CareInstructions;
    health_analysis: HealthAnalysis;
    confidence_level: string;
  };
  imageUrl?: string;
}

const PlantIdentificationResult = ({ result, imageUrl }: PlantIdentificationResultProps) => {
  const renderCareInstructions = (instructions: CareInstructions) => {
    return Object.entries(instructions).map(([key, value]) => (
      <div key={key} className="mb-4">
        <h4 className="text-natural-700 capitalize font-medium mb-1">{key}</h4>
        <p className="text-natural-600">{value}</p>
      </div>
    ));
  };

  const renderTreatmentBullets = (treatment: string) => {
    // Split the treatment string by periods or line breaks
    const points = treatment
      .split(/[.\n]/)
      .map(point => point.trim())
      .filter(point => point.length > 0);

    return (
      <ul className="list-disc pl-5 space-y-1">
        {points.map((point, index) => (
          <li key={index} className="text-natural-600">{point}</li>
        ))}
      </ul>
    );
  };

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
              <h3 className="font-semibold text-natural-800 mb-2">Health Analysis</h3>
              <div className="bg-natural-50 p-4 rounded-lg border border-natural-200">
                <p className="text-natural-600 mb-2">
                  <span className="font-medium">Status: </span>
                  {result.health_analysis.status}
                </p>
                {result.health_analysis.issues && (
                  <p className="text-natural-600 mb-2">
                    <span className="font-medium">Issues: </span>
                    {result.health_analysis.issues}
                  </p>
                )}
                {result.health_analysis.treatment && (
                  <div className="text-natural-600">
                    <span className="font-medium">Treatment: </span>
                    {renderTreatmentBullets(result.health_analysis.treatment)}
                  </div>
                )}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-natural-800 mb-2">Care Instructions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderCareInstructions(result.care_instructions)}
              </div>
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
