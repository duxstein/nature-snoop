
import { checkPasswordStrength } from "@/utils/validation";

interface PasswordStrengthMeterProps {
  password: string;
}

const PasswordStrengthMeter = ({ password }: PasswordStrengthMeterProps) => {
  const { score, feedback } = checkPasswordStrength(password);
  
  // Only show the meter if the user has started typing a password
  if (!password) return null;

  // Color mapping for strength levels
  const colorMap = [
    "bg-red-500", // Very weak
    "bg-orange-500", // Weak
    "bg-yellow-500", // Fair
    "bg-blue-500", // Good
    "bg-green-500", // Strong
  ];

  // Calculate width percentage based on score
  const widthPercentage = ((score + 1) / 5) * 100;
  
  return (
    <div className="mt-2 mb-4">
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${colorMap[score]}`} 
          style={{ width: `${widthPercentage}%` }}
        ></div>
      </div>
      <p className="text-xs mt-1 text-gray-600">
        Password strength: <span className="font-medium">{feedback}</span>
      </p>
    </div>
  );
};

export default PasswordStrengthMeter;
