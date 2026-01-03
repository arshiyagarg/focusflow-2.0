import React from "react";
import { useFocusStore } from "../../store/useFocusStore";
import { useStudyStore } from "../../store/useStudyTemp";
import { QuizRenderer } from "./QuizRenderer";
import { Button } from "@/components/ui/button";

export const AIBodyDouble = () => {
  const { state, companionMessage, score } = useFocusStore();
  const { 
    currentSession, 
    showQuiz, 
    setShowQuiz, 
    activeQuiz, 
    fetchQuiz 
  } = useStudyStore();

  // The companion only appears when a study session is active (preview or history)
  if (!currentSession) return null;

  /**
   * Triggers the Groq-powered quiz generation when focus is lost.
   * This bridges the behavioral signal to the AI intervention.
   */
  const handleHelpMeFocus = async () => {
    console.log("[AIBodyDouble] Help me focus triggered - Requesting Quiz");
    
    // We pass a context string to Groq to generate the re-engagement quiz
    // In a future update, you can pass the actual preview text here for more relevance
    await fetchQuiz("Please generate a quick 2-question focus re-engagement quiz for the current material.");
  };

  return (
    <div className={`fixed bottom-6 right-6 p-5 rounded-[2rem] border shadow-2xl z-50 transition-all duration-500 bg-white max-w-xs ${
      state === "LOST" ? "border-red-200 scale-105" : "border-[#E8E1D5]"
    }`}>
      <div className="space-y-4">
        {/* Status Header */}
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#5D4037]/50">Focus Buddy</span>
            <span className={`text-[8px] font-bold uppercase ${state === 'LOST' ? 'text-red-500' : 'text-sage-600'}`}>
              {state} Mode
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold bg-[#F8F5F0] px-2 py-0.5 rounded-full">{score}%</span>
        </div>

        {!showQuiz ? (
          <>
            <p className="text-sm font-medium leading-relaxed text-[#3E2A26]">
              {companionMessage}
            </p>
            
            {/* Only show the help button if the user is in 'LOST' state 
               and a quiz isn't already being processed or shown.
            */}
            {state === "LOST" && !activeQuiz && (
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full text-xs rounded-full border-[#4A6741] text-[#4A6741] hover:bg-[#4A6741] hover:text-white transition-all"
                onClick={handleHelpMeFocus}
              >
                Help me focus
              </Button>
            )}
          </>
        ) : (
          <div className="animate-in fade-in zoom-in-95 duration-300">
            <QuizRenderer />
          </div>
        )}
      </div>
    </div>
  );
};