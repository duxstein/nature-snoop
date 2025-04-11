
interface XRHitTestSource {
  cancel(): void;
}

interface XRHitTestResult {
  getPose(baseSpace: XRSpace): XRPose | null;
}

interface XRFrame {
  getHitTestResults(hitTestSource: XRHitTestSource): XRHitTestResult[];
  getSession(): XRSession;
}

// Add Navigator XR extensions
interface Navigator {
  xr?: XRSystem;
}

interface XRSystem {
  isSessionSupported(mode: string): Promise<boolean>;
  requestSession(mode: string, options?: XRSessionInit): Promise<XRSession>;
}

interface XRSessionInit {
  requiredFeatures?: string[];
  optionalFeatures?: string[];
  domOverlay?: { root: HTMLElement };
}

interface XRSession {
  requestReferenceSpace(type: string): Promise<XRReferenceSpace>;
  requestHitTestSource(options: { space: XRReferenceSpace }): Promise<XRHitTestSource>;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
  end(): Promise<void>;
}

interface XRReferenceSpace extends XRSpace {
  getOffsetReferenceSpace(offsetTransform: XRRigidTransform): XRReferenceSpace;
}

interface XRSpace {}

interface XRPose {
  transform: {
    matrix: Float32Array;
    position: { x: number, y: number, z: number };
    orientation: { x: number, y: number, z: number, w: number };
  };
}

interface XRRigidTransform {
  matrix: Float32Array;
  position: { x: number, y: number, z: number };
  orientation: { x: number, y: number, z: number, w: number };
}

interface WebGLRenderingContext {
  makeXRCompatible(): Promise<void>;
}
