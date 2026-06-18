"use client";

import * as React from "react";
import Cropper from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

// Crop image helper returning permanent base64 data URL with rotation support
export async function getCroppedImg(imageSrc: string, pixelCrop: any, rotation = 0): Promise<string> {
  const image = new Image();
  image.src = imageSrc;
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
  });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  // Calculate rotated bounding box
  const rotRad = (rotation * Math.PI) / 180;
  const bBoxWidth = Math.abs(Math.cos(rotRad) * image.width) + Math.abs(Math.sin(rotRad) * image.height);
  const bBoxHeight = Math.abs(Math.sin(rotRad) * image.width) + Math.abs(Math.cos(rotRad) * image.height);

  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  // Translate and rotate context
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.drawImage(image, -image.width / 2, -image.height / 2);

  // Extract cropped area from the rotated canvas image
  const data = ctx.getImageData(pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height);
  
  // Set canvas to final crop size and put data back
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  ctx.putImageData(data, 0, 0);

  return canvas.toDataURL("image/jpeg", 0.7);
}

interface ImageCropperProps {
  initialImageSrc?: string | null;
  onCropSave?: (
    croppedUrl: string,
    cropDetails: { x: number; y: number; width: number; height: number; zoom: number; rotation: number }
  ) => void;
  onCancel?: () => void;
}

export default function ImageCropper({
  initialImageSrc = null,
  onCropSave,
  onCancel,
}: ImageCropperProps) {
  const [imageSrc, setImageSrc] = React.useState<string | null>(initialImageSrc);
  const [crop, setCrop] = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const [rotation, setRotation] = React.useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = React.useState<any>(null);

  React.useEffect(() => {
    if (initialImageSrc) {
      setImageSrc(initialImageSrc);
    }
  }, [initialImageSrc]);

  const onCropComplete = React.useCallback((_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.readAsDataURL(e.target.files[0]);
      reader.onload = () => {
        setImageSrc(reader.result as string);
      };
    }
  };

  const handleCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    try {
      const cropped = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      if (onCropSave && cropped) {
        onCropSave(cropped, {
          x: croppedAreaPixels.x,
          y: croppedAreaPixels.y,
          width: croppedAreaPixels.width,
          height: croppedAreaPixels.height,
          zoom,
          rotation
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Card className="p-3 w-full max-w-lg mx-auto bg-neutral-900 border border-neutral-800 text-white shadow-2xl rounded-2xl select-none">
      <CardHeader className="p-2 border-b border-neutral-850 pb-3 mb-3">
        <CardTitle className="text-lg font-bold font-playfair text-purple-400">Crop Profile Avatar</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 p-2">
        {!initialImageSrc && (
          <Input type="file" accept="image/*" onChange={handleFileChange} className="bg-neutral-950 border-neutral-800 text-neutral-350" />
        )}

        {imageSrc && (
          <div className="relative w-full h-[280px] bg-neutral-950 rounded-xl overflow-hidden border border-neutral-800">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onRotationChange={setRotation}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
        )}

        {imageSrc && (
          <div className="flex flex-col gap-3 mt-2">
            <div className="flex items-center gap-3">
              <span className="text-xs text-neutral-450 font-outfit min-w-[44px]">Zoom:</span>
              <Slider
                value={[zoom]}
                onValueChange={(v) => setZoom(v[0])}
                min={1}
                max={3}
                step={0.01}
                className="flex-1"
              />
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-neutral-450 font-outfit min-w-[44px]">Rotate:</span>
              <Slider
                value={[rotation]}
                onValueChange={(v) => setRotation(v[0])}
                min={0}
                max={360}
                step={1}
                className="flex-1"
              />
              <span className="text-xs text-neutral-400 font-outfit min-w-[32px] text-right">{rotation}°</span>
            </div>

            <div className="flex gap-3 mt-2">
              <Button onClick={handleCrop} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-outfit text-xs font-semibold py-2.5 rounded-xl cursor-pointer">
                Crop & Save
              </Button>
              {onCancel && (
                <Button variant="outline" onClick={onCancel} className="flex-1 border-neutral-800 bg-transparent text-neutral-450 hover:bg-neutral-850 hover:text-white font-outfit text-xs font-semibold py-2.5 rounded-xl cursor-pointer border border-solid">
                  Cancel
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
