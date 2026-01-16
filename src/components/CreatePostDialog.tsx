import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MultiImageUpload from "@/components/MultiImageUpload";
import { Bell, Calendar, PartyPopper, Loader2, Link2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Seminar {
  id: string;
  title: string;
  date: string;
  status: string;
}

interface FeedPost {
  id: string;
  type: string;
  title: string;
  body: string | null;
  image_url: string | null;
  seminar_id: string | null;
}

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  academyId: string;
  onSuccess: () => void;
  editingPost?: FeedPost | null;
}

const postTypes = [
  { value: 'notice', label: '공지', icon: Bell, description: '학원 공지사항' },
  { value: 'seminar', label: '설명회', icon: Calendar, description: '설명회 안내' },
  { value: 'event', label: '이벤트', icon: PartyPopper, description: '이벤트/프로모션' },
];

const CreatePostDialog = ({ open, onOpenChange, academyId, onSuccess, editingPost }: CreatePostDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<string>('notice');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [targetRegions, setTargetRegions] = useState<string[]>([]);
  const [seminars, setSeminars] = useState<Seminar[]>([]);
  const [selectedSeminarId, setSelectedSeminarId] = useState<string>('');

  // Reset form when dialog opens/closes or editingPost changes
  useEffect(() => {
    if (open) {
      if (editingPost) {
        setType(editingPost.type);
        setTitle(editingPost.title);
        setBody(editingPost.body || '');
        setSelectedSeminarId(editingPost.seminar_id || '');
        // Parse image URLs
        if (editingPost.image_url) {
          try {
            const parsed = JSON.parse(editingPost.image_url);
            setImageUrls(Array.isArray(parsed) ? parsed : [editingPost.image_url]);
          } catch {
            setImageUrls(editingPost.image_url ? [editingPost.image_url] : []);
          }
        } else {
          setImageUrls([]);
        }
      } else {
        setType('notice');
        setTitle('');
        setBody('');
        setImageUrls([]);
        setSelectedSeminarId('');
      }
    }
  }, [open, editingPost]);

  // Get academy's target regions and seminars
  useEffect(() => {
    const fetchData = async () => {
      // Fetch academy regions
      const { data: academyData } = await supabase
        .from("academies")
        .select("target_regions")
        .eq("id", academyId)
        .single();
      
      if (academyData?.target_regions) {
        setTargetRegions(academyData.target_regions);
      }

      // Fetch academy's seminars
      const { data: seminarData } = await supabase
        .from("seminars")
        .select("id, title, date, status")
        .eq("academy_id", academyId)
        .order("date", { ascending: false });
      
      if (seminarData) {
        setSeminars(seminarData);
      }
    };

    if (open && academyId) {
      fetchData();
    }
  }, [open, academyId]);

  // Reset seminar selection when type changes
  useEffect(() => {
    if (type === 'notice') {
      setSelectedSeminarId('');
    }
  }, [type]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({ title: "오류", description: "제목을 입력해주세요", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Build body with seminar link if selected
      let finalBody = body.trim();
      if (selectedSeminarId && (type === 'seminar' || type === 'event')) {
        const seminar = seminars.find(s => s.id === selectedSeminarId);
        if (seminar && !finalBody.includes('📌 연결된 설명회:')) {
          finalBody = finalBody 
            ? `${finalBody}\n\n📌 연결된 설명회: ${seminar.title}`
            : `📌 연결된 설명회: ${seminar.title}`;
        }
      }

      const postData = {
        type,
        title: title.trim(),
        body: finalBody || null,
        image_url: imageUrls.length > 0 ? JSON.stringify(imageUrls) : null,
        target_regions: targetRegions,
        seminar_id: selectedSeminarId || null,
        updated_at: new Date().toISOString(),
      };

      if (editingPost) {
        // Update existing post
        const { error } = await supabase
          .from("feed_posts")
          .update(postData)
          .eq("id", editingPost.id);

        if (error) throw error;
      } else {
        // Create new post
        const { error } = await supabase
          .from("feed_posts")
          .insert({
            academy_id: academyId,
            ...postData,
          });

        if (error) throw error;
      }

      // Reset form
      setType('notice');
      setTitle('');
      setBody('');
      setImageUrls([]);
      setSelectedSeminarId('');
      
      onSuccess();
    } catch (error) {
      console.error("Error saving post:", error);
      toast({ title: "오류", description: "소식 저장에 실패했습니다", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const formatSeminarDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isEditing = !!editingPost;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "소식 수정" : "새 소식 작성"}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>유형 *</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {postTypes.map((postType) => {
                  const Icon = postType.icon;
                  return (
                    <SelectItem key={postType.value} value={postType.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span>{postType.label}</span>
                        <span className="text-xs text-muted-foreground">
                          - {postType.description}
                        </span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Seminar Link - shown for seminar and event types */}
          {(type === 'seminar' || type === 'event') && seminars.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Link2 className="w-4 h-4" />
                설명회 연결 (선택)
              </Label>
              <Select 
                value={selectedSeminarId || "none"} 
                onValueChange={(val) => setSelectedSeminarId(val === "none" ? "" : val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="연결할 설명회를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">연결 안함</SelectItem>
                  {seminars.map((seminar) => (
                    <SelectItem key={seminar.id} value={seminar.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{seminar.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatSeminarDate(seminar.date)} · {seminar.status === 'recruiting' ? '모집중' : '마감'}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                연결된 설명회는 소식 본문에 링크로 표시됩니다
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>제목 *</Label>
            <Input
              placeholder="소식 제목을 입력하세요"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground text-right">
              {title.length}/100
            </p>
          </div>

          <div className="space-y-2">
            <Label>내용</Label>
            <Textarea
              placeholder="소식 내용을 입력하세요"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {body.length}/2000
            </p>
          </div>

          <div className="space-y-2">
            <Label>이미지 (선택, 최대 5장)</Label>
            <MultiImageUpload
              values={imageUrls}
              onChange={setImageUrls}
              folder="feed-posts"
              maxImages={5}
            />
          </div>

          <Button 
            className="w-full" 
            onClick={handleSubmit}
            disabled={loading || !title.trim()}
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {loading ? (isEditing ? "수정 중..." : "등록 중...") : (isEditing ? "소식 수정" : "소식 등록")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostDialog;