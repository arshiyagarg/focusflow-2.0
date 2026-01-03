import React, { useState } from "react";
import { useStudyStore } from "../../store/useStudyTemp";
import { useFocusStore } from "../../store/useFocusStore";
import { Button } from "@/components/ui/button";

export const QuizRenderer = () => {
  const { activeQuiz, setShowQuiz } = useStudyStore();
  const { increaseScore } = useFocusStore();
  
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  if (!activeQuiz || !activeQuiz.questions) {
    console.log("[Quiz Renderer] No quiz data available");
    return null;
  }

  const handleAnswer = (isCorrect: boolean) => {
    if (isCorrect) {
      console.log("[Quiz Renderer] Correct answer. Boosting focus score.");
      increaseScore(15);
    }

    if (currentIdx + 1 < activeQuiz.questions.length) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setIsFinished(true);
    }
  };

  if (isFinished) {
    return (
      <div className="p-4 text-center space-y-3">
        <p className="text-sm font-bold text-[#4A6741]">Focus Restored!</p>
        <Button size="sm" onClick={() => setShowQuiz(false)} className="w-full bg-[#4A6741]">
          Resume Study
        </Button>
      </div>
    );
  }

  const q = activeQuiz.questions[currentIdx];

  return (
    <div className="p-2 space-y-4">
      <div className="space-y-1">
        <p className="text-[10px] font-black uppercase text-muted-foreground">Quick Logic Check</p>
        <p className="text-sm font-bold leading-tight">{q.text}</p>
      </div>

      <div className="grid gap-2">
        {q.options.map((opt: any, i: number) => (
          <button
            key={i}
            onClick={() => handleAnswer(opt.isCorrect)}
            className="text-left p-3 text-xs border rounded-xl hover:bg-[#4A6741]/5 transition-colors"
          >
            {opt.text}
          </button>
        ))}
      </div>
    </div>
  );
};