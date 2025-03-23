
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Button } from '../ui/button';
import { X } from 'lucide-react';
import { toast } from 'sonner';

interface PlantARProps {
  modelUrl?: string;
  onClose: () => void;
}

declare global {
  interface Navigator {
    xr?: {
      isSessionSupported(mode: string): Promise<boolean>;
      requestSession(mode: string, options?: any): Promise<any>;
    };
  }
}

const PlantAR = ({ modelUrl, onClose }: PlantARProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isARSupported, setIsARSupported] = useState(true);
  const [showStartButton, setShowStartButton] = useState(true);

  useEffect(() => {
    // Check WebXR support
    if (!navigator.xr) {
      setIsARSupported(false);
      return;
    }

    navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
      setIsARSupported(supported);
      if (!supported) {
        toast.error('AR not supported on this device');
      }
    }).catch(() => {
      setIsARSupported(false);
      toast.error('Error checking AR support');
    });
  }, []);

  const startAR = () => {
    if (!containerRef.current) return;
    
    // Set up scene
    const scene = new THREE.Scene();
    scene.background = null; // Make background transparent
    
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    if (renderer.xr) {
      renderer.xr.enabled = true;
    }
    
    containerRef.current.appendChild(renderer.domElement);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 1, 0);
    scene.add(directionalLight);

    // Add a plant model
    const geometry = new THREE.CylinderGeometry(0.2, 0.2, 0.5, 32);
    const material = new THREE.MeshPhongMaterial({ 
      color: 0x00aa00,
      specular: 0x050505,
      shininess: 100 
    });
    const plant = new THREE.Mesh(geometry, material);
    
    // Add leaves
    const leafGeometry = new THREE.SphereGeometry(0.15, 32, 32);
    const leafMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x00ff00,
      specular: 0x050505,
      shininess: 100 
    });

    // Create multiple leaves
    for (let i = 0; i < 5; i++) {
      const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
      leaf.position.y = 0.3;
      leaf.position.x = Math.sin(i * Math.PI * 2 / 5) * 0.2;
      leaf.position.z = Math.cos(i * Math.PI * 2 / 5) * 0.2;
      plant.add(leaf);
    }

    plant.position.set(0, 0, -1);
    scene.add(plant);

    // Animation loop
    const clock = new THREE.Clock();
    function animate() {
      const delta = clock.getDelta();
      plant.rotation.y += delta * 0.5;
      renderer.render(scene, camera);
    }

    renderer.setAnimationLoop(animate);

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    setShowStartButton(false);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.setAnimationLoop(null);
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  };

  if (!isARSupported) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
        <div className="bg-white p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">AR Not Supported</h2>
          <p className="mb-4">Your device or browser doesn't support AR functionality.</p>
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50">
      <div ref={containerRef} className="w-full h-full">
        {showStartButton && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Button 
              onClick={startAR}
              className="bg-primary hover:bg-primary/90 text-white font-bold py-2 px-4 rounded"
            >
              Start AR Experience
            </Button>
          </div>
        )}
      </div>
      <Button
        variant="outline"
        size="icon"
        className="absolute top-4 right-4 z-50 bg-white"
        onClick={onClose}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default PlantAR;
