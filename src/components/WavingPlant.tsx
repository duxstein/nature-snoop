import Spline from '@splinetool/react-spline';

const WavingPlant = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-10">
      <Spline 
        scene="https://prod.spline.design/6PYx-7qX9ZgKxzwN/scene.splinecode"
        className="w-full h-full"
      />
    </div>
  );
};

export default WavingPlant;