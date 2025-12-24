import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowLeft, BookOpen, Target, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useAppStore } from "@/store/useAppStore";
import { useToast } from "@/hooks/use-toast";

const subjects = [
  "Mathematics", "Physics", "Chemistry", "Biology", 
  "History", "Literature", "Computer Science", "Languages",
  "Economics", "Psychology", "Art", "Music"
];

const dailyGoals = [
  { minutes: 15, label: "15 min", description: "Light study" },
  { minutes: 30, label: "30 min", description: "Regular" },
  { minutes: 60, label: "1 hour", description: "Focused" },
  { minutes: 120, label: "2 hours", description: "Intensive" },
];

const ProfileSetup = () => {
  const [step, setStep] = useState(1);
  const [studyGoal, setStudyGoal] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(30);
  
  const { updateProfile } = useAppStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;
  
  const toggleSubject = (subject: string) => {
    setSelectedSubjects(prev => 
      prev.includes(subject)
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
  };
  
  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      // Complete setup
      updateProfile({
        studyGoal,
        preferredSubjects: selectedSubjects,
        dailyGoalMinutes,
      });
      toast({ 
        title: "Profile complete!", 
        description: "Your study profile has been set up." 
      });
      navigate("/dashboard");
    }
  };
  
  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };
  
  const canProceed = () => {
    switch (step) {
      case 1: return studyGoal.trim().length > 0;
      case 2: return selectedSubjects.length > 0;
      case 3: return true;
      default: return false;
    }
  };
  
  return (
    <div className="min-h-screen gradient-soft flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-muted-foreground">Step {step} of {totalSteps}</p>
            <button 
              onClick={() => navigate("/dashboard")}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Skip for now
            </button>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        
        <div className="glass-card p-8 animate-fade-in">
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-sage-100 flex items-center justify-center">
                  <Target className="w-8 h-8 text-sage-600" />
                </div>
                <h2 className="font-serif text-2xl font-bold text-foreground mb-2">What's your study goal?</h2>
                <p className="text-muted-foreground">Tell us what you're working towards</p>
              </div>
              
              <Input
                placeholder="e.g., Pass my final exams, Learn a new skill..."
                value={studyGoal}
                onChange={(e) => setStudyGoal(e.target.value)}
                className="text-center"
              />
              
              <div className="grid grid-cols-2 gap-2">
                {["Pass exams", "Learn new skills", "Career growth", "Personal interest"].map((goal) => (
                  <button
                    key={goal}
                    onClick={() => setStudyGoal(goal)}
                    className={`p-3 rounded-lg text-sm font-medium transition-all ${
                      studyGoal === goal
                        ? 'bg-sage-100 text-sage-700 border border-sage-200'
                        : 'bg-muted text-muted-foreground hover:bg-sage-50'
                    }`}
                  >
                    {goal}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-teal-100 flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-teal-600" />
                </div>
                <h2 className="font-serif text-2xl font-bold text-foreground mb-2">What do you study?</h2>
                <p className="text-muted-foreground">Select your subjects of interest</p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {subjects.map((subject) => (
                  <button
                    key={subject}
                    onClick={() => toggleSubject(subject)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedSubjects.includes(subject)
                        ? 'gradient-sage text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-sage-50'
                    }`}
                  >
                    {selectedSubjects.includes(subject) && (
                      <CheckCircle className="w-3 h-3 inline mr-1" />
                    )}
                    {subject}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
                  <Clock className="w-8 h-8 text-accent" />
                </div>
                <h2 className="font-serif text-2xl font-bold text-foreground mb-2">Daily study goal</h2>
                <p className="text-muted-foreground">How much time can you commit each day?</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {dailyGoals.map((goal) => (
                  <button
                    key={goal.minutes}
                    onClick={() => setDailyGoalMinutes(goal.minutes)}
                    className={`p-4 rounded-xl text-center transition-all ${
                      dailyGoalMinutes === goal.minutes
                        ? 'gradient-sage text-primary-foreground shadow-elevated'
                        : 'bg-muted text-muted-foreground hover:bg-sage-50'
                    }`}
                  >
                    <p className="text-2xl font-bold mb-1">{goal.label}</p>
                    <p className="text-sm opacity-80">{goal.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <Button variant="outline" onClick={handleBack} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            <Button onClick={handleNext} disabled={!canProceed()} className="flex-1">
              {step === totalSteps ? "Complete Setup" : "Continue"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;
