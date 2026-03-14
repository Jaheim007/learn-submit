import { useState, useRef, useCallback } from 'react';
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Crop as CropIcon, X, RotateCcw } from 'lucide-react';

interface ImageCropperProps {
  label?: string;
  currentImageUrl?: string | null;
  onImageReady: (file: File | null) => void;
  aspectRatio?: number;
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 80 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight
  );
}

async function getCroppedImage(image: HTMLImageElement, crop: PixelCrop, fileName: string): Promise<File> {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width * scaleX;
  canvas.height = crop.height * scaleY;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(
    image,
    crop.x * scaleX, crop.y * scaleY,
    crop.width * scaleX, crop.height * scaleY,
    0, 0,
    canvas.width, canvas.height
  );
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(new File([blob!], fileName, { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.92);
  });
}

export default function ImageCropper({ label = 'Image de couverture', currentImageUrl, onImageReady, aspectRatio = 16 / 9 }: ImageCropperProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isCropping, setIsCropping] = useState(false);
  const [croppedPreview, setCroppedPreview] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCroppedPreview(null);
    setSelectedFile(file);
    setIsCropping(false);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    onImageReady(file); // default: full image
  };

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, aspectRatio));
  }, [aspectRatio]);

  const handleCropConfirm = async () => {
    if (!imgRef.current || !completedCrop) return;
    const cropped = await getCroppedImage(imgRef.current, completedCrop, selectedFile?.name || 'cropped.jpg');
    const url = URL.createObjectURL(cropped);
    setCroppedPreview(url);
    setIsCropping(false);
    onImageReady(cropped);
  };

  const handleReset = () => {
    setCroppedPreview(null);
    setPreviewUrl(null);
    setSelectedFile(null);
    setIsCropping(false);
    onImageReady(null);
  };

  const displayUrl = croppedPreview || previewUrl || currentImageUrl;

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      <Input type="file" accept="image/*" onChange={handleFileSelect} className="cursor-pointer" />

      {displayUrl && !isCropping && (
        <div className="relative group rounded-lg overflow-hidden border border-border bg-muted max-w-xs">
          <img src={displayUrl} alt="Preview" className="w-full h-auto object-cover max-h-48" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            {(previewUrl || croppedPreview) && (
              <Button type="button" size="sm" variant="secondary" onClick={() => setIsCropping(true)}>
                <CropIcon className="h-4 w-4 mr-1" /> Recadrer
              </Button>
            )}
            <Button type="button" size="sm" variant="destructive" onClick={handleReset}>
              <X className="h-4 w-4 mr-1" /> Retirer
            </Button>
          </div>
        </div>
      )}

      {isCropping && previewUrl && (
        <div className="space-y-3 p-3 border border-border rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground">Ajustez la zone de recadrage puis confirmez.</p>
          <ReactCrop crop={crop} onChange={setCrop} onComplete={setCompletedCrop} aspect={aspectRatio}>
            <img ref={imgRef} src={previewUrl} alt="Crop" onLoad={onImageLoad} className="max-h-64 w-auto" />
          </ReactCrop>
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={handleCropConfirm}>
              <CropIcon className="h-4 w-4 mr-1" /> Appliquer
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setIsCropping(false)}>
              <RotateCcw className="h-4 w-4 mr-1" /> Annuler
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
