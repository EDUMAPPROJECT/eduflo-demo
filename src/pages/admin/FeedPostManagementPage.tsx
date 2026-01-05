import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AdminBottomNavigation from "@/components/AdminBottomNavigation";
import CreatePostDialog from "@/components/CreatePostDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Plus, 
  Bell, 
  Calendar, 
  PartyPopper, 
  Trash2, 
  Heart,
  Newspaper,
  ArrowLeft
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

interface FeedPost {
  id: string;
  type: string;
  title: string;
  body: string | null;
  image_url: string | null;
  like_count: number;
  created_at: string;
}

const typeConfig: Record<string, { label: string; icon: any; color: string }> = {
  notice: { label: '공지', icon: Bell, color: 'bg-blue-100 text-blue-700' },
  seminar: { label: '설명회', icon: Calendar, color: 'bg-green-100 text-green-700' },
  event: { label: '이벤트', icon: PartyPopper, color: 'bg-purple-100 text-purple-700' },
};

const FeedPostManagementPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [academyId, setAcademyId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);

  useEffect(() => {
    const fetchAcademyAndPosts = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate("/auth");
        return;
      }

      const { data: academy } = await supabase
        .from("academies")
        .select("id")
        .eq("owner_id", session.user.id)
        .maybeSingle();

      if (!academy) {
        toast({ title: "학원 등록 필요", description: "먼저 학원을 등록해주세요", variant: "destructive" });
        navigate("/academy/setup");
        return;
      }

      setAcademyId(academy.id);
      await fetchPosts(academy.id);
    };

    fetchAcademyAndPosts();
  }, [navigate, toast]);

  const fetchPosts = async (academyId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("feed_posts")
        .select("*")
        .eq("academy_id", academyId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast({ title: "오류", description: "소식을 불러오지 못했습니다", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async () => {
    if (!deletePostId) return;

    try {
      const { error } = await supabase
        .from("feed_posts")
        .delete()
        .eq("id", deletePostId);

      if (error) throw error;

      setPosts(prev => prev.filter(p => p.id !== deletePostId));
      toast({ title: "삭제 완료", description: "소식이 삭제되었습니다" });
    } catch (error) {
      console.error("Error deleting post:", error);
      toast({ title: "오류", description: "삭제에 실패했습니다", variant: "destructive" });
    } finally {
      setDeletePostId(null);
    }
  };

  const handlePostCreated = () => {
    setIsCreateDialogOpen(false);
    if (academyId) {
      fetchPosts(academyId);
    }
    toast({ title: "등록 완료", description: "소식이 등록되었습니다" });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 bg-card/80 backdrop-blur-lg border-b border-border z-40">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/home")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold text-foreground">내 소식 관리</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Add Button */}
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="w-full mb-6 gap-2"
        >
          <Plus className="w-4 h-4" />
          새 소식 작성
        </Button>

        {/* Posts List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-border">
                <CardContent className="p-4">
                  <Skeleton className="h-5 w-16 mb-2" />
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <Newspaper className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">등록된 소식이 없습니다</h3>
            <p className="text-sm text-muted-foreground mb-6">
              첫 번째 소식을 작성해보세요
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => {
              const config = typeConfig[post.type] || typeConfig.notice;
              const Icon = config.icon;

              return (
                <Card key={post.id} className="border-border overflow-hidden">
                  {post.image_url && (
                    <div className="h-32 overflow-hidden">
                      <img
                        src={post.image_url}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <Badge variant="secondary" className={config.color}>
                        <Icon className="w-3 h-3 mr-1" />
                        {config.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(post.created_at), {
                          addSuffix: true,
                          locale: ko,
                        })}
                      </span>
                    </div>

                    <h3 className="font-semibold text-foreground mb-1 line-clamp-1">
                      {post.title}
                    </h3>
                    
                    {post.body && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {post.body}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Heart className="w-4 h-4" />
                        <span className="text-sm">{post.like_count}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletePostId(post.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Create Dialog */}
      {academyId && (
        <CreatePostDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          academyId={academyId}
          onSuccess={handlePostCreated}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletePostId} onOpenChange={() => setDeletePostId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>소식 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 소식을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePost} className="bg-destructive text-destructive-foreground">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AdminBottomNavigation />
    </div>
  );
};

export default FeedPostManagementPage;
