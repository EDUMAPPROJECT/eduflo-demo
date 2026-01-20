import { useNavigate } from "react-router-dom";
import { Calendar, Bell, Clock, PartyPopper } from "lucide-react";

interface QuickActionMenuProps {
  isStudent?: boolean;
}

const QuickActionMenu = ({ isStudent = false }: QuickActionMenuProps) => {
  const navigate = useNavigate();

  const prefix = isStudent ? "/s" : "/p";
  
  const actions = [
    { name: "내 예약", icon: Calendar, path: `${prefix}/my/reservations` },
    { name: "공지사항", icon: Bell, path: `${prefix}/customer-service` },
    { name: "시간표", icon: Clock, path: `${prefix}/timetable` },
    { name: "이벤트", icon: PartyPopper, path: `${prefix}/events` },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.name}
            onClick={() => navigate(action.path)}
            className="flex flex-col items-center gap-2 p-3"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center transition-transform hover:scale-105 active:scale-95">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xs font-medium text-foreground">{action.name}</span>
          </button>
        );
      })}
    </div>
  );
};

export default QuickActionMenu;
