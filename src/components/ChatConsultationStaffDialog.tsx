import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, User } from "lucide-react";

export interface ChatStaffItem {
  user_id: string;
  display_name: string;
  grade_label: string;
  bio: string;
  image_url: string | null;
}

interface ChatConsultationStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  academyId: string;
  onSelect: (staff: ChatStaffItem) => void;
  loading?: boolean;
}

export function ChatConsultationStaffDialog({
  open,
  onOpenChange,
  academyId,
  onSelect,
  loading: externalLoading = false,
}: ChatConsultationStaffDialogProps) {
  const [staffList, setStaffList] = useState<ChatStaffItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<ChatStaffItem | null>(null);

  useEffect(() => {
    if (!open || !academyId) {
      setStaffList([]);
      setSelected(null);
      return;
    }

    const fetchStaff = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc("get_academy_chat_staff", {
          p_academy_id: academyId,
        });
        if (error) {
          console.error("get_academy_chat_staff error:", error);
          setStaffList([]);
          return;
        }
        const list = (data ?? []).map((row: Record<string, unknown>) => ({
          user_id: row.user_id as string,
          display_name: (row.display_name as string) || "이름 없음",
          grade_label: (row.grade_label as string) || "관리자",
          bio: (row.bio as string) || "",
          image_url: (row.image_url as string) || null,
        }));

        // 원장 > 부원장 > 강사 > 그 외 순으로 정렬
        const gradeOrder: Record<string, number> = {
          "원장": 0,
          "부원장": 1,
          "강사": 2,
        };
        const sortedList = list.sort((a, b) => {
          const aRank = gradeOrder[a.grade_label] ?? 3;
          const bRank = gradeOrder[b.grade_label] ?? 3;
          return aRank - bRank;
        });

        setStaffList(sortedList);
        setSelected(sortedList.length > 0 ? sortedList[0] : null);
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, [open, academyId]);

  const handleConfirm = () => {
    if (selected) {
      onSelect(selected);
      // Parent closes dialog after room is created (or on error)
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">채팅 상담</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            채팅 상담을 진행하고 싶은 상대를 선택해주세요.
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 space-y-2 pr-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : staffList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              채팅 상담 가능한 직원이 없습니다.
            </div>
          ) : (
            staffList.map((staff) => (
              <button
                key={staff.user_id}
                type="button"
                onClick={() => setSelected(staff)}
                className={cn(
                  "w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-colors",
                  selected?.user_id === staff.user_id
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:bg-muted/50"
                )}
              >
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                  {staff.image_url ? (
                    <img
                      src={staff.image_url}
                      alt={staff.display_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-foreground">
                      {staff.display_name}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                      {staff.grade_label}
                    </span>
                  </div>
                  {staff.bio && (
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                      {staff.bio}
                    </p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        <Button
          className="w-full mt-4 bg-primary hover:bg-primary/90"
          onClick={handleConfirm}
          disabled={!selected || loading || externalLoading}
        >
          {externalLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              연결 중...
            </>
          ) : (
            "선택하기"
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}