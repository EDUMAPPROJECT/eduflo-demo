import { useNavigate } from "react-router-dom";
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

interface LoginRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 로그인 후 돌아올 경로 (예: /p/seminar/xxx) */
  redirectTo?: string;
}

const LoginRequiredDialog = ({ open, onOpenChange, redirectTo }: LoginRequiredDialogProps) => {
  const navigate = useNavigate();

  const goToAuth = () => {
    const path = redirectTo ? `/auth?redirect=${encodeURIComponent(redirectTo)}` : "/auth";
    navigate(path);
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>로그인 필요</AlertDialogTitle>
          <AlertDialogDescription>
            로그인이 필요한 서비스입니다. 로그인 페이지로 이동하시겠습니까?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction onClick={goToAuth}>
            확인
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default LoginRequiredDialog;
