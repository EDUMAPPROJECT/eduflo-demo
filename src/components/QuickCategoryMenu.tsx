import { useNavigate } from "react-router-dom";
import { Calculator, BookOpen, Globe, FlaskConical, Music, Palette, Dumbbell, MoreHorizontal } from "lucide-react";

const categories = [
  { name: "수학", icon: Calculator, color: "bg-blue-100 text-blue-600" },
  { name: "영어", icon: Globe, color: "bg-green-100 text-green-600" },
  { name: "국어", icon: BookOpen, color: "bg-orange-100 text-orange-600" },
  { name: "과학", icon: FlaskConical, color: "bg-purple-100 text-purple-600" },
  { name: "음악", icon: Music, color: "bg-pink-100 text-pink-600" },
  { name: "미술", icon: Palette, color: "bg-yellow-100 text-yellow-600" },
  { name: "체육", icon: Dumbbell, color: "bg-red-100 text-red-600" },
  { name: "전체", icon: MoreHorizontal, color: "bg-gray-100 text-gray-600" },
];

const QuickCategoryMenu = () => {
  const navigate = useNavigate();

  return (
    <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
      {categories.map((category) => {
        const Icon = category.icon;
        return (
          <button
            key={category.name}
            onClick={() =>
              category.name === "전체"
                ? navigate("/explore")
                : navigate(`/explore?subject=${category.name}`)
            }
            className="flex flex-col items-center gap-1.5 min-w-[56px] shrink-0"
          >
            <div
              className={`w-12 h-12 rounded-2xl ${category.color} flex items-center justify-center transition-transform hover:scale-105 active:scale-95`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-foreground">{category.name}</span>
          </button>
        );
      })}
    </div>
  );
};

export default QuickCategoryMenu;
