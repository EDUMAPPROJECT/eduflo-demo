import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

interface MultiImageUploadProps {
  values: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
  maxImages?: number;
  className?: string;
}

const MultiImageUpload = ({ 
  values, 
  onChange, 
  folder = "general", 
  maxImages = 5,
  className 
}: MultiImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(async (files: FileList) => {
    const validFiles = Array.from(files).filter(file => {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name}: 이미지 파일만 업로드 가능합니다`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name}: 파일 크기는 5MB 이하여야 합니다`);
        return false;
      }
      return true;
    });

    const remainingSlots = maxImages - values.length;
    if (validFiles.length > remainingSlots) {
      toast.error(`최대 ${maxImages}개까지 업로드 가능합니다`);
      validFiles.splice(remainingSlots);
    }

    if (validFiles.length === 0) return;

    setUploading(true);
    const newUrls: string[] = [];

    try {
      for (const file of validFiles) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("academy-assets")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from("academy-assets")
          .getPublicUrl(fileName);

        newUrls.push(data.publicUrl);
      }

      onChange([...values, ...newUrls]);
      toast.success(`${newUrls.length}개의 이미지가 업로드되었습니다`);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "업로드에 실패했습니다");
    } finally {
      setUploading(false);
    }
  }, [folder, onChange, values, maxImages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) handleUpload(files);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) handleUpload(files);
  }, [handleUpload]);

  const handleRemove = (index: number) => {
    const newValues = [...values];
    newValues.splice(index, 1);
    onChange(newValues);
  };

  const canAddMore = values.length < maxImages;

  return (
    <div className={className}>
      {/* Image Grid */}
      {values.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          {values.map((url, index) => (
            <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
              <img src={url} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6"
                onClick={() => handleRemove(index)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
          
          {/* Add More Button */}
          {canAddMore && !uploading && (
            <button
              type="button"
              className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary/50 bg-muted/30 flex flex-col items-center justify-center gap-1 transition-colors"
              onClick={() => inputRef.current?.click()}
            >
              <Plus className="w-5 h-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">추가</span>
            </button>
          )}
        </div>
      )}

      {/* Upload Area (shown when no images) */}
      {values.length === 0 && (
        <div
          className={`relative w-full h-32 rounded-xl border-2 border-dashed transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 ${
            dragActive
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 bg-muted/30"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <>
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <span className="text-sm text-muted-foreground">업로드 중...</span>
            </>
          ) : (
            <>
              <div className="p-3 rounded-full bg-primary/10">
                <Upload className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">
                클릭하거나 이미지를 드래그하세요
              </span>
              <span className="text-xs text-muted-foreground">
                최대 {maxImages}장, 각 5MB 이하
              </span>
            </>
          )}
        </div>
      )}

      {/* Uploading indicator when images exist */}
      {uploading && values.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          업로드 중...
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
        disabled={uploading}
      />
    </div>
  );
};

export default MultiImageUpload;
