
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Button } from '../ui/button';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';

interface PlantARProps {
  modelUrl?: string;
  onClose: () => void;
}

const PlantAR = ({ modelUrl, onClose }: PlantARProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isARSupported, setIsARSupported] = useState<boolean | null>(null);
  
  useEffect(() => {
    // Check if WebXR is supported
    if (navigator.xr) {
      navigator.xr.isSessionSupported('immersive-ar')
        .then(supported => {
          setIsARSupported(supported);
          if (!supported) {
            toast.error("AR not supported on this device");
          }
        })
        .catch(error => {
          console.error("Error checking AR support:", error);
          setIsARSupported(false);
          toast.error("Error checking AR support");
        });
    } else {
      setIsARSupported(false);
      toast.error("WebXR not supported in this browser");
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current || isARSupported === null) return;
    
    if (!isARSupported) return;
    
    // Set up scene
    const scene = new THREE.Scene();
    
    // Add a camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    // Create WebGL renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    
    // Add renderer to DOM
    containerRef.current.appendChild(renderer.domElement);
    
    // Create and add AR button to start AR session
    const arButton = ARButton.createButton(renderer, {
      requiredFeatures: ['hit-test'],
      optionalFeatures: ['dom-overlay'],
      domOverlay: { root: document.body }
    });
    arButton.style.position = 'absolute';
    arButton.style.bottom = '20px';
    arButton.style.left = '50%';
    arButton.style.transform = 'translateX(-50%)';
    arButton.style.padding = '12px 24px';
    arButton.style.border = 'none';
    arButton.style.borderRadius = '4px';
    arButton.style.backgroundColor = '#3B5C3E';
    arButton.style.color = 'white';
    arButton.style.fontWeight = 'bold';
    arButton.style.fontSize = '16px';
    arButton.innerHTML = 'Start AR Experience';
    containerRef.current.appendChild(arButton);
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 10, 0);
    scene.add(directionalLight);
    
    // Create a plant model
    const plantGroup = new THREE.Group();
    
    // Create pot
    const potGeometry = new THREE.CylinderGeometry(0.2, 0.15, 0.25, 32);
    const potMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x8B4513,
      roughness: 0.8,
      metalness: 0.2
    });
    const pot = new THREE.Mesh(potGeometry, potMaterial);
    pot.position.y = -0.125;
    plantGroup.add(pot);
    
    // Create soil
    const soilGeometry = new THREE.CylinderGeometry(0.18, 0.18, 0.05, 32);
    const soilMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x3A2A1A,
      roughness: 1,
      metalness: 0
    });
    const soil = new THREE.Mesh(soilGeometry, soilMaterial);
    soil.position.y = 0;
    plantGroup.add(soil);
    
    // Create stem
    const stemGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8);
    const stemMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x2E8B57,
      roughness: 0.7,
      metalness: 0.1
    });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = 0.25;
    plantGroup.add(stem);
    
    // Create leaves
    for (let i = 0; i < 5; i++) {
      const leafGeometry = new THREE.SphereGeometry(0.1, 16, 16);
      const leafMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x228B22,
        roughness: 0.8,
        metalness: 0
      });
      
      // Flatten the sphere to make it more leaf-like
      leafGeometry.scale(1, 0.3, 1);
      
      const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
      
      // Position leaves around the stem
      const angle = (i / 5) * Math.PI * 2;
      const radius = 0.15;
      leaf.position.x = Math.cos(angle) * radius;
      leaf.position.z = Math.sin(angle) * radius;
      leaf.position.y = 0.3 + (i * 0.08);
      
      // Rotate leaves to point outward
      leaf.rotation.x = Math.PI / 4;
      leaf.rotation.y = angle;
      
      plantGroup.add(leaf);
    }
    
    // Scale the entire plant group
    plantGroup.scale.set(0.5, 0.5, 0.5);
    
    // Hide the plant initially until placed
    plantGroup.visible = false;
    scene.add(plantGroup);
    
    // Create a reticle for hit testing
    const reticleGeometry = new THREE.RingGeometry(0.15, 0.2, 32);
    const reticleMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      opacity: 0.8,
      transparent: true
    });
    const reticle = new THREE.Mesh(reticleGeometry, reticleMaterial);
    // Rotate to be flat on the ground
    reticle.rotation.x = -Math.PI / 2;
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);
    
    let hitTestSource: XRHitTestSource | null = null;
    let hitTestSourceRequested = false;
    let plantPlaced = false;
    
    // XR session controller
    renderer.xr.addEventListener('sessionstart', () => {
      toast.success('AR session started');
    });
    
    renderer.xr.addEventListener('sessionend', () => {
      hitTestSourceRequested = false;
      hitTestSource = null;
      toast.info('AR session ended');
    });
    
    // Animation loop
    const clock = new THREE.Clock();
    
    function render(timestamp: number, frame: XRFrame | null) {
      if (frame) {
        // If AR session is active
        const referenceSpace = renderer.xr.getReferenceSpace();
        const session = renderer.xr.getSession();
        
        if (session && referenceSpace) {
          // Set up hit testing once
          if (!hitTestSourceRequested) {
            session.requestReferenceSpace('viewer').then((referenceSpace) => {
              session.requestHitTestSource({ space: referenceSpace })
                .then((source) => {
                  hitTestSource = source;
                });
            });
            
            session.addEventListener('select', () => {
              if (reticle.visible && !plantPlaced) {
                // Place the plant at the reticle position
                plantGroup.position.setFromMatrixPosition(reticle.matrix);
                plantGroup.visible = true;
                plantPlaced = true;
                
                // Make the reticle invisible after placing
                reticle.visible = false;
                
                toast.success('Plant placed in AR!');
              } else if (plantPlaced) {
                // If already placed, allow moving it
                plantPlaced = false;
                reticle.visible = true;
              }
            });
            
            hitTestSourceRequested = true;
          }
          
          // If hit test source exists and plant isn't placed yet, do hit testing
          if (hitTestSource && !plantPlaced) {
            const hitTestResults = frame.getHitTestResults(hitTestSource);
            
            if (hitTestResults.length > 0) {
              const hit = hitTestResults[0];
              const pose = hit.getPose(referenceSpace);
              
              if (pose) {
                reticle.visible = true;
                reticle.matrix.fromArray(pose.transform.matrix);
              }
            } else {
              reticle.visible = false;
            }
          }
        }
      }
      
      // Animate the plant if it's visible
      if (plantGroup.visible) {
        const delta = clock.getDelta();
        // Gentle swaying animation
        plantGroup.children.forEach((child, index) => {
          if (index > 2) { // Only animate leaves
            child.rotation.z = Math.sin(timestamp / 1000 + index) * 0.1;
          }
        });
      }
      
      renderer.render(scene, camera);
    }
    
    renderer.setAnimationLoop(render);
    
    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.setAnimationLoop(null);
      if (containerRef.current) {
        // Remove AR button and renderer
        if (containerRef.current.contains(arButton)) {
          containerRef.current.removeChild(arButton);
        }
        while (containerRef.current.firstChild) {
          containerRef.current.removeChild(containerRef.current.firstChild);
        }
      }
    };
  }, [isARSupported]);
  
  return (
    <div className="fixed inset-0 z-50 bg-black/30">
      <div ref={containerRef} className="w-full h-full">
        {isARSupported === false && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg max-w-md">
              <h2 className="text-xl font-bold mb-4">AR Not Supported</h2>
              <p className="mb-4">
                Your device or browser doesn't support AR functionality. 
                For the best experience, try using:
              </p>
              <ul className="list-disc pl-5 mb-4">
                <li>iOS 12+ on iPhone/iPad with Safari</li>
                <li>Android with ARCore support using Chrome</li>
                <li>A desktop browser with WebXR support</li>
              </ul>
              <Button onClick={onClose}>Close</Button>
            </div>
          </div>
        )}
        
        {isARSupported === null && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
              <p>Checking AR compatibility...</p>
            </div>
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
