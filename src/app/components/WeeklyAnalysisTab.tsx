import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, ComposedChart } from "recharts";
import { Calendar, Activity, Plus, MessageSquare, Send, Sparkles, Edit2, Save, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";

interface WeeklyAnalysisTabProps {
  accessToken: string;
  supabaseUrl: string;
  publicAnonKey: string;
}

export function WeeklyAnalysisTab({ accessToken, supabaseUrl, publicAnonKey }: WeeklyAnalysisTabProps) {
  const [weekData, setWeekData] = useState<any[]>([]);
  const [weeklyTrendData, setWeeklyTrendData] = useState<any[]>([]);
  const [fourWeeksTrendData, setFourWeeksTrendData] = useState<any[]>([]); // 최근 4주 데이터
  const [bodyCompositionTrend, setBodyCompositionTrend] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState("");
  
  // 인바디 state
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [measurementDate, setMeasurementDate] = useState(new Date().toISOString().split("T")[0]);
  const [weight, setWeight] = useState("");
  const [muscleMass, setMuscleMass] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [bodyFatPercent, setBodyFatPercent] = useState("");
  const [fourWeeksInbodyData, setFourWeeksInbodyData] = useState<any[]>([]);

  // 섹션 표시/숨김 상태
  const [showInbody, setShowInbody] = useState(true);
  const [showNutrition, setShowNutrition] = useState(true);
  const [showExercise, setShowExercise] = useState(true);
  const [showFeedback, setShowFeedback] = useState(true);

  // 피드백 state
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [feedbackText, setFeedbackText] = useState("");
  const [coachName, setCoachName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingFeedbackId, setEditingFeedbackId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  // 섭취량 조정 Dialog state
  const [showNutritionAdjustDialog, setShowNutritionAdjustDialog] = useState(false);
  const [generatedFeedbackData, setGeneratedFeedbackData] = useState<any>(null);

  useEffect(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    setSelectedWeek(startOfWeek.toISOString().split("T")[0]);
    
    loadMeasurements();
    loadFeedbacks();
  }, []);

  useEffect(() => {
    if (selectedWeek) {
      loadWeeklyData();
      load12WeeksTrend();
      load4WeeksTrend(); // 최근 4주 데이터 로드
    }
  }, [selectedWeek]);

  useEffect(() => {
    if (measurements.length > 0) {
      processBodyCompositionTrend();
      processFourWeeksInbody();
    }
  }, [measurements, selectedWeek]);

  const processFourWeeksInbody = () => {
    const currentWeekStart = new Date(selectedWeek);
    const fourWeeksAgo = new Date(currentWeekStart);
    fourWeeksAgo.setDate(currentWeekStart.getDate() - (3 * 7));
    
    const weeklyInbody = [];
    for (let weekIndex = 0; weekIndex < 4; weekIndex++) {
      const weekStart = new Date(fourWeeksAgo);
      weekStart.setDate(fourWeeksAgo.getDate() + (weekIndex * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      // 이 주에 해당하는 측정값들 찾기
      const weekMeasurements = measurements.filter(m => {
        const mDate = new Date(m.date);
        return mDate >= weekStart && mDate <= weekEnd;
      });
      
      if (weekMeasurements.length > 0) {
        const latestInWeek = weekMeasurements[weekMeasurements.length - 1];
        weeklyInbody.push({
          weekLabel: `${weekIndex + 1}주차`,
          weekRange: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
          weight: latestInWeek.weight,
          muscleMass: latestInWeek.muscleMass,
          bodyFat: latestInWeek.bodyFat,
        });
      } else {
        // 이전 측정값 찾기
        const previousMeasurements = measurements.filter(m => new Date(m.date) < weekStart);
        if (previousMeasurements.length > 0) {
          const latest = previousMeasurements[previousMeasurements.length - 1];
          weeklyInbody.push({
            weekLabel: `${weekIndex + 1}주차`,
            weekRange: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
            weight: latest.weight,
            muscleMass: latest.muscleMass,
            bodyFat: latest.bodyFat,
          });
        }
      }
    }
    
    setFourWeeksInbodyData(weeklyInbody);
  };

  const processBodyCompositionTrend = () => {
    const currentWeekStart = new Date(selectedWeek);
    const twelveWeeksAgo = new Date(currentWeekStart);
    twelveWeeksAgo.setDate(currentWeekStart.getDate() - (11 * 7));
    
    const weeklyBodyComp = [];
    for (let weekIndex = 0; weekIndex < 12; weekIndex++) {
      const weekStart = new Date(twelveWeeksAgo);
      weekStart.setDate(twelveWeeksAgo.getDate() + (weekIndex * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      // 이 주에 해당하는 측정값들 찾기
      const weekMeasurements = measurements.filter(m => {
        const mDate = new Date(m.date);
        return mDate >= weekStart && mDate <= weekEnd;
      });
      
      if (weekMeasurements.length > 0) {
        const latestInWeek = weekMeasurements[weekMeasurements.length - 1];
        weeklyBodyComp.push({
          weekLabel: `${weekIndex + 1}주차`,
          weekRange: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
          weight: latestInWeek.weight,
          muscleMass: latestInWeek.muscleMass,
          bodyFat: latestInWeek.bodyFat,
        });
      } else {
        // 이전 측정값 찾기
        const previousMeasurements = measurements.filter(m => new Date(m.date) < weekStart);
        if (previousMeasurements.length > 0) {
          const latest = previousMeasurements[previousMeasurements.length - 1];
          weeklyBodyComp.push({
            weekLabel: `${weekIndex + 1}주차`,
            weekRange: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
            weight: latest.weight,
            muscleMass: latest.muscleMass,
            bodyFat: latest.bodyFat,
          });
        }
      }
    }
    
    setBodyCompositionTrend(weeklyBodyComp);
  };

  const loadWeeklyData = async () => {
    setIsLoading(true);
    try {
      const startDate = new Date(selectedWeek);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);

      const response = await fetch(
        `${supabaseUrl}/functions/v1/make-server-2c29cd73/daily-logs?startDate=${startDate.toISOString().split("T")[0]}&endDate=${endDate.toISOString().split("T")[0]}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        const processedData = [];
        for (let i = 0; i < 7; i++) {
          const date = new Date(startDate);
          date.setDate(startDate.getDate() + i);
          const dateStr = date.toISOString().split("T")[0];
          
          const dayLog = data.logs?.find((log: any) => log.value.date === dateStr);
          
          if (dayLog) {
            const totalCalories = dayLog.value.foods?.reduce((sum: number, food: any) => sum + food.calories, 0) || 0;
            const totalProtein = dayLog.value.foods?.reduce((sum: number, food: any) => sum + food.protein, 0) || 0;
            const totalCarbs = dayLog.value.foods?.reduce((sum: number, food: any) => sum + food.carbs, 0) || 0;
            const totalFat = dayLog.value.foods?.reduce((sum: number, food: any) => sum + food.fat, 0) || 0;
            
            const totalSets = dayLog.value.exercises?.reduce((sum: number, ex: any) => sum + (ex.sets?.length || 0), 0) || 0;
            const totalVolume = dayLog.value.exercises?.reduce((sum: number, ex: any) => {
              return sum + (ex.sets?.reduce((setSum: number, set: any) => setSum + (set.weight * set.reps), 0) || 0);
            }, 0) || 0;
            const intensity = totalSets > 0 ? totalVolume / totalSets : 0;
            
            // RIR 계산
            const allRirValues: number[] = [];
            dayLog.value.exercises?.forEach((ex: any) => {
              ex.sets?.forEach((set: any) => {
                if (set.rir !== undefined && set.rir !== null) {
                  allRirValues.push(set.rir);
                }
              });
            });
            const avgRir = allRirValues.length > 0 ? allRirValues.reduce((sum, rir) => sum + rir, 0) / allRirValues.length : null;
            
            processedData.push({
              date: dateStr,
              day: ["일", "월", "화", "수", "목", "금", "토"][date.getDay()],
              calories: totalCalories,
              protein: totalProtein,
              carbs: totalCarbs,
              fat: totalFat,
              sets: totalSets,
              volume: totalVolume,
              intensity: intensity,
              workoutTime: dayLog.value.totalWorkoutTime || 0,
              avgRir: avgRir,
            });
          } else {
            processedData.push({
              date: dateStr,
              day: ["일", "월", "화", "수", "목", "금", "토"][date.getDay()],
              calories: 0,
              protein: 0,
              carbs: 0,
              fat: 0,
              sets: 0,
              volume: 0,
              intensity: 0,
              workoutTime: 0,
            });
          }
        }
        
        setWeekData(processedData);
      }
    } catch (error) {
      console.error("Error loading weekly data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const load12WeeksTrend = async () => {
    try {
      const currentWeekStart = new Date(selectedWeek);
      const firstWeekStart = new Date(currentWeekStart);
      firstWeekStart.setDate(currentWeekStart.getDate() - (11 * 7));
      const lastWeekEnd = new Date(currentWeekStart);
      lastWeekEnd.setDate(currentWeekStart.getDate() + 6);
      
      const response = await fetch(
        `${supabaseUrl}/functions/v1/make-server-2c29cd73/daily-logs?startDate=${firstWeekStart.toISOString().split("T")[0]}&endDate=${lastWeekEnd.toISOString().split("T")[0]}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        const weeklyData = [];
        for (let weekIndex = 0; weekIndex < 12; weekIndex++) {
          const weekStart = new Date(firstWeekStart);
          weekStart.setDate(firstWeekStart.getDate() + (weekIndex * 7));
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          
          let weekCalories = 0;
          let weekProtein = 0;
          let weekCarbs = 0;
          let weekFat = 0;
          let weekSets = 0;
          let weekVolume = 0;
          let weekIntensity = 0;
          let intensityCount = 0;
          
          for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + dayIndex);
            const dateStr = date.toISOString().split("T")[0];
            
            const dayLog = data.logs?.find((log: any) => log.value.date === dateStr);
            
            if (dayLog) {
              weekCalories += dayLog.value.foods?.reduce((sum: number, food: any) => sum + food.calories, 0) || 0;
              weekProtein += dayLog.value.foods?.reduce((sum: number, food: any) => sum + food.protein, 0) || 0;
              weekCarbs += dayLog.value.foods?.reduce((sum: number, food: any) => sum + food.carbs, 0) || 0;
              weekFat += dayLog.value.foods?.reduce((sum: number, food: any) => sum + food.fat, 0) || 0;
              
              const daySets = dayLog.value.exercises?.reduce((sum: number, ex: any) => sum + (ex.sets?.length || 0), 0) || 0;
              const dayVolume = dayLog.value.exercises?.reduce((sum: number, ex: any) => {
                return sum + (ex.sets?.reduce((setSum: number, set: any) => setSum + (set.weight * set.reps), 0) || 0);
              }, 0) || 0;
              
              weekSets += daySets;
              weekVolume += dayVolume;
              
              if (daySets > 0) {
                weekIntensity += dayVolume / daySets;
                intensityCount++;
              }
            }
          }
          
          weeklyData.push({
            weekLabel: `${weekIndex + 1}주차`,
            weekRange: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
            totalCalories: weekCalories,
            avgCalories: weekCalories / 7,
            totalProtein: weekProtein,
            avgProtein: weekProtein / 7,
            totalCarbs: weekCarbs,
            avgCarbs: weekCarbs / 7,
            totalFat: weekFat,
            avgFat: weekFat / 7,
            totalSets: weekSets,
            avgSets: weekSets / 7,
            totalVolume: weekVolume,
            avgVolume: weekVolume / 7,
            avgIntensity: intensityCount > 0 ? weekIntensity / intensityCount : 0,
          });
        }
        
        setWeeklyTrendData(weeklyData);
      }
    } catch (error) {
      console.error("Error loading 12 weeks trend:", error);
    }
  };

  const load4WeeksTrend = async () => {
    try {
      const currentWeekStart = new Date(selectedWeek);
      const firstWeekStart = new Date(currentWeekStart);
      firstWeekStart.setDate(currentWeekStart.getDate() - (3 * 7));
      const lastWeekEnd = new Date(currentWeekStart);
      lastWeekEnd.setDate(currentWeekStart.getDate() + 6);
      
      const response = await fetch(
        `${supabaseUrl}/functions/v1/make-server-2c29cd73/daily-logs?startDate=${firstWeekStart.toISOString().split("T")[0]}&endDate=${lastWeekEnd.toISOString().split("T")[0]}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        const weeklyData = [];
        for (let weekIndex = 0; weekIndex < 4; weekIndex++) {
          const weekStart = new Date(firstWeekStart);
          weekStart.setDate(firstWeekStart.getDate() + (weekIndex * 7));
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          
          let weekCalories = 0;
          let weekProtein = 0;
          let weekCarbs = 0;
          let weekFat = 0;
          let weekSets = 0;
          let weekVolume = 0;
          let weekIntensity = 0;
          let intensityCount = 0;
          const weekRirValues: number[] = [];
          
          for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + dayIndex);
            const dateStr = date.toISOString().split("T")[0];
            
            const dayLog = data.logs?.find((log: any) => log.value.date === dateStr);
            
            if (dayLog) {
              weekCalories += dayLog.value.foods?.reduce((sum: number, food: any) => sum + food.calories, 0) || 0;
              weekProtein += dayLog.value.foods?.reduce((sum: number, food: any) => sum + food.protein, 0) || 0;
              weekCarbs += dayLog.value.foods?.reduce((sum: number, food: any) => sum + food.carbs, 0) || 0;
              weekFat += dayLog.value.foods?.reduce((sum: number, food: any) => sum + food.fat, 0) || 0;
              
              const daySets = dayLog.value.exercises?.reduce((sum: number, ex: any) => sum + (ex.sets?.length || 0), 0) || 0;
              const dayVolume = dayLog.value.exercises?.reduce((sum: number, ex: any) => {
                return sum + (ex.sets?.reduce((setSum: number, set: any) => setSum + (set.weight * set.reps), 0) || 0);
              }, 0) || 0;
              
              weekSets += daySets;
              weekVolume += dayVolume;
              
              if (daySets > 0) {
                weekIntensity += dayVolume / daySets;
                intensityCount++;
              }
              
              // RIR 수집
              dayLog.value.exercises?.forEach((ex: any) => {
                ex.sets?.forEach((set: any) => {
                  if (set.rir !== undefined && set.rir !== null) {
                    weekRirValues.push(set.rir);
                  }
                });
              });
            }
          }
          
          const avgWeekRir = weekRirValues.length > 0 ? weekRirValues.reduce((sum, rir) => sum + rir, 0) / weekRirValues.length : null;
          
          weeklyData.push({
            weekLabel: `${weekIndex + 1}주차`,
            weekRange: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
            totalCalories: weekCalories,
            avgCalories: weekCalories / 7,
            totalProtein: weekProtein,
            avgProtein: weekProtein / 7,
            totalCarbs: weekCarbs,
            avgCarbs: weekCarbs / 7,
            totalFat: weekFat,
            avgFat: weekFat / 7,
            totalSets: weekSets,
            avgSets: weekSets / 7,
            totalVolume: weekVolume,
            avgVolume: weekVolume / 7,
            avgIntensity: intensityCount > 0 ? weekIntensity / intensityCount : 0,
            avgRir: avgWeekRir,
          });
        }
        
        setFourWeeksTrendData(weeklyData);
      }
    } catch (error) {
      console.error("Error loading 4 weeks trend:", error);
    }
  };

  const loadMeasurements = async () => {
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/make-server-2c29cd73/inbody`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.measurements) {
          const sorted = data.measurements
            .map((m: any) => m.value)
            .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
          setMeasurements(sorted);
        }
      }
    } catch (error) {
      console.error("Error loading measurements:", error);
    }
  };

  const loadFeedbacks = async () => {
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/make-server-2c29cd73/feedback`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.feedbacks) {
          const sorted = data.feedbacks
            .map((f: any) => f.value)
            .sort((a: any, b: any) => new Date(a.weekId).getTime() - new Date(b.weekId).getTime());
          setFeedbacks(sorted);
        }
      }
    } catch (error) {
      console.error("Error loading feedbacks:", error);
    }
  };

  const handleSaveInBody = async () => {
    if (!weight || !muscleMass || !bodyFat) {
      toast.error("모든 항목을 입력해주세요.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/make-server-2c29cd73/inbody`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          date: measurementDate,
          weight: parseFloat(weight),
          muscleMass: parseFloat(muscleMass),
          bodyFat: parseFloat(bodyFat),
        }),
      });

      if (response.ok) {
        toast.success("인바디 측정 기록이 저장되었습니다!");
        setWeight("");
        setMuscleMass("");
        setBodyFat("");
        setBodyFatPercent("");
        setMeasurementDate(new Date().toISOString().split("T")[0]);
        loadMeasurements();
        
        // Auto-generate feedback after saving InBody
        await generateAutoFeedback();
      } else {
        toast.error("기록 저장에 실패했습니다.");
      }
    } catch (error) {
      console.error("Error saving measurement:", error);
      toast.error("기록 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const generateAutoFeedback = async () => {
    try {
      // Get current week start date
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      const weekId = startOfWeek.toISOString().split("T")[0];

      const response = await fetch(`${supabaseUrl}/functions/v1/make-server-2c29cd73/generate-feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ weekId }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Save the auto-generated feedback
        const saveResponse = await fetch(`${supabaseUrl}/functions/v1/make-server-2c29cd73/feedback`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            weekId,
            feedback: data.feedback,
            coachName: "AI 코치",
          }),
        });

        if (saveResponse.ok) {
          toast.success("AI 피드백이 자동으로 생성되었습니다!");
          loadFeedbacks();
          
          // Store feedback data and show nutrition adjustment dialog
          setGeneratedFeedbackData(data);
          setShowNutritionAdjustDialog(true);
        }
      }
    } catch (error) {
      console.error("Error generating auto feedback:", error);
      // Don't show error toast for auto-feedback failure to avoid confusion
    }
  };

  const handleGenerateFeedback = async () => {
    if (!selectedWeek) {
      toast.error("주차를 선택해주세요.");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/make-server-2c29cd73/generate-feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          weekId: selectedWeek,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setFeedbackText(data.feedback);
        toast.success("AI 피드백이 생성되었습니다!");
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "피드백 생성에 실패��습니다.");
      }
    } catch (error) {
      console.error("Error generating feedback:", error);
      toast.error("피드백 생성 중 오류가 발생했습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveFeedback = async () => {
    if (!selectedWeek || !feedbackText) {
      toast.error("주차와 피드백 내용을 입력해주세요.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/make-server-2c29cd73/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          weekId: selectedWeek,
          feedback: feedbackText,
          coachName: coachName || "코치",
        }),
      });

      if (response.ok) {
        toast.success("피드백이 저장되었습니다!");
        setFeedbackText("");
        setCoachName("");
        loadFeedbacks();
      } else {
        toast.error("피드백 저장에 실패했습니다.");
      }
    } catch (error) {
      console.error("Error saving feedback:", error);
      toast.error("피드백 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditFeedback = (feedbackId: string, feedback: string) => {
    setEditingFeedbackId(feedbackId);
    setEditingText(feedback);
  };

  const handleUpdateFeedback = async () => {
    if (!editingFeedbackId || !editingText) {
      toast.error("피드백 내용을 입력해주세요.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/make-server-2c29cd73/feedback`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          feedbackId: editingFeedbackId,
          feedback: editingText,
        }),
      });

      if (response.ok) {
        toast.success("피드백이 업데이트되었습니다!");
        setEditingFeedbackId(null);
        setEditingText("");
        loadFeedbacks();
      } else {
        toast.error("피드백 업데이트에 실패했습니다.");
      }
    } catch (error) {
      console.error("Error updating feedback:", error);
      toast.error("피드백 업데이트 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyNutritionAdjustment = async () => {
    if (!generatedFeedbackData) return;

    try {
      // Apply nutrition adjustments based on AI recommendations
      // This will be handled by updating the user profile with new recommendations
      const adjustments = generatedFeedbackData.analysis?.adjustments;
      
      if (adjustments) {
        // Get current profile to apply adjustments
        const profileResponse = await fetch(`${supabaseUrl}/functions/v1/make-server-2c29cd73/profile`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          const currentProfile = profileData.profile;

          // Calculate adjusted values based on recommendations
          let updatedDailyCalories = currentProfile.dailyCalories;
          let updatedProtein = currentProfile.protein;
          let updatedCarbs = currentProfile.carbs;

          // Parse adjustment strings and apply
          if (adjustments.calorie.includes("+")) {
            const percentage = parseFloat(adjustments.calorie.match(/\d+/)?.[0] || "0");
            updatedDailyCalories = currentProfile.dailyCalories * (1 + percentage / 100);
          } else if (adjustments.calorie.includes("−") || adjustments.calorie.includes("-")) {
            const percentage = parseFloat(adjustments.calorie.match(/\d+/)?.[0] || "0");
            updatedDailyCalories = currentProfile.dailyCalories * (1 - percentage / 100);
          }

          if (adjustments.carb.includes("+")) {
            const percentage = parseFloat(adjustments.carb.match(/\d+/)?.[0] || "0");
            updatedCarbs = currentProfile.carbs * (1 + percentage / 100);
          } else if (adjustments.carb.includes("−") || adjustments.carb.includes("-")) {
            const percentage = parseFloat(adjustments.carb.match(/\d+/)?.[0] || "0");
            updatedCarbs = currentProfile.carbs * (1 - percentage / 100);
          }

          // Save updated nutrition values
          const updateResponse = await fetch(`${supabaseUrl}/functions/v1/make-server-2c29cd73/profile`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              ...currentProfile,
              dailyCalories: Math.round(updatedDailyCalories),
              protein: Math.round(updatedProtein),
              carbs: Math.round(updatedCarbs),
              lastAdjustedAt: new Date().toISOString(),
            }),
          });

          if (updateResponse.ok) {
            toast.success("AI 권장사항이 프로필에 반영되었습니다!");
            setShowNutritionAdjustDialog(false);
            setGeneratedFeedbackData(null);
          } else {
            toast.error("프로필 업데이트에 실패했습니다.");
          }
        }
      }
    } catch (error) {
      console.error("Error applying nutrition adjustment:", error);
      toast.error("조정 사항 적용 중 오류가 발생했습니다.");
    }
  };

  const latestMeasurement = measurements.length > 0 ? measurements[measurements.length - 1] : null;
  const firstMeasurement = measurements.length > 0 ? measurements[0] : null;

  const progress = latestMeasurement && firstMeasurement ? {
    weight: latestMeasurement.weight - firstMeasurement.weight,
    muscleMass: latestMeasurement.muscleMass - firstMeasurement.muscleMass,
    bodyFat: latestMeasurement.bodyFat - firstMeasurement.bodyFat,
  } : null;

  const weeklyTotals = weekData.reduce(
    (acc, day) => ({
      calories: acc.calories + day.calories,
      protein: acc.protein + day.protein,
      carbs: acc.carbs + day.carbs,
      fat: acc.fat + day.fat,
      sets: acc.sets + day.sets,
      volume: acc.volume + day.volume,
      workoutTime: acc.workoutTime + day.workoutTime,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, sets: 0, volume: 0, workoutTime: 0 }
  );

  const weeklyAverages = {
    calories: weeklyTotals.calories / 7,
    protein: weeklyTotals.protein / 7,
    carbs: weeklyTotals.carbs / 7,
    fat: weeklyTotals.fat / 7,
    sets: weeklyTotals.sets / 7,
    volume: weeklyTotals.volume / 7,
    workoutTime: weeklyTotals.workoutTime / 7,
  };

  // 운동 빈도 계산 (운동한 날의 수)
  const workoutDays = weekData.filter(day => day.sets > 0).length;
  const avgWorkoutFrequency = workoutDays / 7 * 100; // 퍼센트로 표시

  // 평균 운동 강도 계산
  const totalIntensity = weekData.reduce((sum, day) => sum + day.intensity, 0);
  const avgIntensity = weekData.filter(day => day.sets > 0).length > 0 
    ? totalIntensity / weekData.filter(day => day.sets > 0).length 
    : 0;

  // 총 운동 강도 계산
  const totalWorkoutIntensity = weekData.reduce((sum, day) => sum + (day.sets > 0 ? day.intensity : 0), 0);
  
  // 평균 RIR 계산
  const allWeekRirValues = weekData.filter(day => day.avgRir !== null && day.avgRir !== undefined).map(day => day.avgRir);
  const avgWeekRir = allWeekRirValues.length > 0 ? allWeekRirValues.reduce((sum, rir) => sum + rir, 0) / allWeekRirValues.length : null;

  console.log('WeekData:', weekData);
  console.log('AllWeekRirValues:', allWeekRirValues);
  console.log('AvgWeekRir:', avgWeekRir);
  console.log('FourWeeksTrendData:', fourWeeksTrendData);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">데이터 로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Nutrition Adjustment Dialog */}
      <Dialog open={showNutritionAdjustDialog} onOpenChange={setShowNutritionAdjustDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>AI 권장사항 적용</DialogTitle>
            <DialogDescription>
              프로필 탭의 '일일 권장 섭취량'에 수정 사항을 적용하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {generatedFeedbackData?.analysis?.adjustments && (
              <div className="space-y-2 text-sm">
                <p className="font-semibold">적용될 변경사항:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>칼로리: {generatedFeedbackData.analysis.adjustments.calorie}</li>
                  <li>단백질: {generatedFeedbackData.analysis.adjustments.protein}</li>
                  <li>탄수화물: {generatedFeedbackData.analysis.adjustments.carb}</li>
                </ul>
                <p className="text-xs text-gray-500 mt-3">
                  '예'를 클릭하면 AI 권장사항이 프로필에 반영됩니다.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowNutritionAdjustDialog(false);
                setGeneratedFeedbackData(null);
              }}
            >
              아니오
            </Button>
            <Button onClick={handleApplyNutritionAdjustment}>
              예
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 주간 선택 - 더 작고 컴팩트한 버전 */}
      <div className="flex items-center gap-2 p-2 bg-white rounded border">
        <Label htmlFor="week-select" className="text-xs font-medium whitespace-nowrap">주간 선택</Label>
        <Input
          id="week-select"
          type="date"
          value={selectedWeek}
          onChange={(e) => setSelectedWeek(e.target.value)}
          className="max-w-[150px] h-8 text-xs"
        />
        <span className="text-[10px] text-gray-500">시작일(월요일)</span>
      </div>

      {/* 피드백 섹션 - 맨 위에 추가 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-600" />
              <CardTitle>주간 피드백</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFeedback(!showFeedback)}
            >
              {showFeedback ? "숨기기" : "자세히 보기"}
            </Button>
          </div>
          <CardDescription>인바디와 운동 기록 기반 자동 생성된 피드백</CardDescription>
        </CardHeader>
        {showFeedback && (
          <CardContent className="space-y-4">
            {/* AI 피드백 생성 */}
            <div className="space-y-4 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
              <div className="space-y-2">
                <Label htmlFor="feedback-week">피드백 주차 (주 시작일)</Label>
                <Input
                  id="feedback-week"
                  type="date"
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coach-name-input">코치 이름 (선택사항)</Label>
                <Input
                  id="coach-name-input"
                  placeholder="예: 김코치"
                  value={coachName}
                  onChange={(e) => setCoachName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="feedback-textarea">피드백 내용</Label>
                <Textarea
                  id="feedback-textarea"
                  placeholder="AI 피드백 생성 버튼을 누르거나 직접 작성하세요..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleGenerateFeedback} 
                  variant="outline" 
                  className="flex-1 bg-gradient-to-r from-purple-100 to-indigo-100 border-purple-300 hover:from-purple-200 hover:to-indigo-200" 
                  disabled={isGenerating}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {isGenerating ? "AI 생성 중..." : "AI 피드백 생성"}
                </Button>
                <Button onClick={handleSaveFeedback} className="flex-1" disabled={isSaving}>
                  <Send className="w-4 h-4 mr-2" />
                  {isSaving ? "저장 중..." : "피드백 저장"}
                </Button>
              </div>
            </div>

            {/* 저장된 피드백 목록 */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800">받은 피드백</h4>
              {feedbacks.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">아직 저장된 피드백이 없습니다.</p>
                  <p className="text-gray-400 text-xs mt-1">인바디 기록을 추가하면 AI 피드백이 자동으로 생성됩니다.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {feedbacks.map((fb: any) => (
                    <div key={fb.id} className="p-4 bg-white rounded-lg border shadow-sm">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{fb.coachName || "코치"}</p>
                          <p className="text-xs text-gray-500">주차: {fb.weekId}</p>
                        </div>
                        <div className="flex gap-1">
                          {editingFeedbackId === fb.id ? (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleUpdateFeedback}
                                disabled={isSaving}
                              >
                                <Save className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingFeedbackId(null);
                                  setEditingText("");
                                }}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditFeedback(fb.id, fb.feedback)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      {editingFeedbackId === fb.id ? (
                        <Textarea
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          rows={6}
                          className="font-mono text-xs"
                        />
                      ) : (
                        <p className="text-xs text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                          {fb.feedback}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        작성일: {new Date(fb.createdAt).toLocaleString("ko-KR")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* 인디 션 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-red-600" />
              <CardTitle>인바디 기록</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowInbody(!showInbody)}
            >
              {showInbody ? "숨기기" : "자세히 보기"}
            </Button>
          </div>
          <CardDescription>인바디 측정 결과를 입력하세요</CardDescription>
        </CardHeader>
        {showInbody && (
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2">
              <Label htmlFor="measurement-date">측정일</Label>
              <Input
                id="measurement-date"
                type="date"
                value={measurementDate}
                onChange={(e) => setMeasurementDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="measurement-weight">체중 (kg)</Label>
              <Input
                id="measurement-weight"
                type="number"
                step="0.1"
                placeholder="70.0"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="measurement-muscle">골격근량 (kg)</Label>
              <Input
                id="measurement-muscle"
                type="number"
                step="0.1"
                placeholder="30.0"
                value={muscleMass}
                onChange={(e) => setMuscleMass(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="measurement-fat">체지방량 (kg)</Label>
              <Input
                id="measurement-fat"
                type="number"
                step="0.1"
                placeholder="15.0"
                value={bodyFat}
                onChange={(e) => setBodyFat(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="measurement-fat-percent">체지방률 (%)</Label>
              <Input
                id="measurement-fat-percent"
                type="number"
                step="0.1"
                placeholder="21.4"
                value={bodyFatPercent}
                onChange={(e) => setBodyFatPercent(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={handleSaveInBody} className="w-full mt-4" disabled={isSaving}>
            <Plus className="w-4 h-4 mr-2" />
            {isSaving ? "저장 중..." : "측정 기록 추가"}
          </Button>
          
          <div className="mt-6">
            <h4 className="font-semibold text-md text-gray-800 mb-3">최근 4주간의 인바디 기록</h4>
            {fourWeeksInbodyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={fourWeeksInbodyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="weekLabel" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="weight" stroke="#3b82f6" name="체중 (kg)" strokeWidth={2} />
                  <Line type="monotone" dataKey="muscleMass" stroke="#10b981" name="골격근량 (kg)" strokeWidth={2} />
                  <Line type="monotone" dataKey="bodyFat" stroke="#f59e0b" name="체지방량 (kg)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-lg">
                <p className="text-center text-gray-500">인바디 기록이 없습니다. 측정 기록을 추가해주세요.</p>
              </div>
            )}
          </div>
        </CardContent>
        )}
      </Card>

      {progress && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>체중 변화</CardDescription>
              <CardTitle className={`text-3xl ${progress.weight >= 0 ? "text-blue-600" : "text-red-600"}`}>
                {progress.weight >= 0 ? "+" : ""}{progress.weight.toFixed(1)} kg
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {firstMeasurement.weight}kg → {latestMeasurement.weight}kg
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>골격근량 변화</CardDescription>
              <CardTitle className={`text-3xl ${progress.muscleMass >= 0 ? "text-green-600" : "text-red-600"}`}>
                {progress.muscleMass >= 0 ? "+" : ""}{progress.muscleMass.toFixed(1)} kg
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {firstMeasurement.muscleMass}kg → {latestMeasurement.muscleMass}kg
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>체지방량 변화</CardDescription>
              <CardTitle className={`text-3xl ${progress.bodyFat <= 0 ? "text-green-600" : "text-red-600"}`}>
                {progress.bodyFat >= 0 ? "+" : ""}{progress.bodyFat.toFixed(1)} kg
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {firstMeasurement.bodyFat}kg → {latestMeasurement.bodyFat}kg
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {measurements.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>체중 변화 추이</CardTitle>
              <CardDescription>시간에 따른 체중 변화</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={measurements}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="weight" stroke="#3b82f6" name="체중 (kg)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>신체 구성 변화</CardTitle>
              <CardDescription>골격근량과 체지방량의 변화</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={measurements}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="muscleMass" stroke="#10b981" name="골격근량 (kg)" strokeWidth={2} />
                  <Line type="monotone" dataKey="bodyFat" stroke="#f59e0b" name="체지방량 (kg)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>주간 칼로리 및 영양소 섭취</CardTitle>
              <CardDescription>최근 4주간의 영양 기록</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNutrition(!showNutrition)}
            >
              {showNutrition ? "숨기기" : "자세히 보기"}
            </Button>
          </div>
        </CardHeader>
        {showNutrition && (
        <CardContent className="space-y-4">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={fourWeeksTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="weekLabel" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalCalories" fill="#8b5cf6" name="칼로리 (kcal)" />
              <Bar dataKey="totalProtein" fill="#3b82f6" name="단백질 (g)" />
              <Bar dataKey="totalCarbs" fill="#f59e0b" name="탄수화물 (g)" />
              <Bar dataKey="totalFat" fill="#ef4444" name="지방 (g)" />
            </BarChart>
          </ResponsiveContainer>
          <h4 className="font-semibold text-md text-gray-800 mt-6 mb-3">최근 7일간의 섭취량</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-purple-50 rounded-lg text-center">
              <div className="text-sm text-gray-600 mb-1">평균 칼로리</div>
              <div className="text-2xl font-bold text-purple-600">{weeklyAverages.calories.toFixed(0)}</div>
              <div className="text-xs text-gray-500">kcal/일</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <div className="text-sm text-gray-600 mb-1">총 칼로리</div>
              <div className="text-2xl font-bold text-blue-600">{weeklyTotals.calories.toFixed(0)}</div>
              <div className="text-xs text-gray-500">kcal</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg text-center">
              <div className="text-sm text-gray-600 mb-1">총 단백질</div>
              <div className="text-2xl font-bold text-green-600">{weeklyTotals.protein.toFixed(1)}</div>
              <div className="text-xs text-gray-500">g</div>
            </div>
            <div className="p-4 bg-teal-50 rounded-lg text-center">
              <div className="text-sm text-gray-600 mb-1">평균 단백질</div>
              <div className="text-2xl font-bold text-teal-600">{weeklyAverages.protein.toFixed(1)}</div>
              <div className="text-xs text-gray-500">g/일</div>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg text-center">
              <div className="text-sm text-gray-600 mb-1">총 탄수화물</div>
              <div className="text-2xl font-bold text-orange-600">{weeklyTotals.carbs.toFixed(1)}</div>
              <div className="text-xs text-gray-500">g</div>
            </div>
            <div className="p-4 bg-amber-50 rounded-lg text-center">
              <div className="text-sm text-gray-600 mb-1">평균 탄수화물</div>
              <div className="text-2xl font-bold text-amber-600">{weeklyAverages.carbs.toFixed(1)}</div>
              <div className="text-xs text-gray-500">g/일</div>
            </div>
            <div className="p-4 bg-red-50 rounded-lg text-center">
              <div className="text-sm text-gray-600 mb-1">총 지방</div>
              <div className="text-2xl font-bold text-red-600">{weeklyTotals.fat.toFixed(1)}</div>
              <div className="text-xs text-gray-500">g</div>
            </div>
            <div className="p-4 bg-rose-50 rounded-lg text-center">
              <div className="text-sm text-gray-600 mb-1">평균 지방</div>
              <div className="text-2xl font-bold text-rose-600">{weeklyAverages.fat.toFixed(1)}</div>
              <div className="text-xs text-gray-500">g/일</div>
            </div>
          </div>
        </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>주간 운동 분석</CardTitle>
              <CardDescription>4주간의 운동 기록</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExercise(!showExercise)}
            >
              {showExercise ? "숨기기" : "자세히 보기"}
            </Button>
          </div>
        </CardHeader>
        {showExercise && (
        <CardContent className="space-y-4">
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={fourWeeksTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="weekLabel" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="totalSets" stroke="#10b981" name="세트 수" strokeWidth={2} />
              <Line yAxisId="right" type="monotone" dataKey="totalVolume" stroke="#f59e0b" name="볼륨 (kg)" strokeWidth={2} />
              <Line yAxisId="left" type="monotone" dataKey="avgIntensity" stroke="#8b5cf6" name="강도 (kg/세트)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
          <h4 className="font-semibold text-md text-gray-800 mt-6 mb-3">최근 7일간의 운동 기록</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 bg-purple-50 rounded-lg text-center">
              <div className="text-sm text-gray-600 mb-1">평균 운동 빈도</div>
              <div className="text-2xl font-bold text-purple-600">{avgWorkoutFrequency.toFixed(0)}%</div>
              <div className="text-xs text-gray-500">{workoutDays}일/7일</div>
            </div>
            <div className="p-4 bg-indigo-50 rounded-lg text-center">
              <div className="text-sm text-gray-600 mb-1">평균 운동 볼륨</div>
              <div className="text-2xl font-bold text-indigo-600">{weeklyAverages.volume.toFixed(0)}</div>
              <div className="text-xs text-gray-500">kg/일</div>
            </div>
            <div className="p-4 bg-violet-50 rounded-lg text-center">
              <div className="text-sm text-gray-600 mb-1">평균 운동 강도</div>
              <div className="text-2xl font-bold text-violet-600">{avgIntensity.toFixed(1)}</div>
              <div className="text-xs text-gray-500">kg/세트</div>
            </div>
            <div className="p-4 bg-pink-50 rounded-lg text-center">
              <div className="text-sm text-gray-600 mb-1">총 운동 빈도</div>
              <div className="text-2xl font-bold text-pink-600">{workoutDays}</div>
              <div className="text-xs text-gray-500">일</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <div className="text-sm text-gray-600 mb-1">총 운동 볼륨</div>
              <div className="text-2xl font-bold text-blue-600">{weeklyTotals.volume.toLocaleString()}</div>
              <div className="text-xs text-gray-500">kg</div>
            </div>
            <div className="p-4 bg-emerald-50 rounded-lg text-center">
              <div className="text-sm text-gray-600 mb-1">평균 RIR</div>
              <div className="text-2xl font-bold text-emerald-600">{avgWeekRir !== null ? avgWeekRir.toFixed(1) : '-'}</div>
              <div className="text-xs text-gray-500">여유 반복수</div>
            </div>
          </div>
        </CardContent>
        )}
      </Card>

      {bodyCompositionTrend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>체성분 변화 분석</CardTitle>
            <CardDescription>주별 체중, 골격근량, 체지방량 변화 (최근 12주)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={bodyCompositionTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="weekLabel" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="weight" stroke="#3b82f6" name="체중 (kg)" strokeWidth={2} />
                <Line type="monotone" dataKey="muscleMass" stroke="#10b981" name="골격근량 (kg)" strokeWidth={2} />
                <Line type="monotone" dataKey="bodyFat" stroke="#f59e0b" name="체지방량 (kg)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}