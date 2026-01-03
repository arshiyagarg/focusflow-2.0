import { useFocusStore } from "@/store/useFocusStore";

export const FocusProgressFeedback = () => {
  const { score } = useFocusStore();
  
  // Gamification logic: Convert score to rank
  const getRank = (s: number) => {
    if (s > 90) return { title: "Zen Master", color: "text-emerald-600" };
    if (s > 70) return { title: "Flow State", color: "text-blue-600" };
    if (s > 40) return { title: "Seeking Focus", color: "text-orange-600" };
    return { title: "Cognitive Reboot Needed", color: "text-red-600" };
  };

  const rank = getRank(score);

  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-white/50 rounded-full border border-border/50">
      <div className={`w-2 h-2 rounded-full animate-pulse ${rank.color.replace('text', 'bg')}`} />
      <span className={`text-[10px] font-black uppercase tracking-tighter ${rank.color}`}>
        {rank.title}
      </span>
    </div>
  );
};