import { Button } from "@/components/ui/button";
import { Camera, Upload, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useRef, useState } from "react";
import { toast } from "sonner";

interface PlantIdentificationActionsProps {
  onImageCapture: (file: Blob) => Promise<void>;
  isIdentifying: boolean;
}

const PlantIdentificationActions = ({
  onImageCapture,
  isIdentifying,
}: PlantIdentificationActionsProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Failed to access camera');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        canvas.toBlob(async (blob) => {
          if (blob) {
            await onImageCapture(blob);
            stopCamera();
          }
        }, 'image/jpeg');
      }
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        // Convert File to Blob
        const blob = new Blob([file], { type: file.type });
        await onImageCapture(blob);
        // Reset the input value to allow selecting the same file again
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        console.error('Error handling file:', error);
        toast.error('Failed to process image');
      }
    }
  };

  return (
    <div className="flex justify-center gap-4 mb-8">
      <Dialog>
        <DialogTrigger asChild>
          <Button
            onClick={() => {
              setShowCamera(true);
              startCamera();
            }}
            className="bg-natural-600 hover:bg-natural-700 text-white"
            disabled={isIdentifying}
          >
            <Camera className="mr-2" /> Capture Photo
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Capture Plant Photo</DialogTitle>
          </DialogHeader>
          {showCamera && (
            <div className="flex flex-col items-center gap-4">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full max-w-md rounded-lg"
              />
              <Button onClick={captureImage} disabled={isIdentifying}>
                Capture
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Button
        onClick={() => fileInputRef.current?.click()}
        className="bg-natural-600 hover:bg-natural-700 text-white"
        disabled={isIdentifying}
      >
        {isIdentifying ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Identifying...
          </>
        ) : (
          <>
            <Upload className="mr-2" /> Upload Photo
          </>
        )}
      </Button>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileSelect}
      />
    </div>
  );
};

export default PlantIdentificationActions;