import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, GripVertical, BookOpen, Save } from "lucide-react";
import { cn } from "@/lib/utils";

interface CurriculumStep {
  title: string;
  description: string;
}

interface CurriculumEditorProps {
  curriculum: CurriculumStep[];
  onChange: (curriculum: CurriculumStep[]) => void;
  onSave?: () => void;
  saving?: boolean;
}

const CurriculumEditor = ({ curriculum, onChange, onSave, saving }: CurriculumEditorProps) => {
  const addStep = () => {
    onChange([...curriculum, { title: "", description: "" }]);
  };

  const removeStep = (index: number) => {
    onChange(curriculum.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, field: keyof CurriculumStep, value: string) => {
    const updated = [...curriculum];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const moveStep = (from: number, to: number) => {
    if (to < 0 || to >= curriculum.length) return;
    const updated = [...curriculum];
    const [removed] = updated.splice(from, 1);
    updated.splice(to, 0, removed);
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium flex items-center gap-1">
          <BookOpen className="w-4 h-4" />
          커리큘럼 편집
        </Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addStep}
          className="gap-1"
        >
          <Plus className="w-4 h-4" />
          단계 추가
        </Button>
      </div>

      {curriculum.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center">
            <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-3">
              커리큘럼을 추가해보세요
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addStep}
              className="gap-1"
            >
              <Plus className="w-4 h-4" />
              첫 단계 추가
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {curriculum.map((step, index) => (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <div className="flex flex-col items-center gap-1 pt-2">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary-foreground">{index + 1}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        onClick={() => moveStep(index, index - 1)}
                        disabled={index === 0}
                        className={cn(
                          "p-0.5 rounded hover:bg-secondary transition-colors",
                          index === 0 && "opacity-30 cursor-not-allowed"
                        )}
                      >
                        <GripVertical className="w-3 h-3 text-muted-foreground rotate-180" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveStep(index, index + 1)}
                        disabled={index === curriculum.length - 1}
                        className={cn(
                          "p-0.5 rounded hover:bg-secondary transition-colors",
                          index === curriculum.length - 1 && "opacity-30 cursor-not-allowed"
                        )}
                      >
                        <GripVertical className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <Input
                      value={step.title}
                      onChange={(e) => updateStep(index, "title", e.target.value)}
                      placeholder="단계 제목 (예: 기초 개념 학습)"
                      className="text-sm"
                    />
                    <Input
                      value={step.description}
                      onChange={(e) => updateStep(index, "description", e.target.value)}
                      placeholder="상세 설명 (선택)"
                      className="text-sm"
                    />
                  </div>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    onClick={() => removeStep(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {onSave && (
        <Button 
          onClick={onSave} 
          disabled={saving}
          className="w-full gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? "저장 중..." : "커리큘럼 저장"}
        </Button>
      )}
    </div>
  );
};

export default CurriculumEditor;
