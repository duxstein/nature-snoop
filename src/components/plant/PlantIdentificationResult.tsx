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
}

const PlantIdentificationResult = ({ result }: PlantIdentificationResultProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mt-8"
    >
      <Card>
        <CardHeader>
          <CardTitle>{result.common_name}</CardTitle>
          <CardDescription>{result.scientific_name}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Description</h3>
              <p>{result.description}</p>
            </div>
            <div>
              <h3 className="font-semibold">Care Instructions</h3>
              <p>{result.care_instructions}</p>
            </div>
            <div>
              <h3 className="font-semibold">Confidence Level</h3>
              <p className="capitalize">{result.confidence_level}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PlantIdentificationResult;