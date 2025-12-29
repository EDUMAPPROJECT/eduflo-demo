import { MapPin } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

const Logo = ({ size = "md", showText = true }: LogoProps) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-20 h-20",
  };

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={cn(
          "gradient-primary rounded-2xl flex items-center justify-center shadow-soft",
          sizeClasses[size]
        )}
      >
        <MapPin className={cn(
          "text-primary-foreground",
          size === "sm" ? "w-4 h-4" : size === "md" ? "w-6 h-6" : "w-10 h-10"
        )} />
      </div>
      {showText && (
        <div className={cn("font-bold text-foreground", textSizeClasses[size])}>
          <span className="text-primary">에듀</span>
          <span className="text-accent">맵</span>
        </div>
      )}
    </div>
  );
};

// Helper function for className merging
const cn = (...classes: (string | undefined | false)[]) => 
  classes.filter(Boolean).join(" ");

export default Logo;
