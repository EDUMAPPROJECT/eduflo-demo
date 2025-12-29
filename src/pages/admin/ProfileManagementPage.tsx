import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminBottomNavigation from "@/components/AdminBottomNavigation";
import Logo from "@/components/Logo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Building2, Image, FileText, Tags, X, Plus, Save } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Academy = Database["public"]["Tables"]["academies"]["Row"];

const ProfileManagementPage = () => {
  const [academy, setAcademy] = useState<Academy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  
  const { toast } = useToast();

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    getUser();
  }, []);

  useEffect(() => {
    const fetchAcademy = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("academies")
          .select("*")
          .eq("owner_id", user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setAcademy(data);
          setName(data.name);
          setDescription(data.description || "");
          setProfileImage(data.profile_image || "");
          setTags(data.tags || []);
        }
      } catch (error) {
        console.error("Error fetching academy:", error);
        toast({
          title: "오류",
          description: "학원 정보를 불러오는데 실패했습니다.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAcademy();
  }, [user, toast]);

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSave = async () => {
    if (!academy) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("academies")
        .update({
          name,
          description,
          profile_image: profileImage || null,
          tags,
          updated_at: new Date().toISOString(),
        })
        .eq("id", academy.id);

      if (error) throw error;

      toast({
        title: "저장 완료",
        description: "학원 프로필이 성공적으로 업데이트되었습니다.",
      });
    } catch (error) {
      console.error("Error saving academy:", error);
      toast({
        title: "오류",
        description: "저장에 실패했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!academy) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <header className="sticky top-0 bg-card/80 backdrop-blur-lg border-b border-border z-40">
          <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
            <Logo size="sm" />
          </div>
        </header>
        <main className="max-w-lg mx-auto px-4 py-6">
          <Card className="shadow-card border-border">
            <CardContent className="p-8 text-center">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">등록된 학원이 없습니다.</p>
              <p className="text-sm text-muted-foreground mt-1">
                먼저 학원을 등록해주세요.
              </p>
            </CardContent>
          </Card>
        </main>
        <AdminBottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 bg-card/80 backdrop-blur-lg border-b border-border z-40">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <Logo size="sm" />
          <span className="text-xs font-medium text-primary bg-secondary px-2 py-1 rounded-full">
            프로필 관리
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-6">
          <Building2 className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-lg text-foreground">에듀맵 프로필 관리</h2>
        </div>

        <div className="space-y-6">
          {/* Profile Image */}
          <Card className="shadow-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Image className="w-4 h-4 text-primary" />
                학원 대표 사진
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {profileImage && (
                  <div className="w-full h-40 rounded-xl overflow-hidden bg-muted">
                    <img
                      src={profileImage}
                      alt="학원 대표 사진"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <Input
                  placeholder="이미지 URL을 입력하세요"
                  value={profileImage}
                  onChange={(e) => setProfileImage(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  학원 외관 또는 내부 사진의 URL을 입력해주세요
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Academy Name */}
          <Card className="shadow-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                학원명
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="학원 이름"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </CardContent>
          </Card>

          {/* Description */}
          <Card className="shadow-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                학원 소개글
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="학원을 소개하는 글을 작성해주세요"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground mt-2">
                학부모님들이 보게 될 학원 소개 문구입니다
              </p>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card className="shadow-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Tags className="w-4 h-4 text-primary" />
                우리 학원 특징 (태그)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-3">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="gap-1 pr-1"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="태그 입력 (예: 1:1 맞춤 수업)"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleAddTag}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                학원의 강점이나 특징을 태그로 추가해주세요
              </p>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button
            className="w-full gap-2"
            size="lg"
            onClick={handleSave}
            disabled={saving}
          >
            <Save className="w-4 h-4" />
            {saving ? "저장 중..." : "변경사항 저장"}
          </Button>
        </div>
      </main>

      <AdminBottomNavigation />
    </div>
  );
};

export default ProfileManagementPage;
