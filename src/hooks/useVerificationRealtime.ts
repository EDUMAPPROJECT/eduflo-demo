import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VerificationRealtimeOptions {
  userId?: string;
  onStatusChange?: (status: 'pending' | 'approved' | 'rejected', rejectionReason?: string) => void;
}

export const useVerificationRealtime = ({ userId, onStatusChange }: VerificationRealtimeOptions) => {
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`verification-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'business_verifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newStatus = payload.new.status as 'pending' | 'approved' | 'rejected';
          const rejectionReason = payload.new.rejection_reason as string | undefined;
          
          if (newStatus === 'approved') {
            toast.success("🎉 사업자 인증이 승인되었습니다!", {
              description: "이제 학원 프로필을 등록할 수 있습니다.",
              duration: 10000,
            });
          } else if (newStatus === 'rejected') {
            toast.error("사업자 인증이 거절되었습니다", {
              description: rejectionReason || "자세한 내용은 인증 페이지를 확인해주세요.",
              duration: 10000,
            });
          }
          
          onStatusChange?.(newStatus, rejectionReason);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, onStatusChange]);
};
