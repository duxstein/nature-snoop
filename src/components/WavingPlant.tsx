import Spline from '@splinetool/react-spline';
import { useState } from 'react';

const WavingPlant = () => {
  const [loadError, setLoadError] = useState(false);

  // Fallback SVG in case Spline fails to load
  if (loadError) {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-10">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full animate-[wave_3s_ease-in-out_infinite]"
        >
          <path
            d="M50 90 C30 90, 30 70, 30 50 C30 30, 40 20, 50 10 C60 20, 70 30, 70 50 C70 70, 70 90, 50 90"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-natural-600"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-10">
      <Spline 
        scene="https://prod.spline.design/oo6IxFu8UDjBUZut/scene.splinecode"
        className="w-full h-full"
        onError={() => setLoadError(true)}
      />
    </div>
  );
};

export default WavingPlant;