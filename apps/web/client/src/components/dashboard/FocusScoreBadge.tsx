import { useFocusStore } from "@/store/useFocusStore";
import { Zap, Target, TrendingUp } from "lucide-react";

export const FocusScoreBadge = () => {
  const { score, state } = useFocusStore();

  const getStyle = () => {
    if (state === "LOST") return "bg-red-100 text-red-700 border-red-200";
    if (state === "AT_RISK") return "bg-orange-100 text-orange-700 border-orange-200";
    return "bg-[#4A6741]/10 text-[#4A6741] border-[#4A6741]/20";
  };

  const getIcon = () => {
    if (score > 85) return <Zap className="w-3 h-3 fill-current" />;
    if (score > 50) return <Target className="w-3 h-3" />;
    return <TrendingUp className="w-3 h-3" />;
  };

  return (
    <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border transition-all duration-500 ${getStyle()}`}>
      {getIcon()}
      <span className="text-[10px] font-black uppercase tracking-[0.15em]">
        Focus: {score}%
      </span>
      <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse ml-1" />
    </div>
  );
};