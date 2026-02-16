import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Save, Utensils, Dumbbell, Sparkles, History, Target, Play, Pause, Square, Edit, RotateCcw, HelpCircle, Watch, Link, Download } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/app/components/ui/dialog";
import { WorkoutLogShareButton } from "@/app/components/WorkoutLogShareButton";

interface DailyLogTabProps {
  accessToken: string;
  supabaseUrl: string;
  publicAnonKey: string;
}

interface Food {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface Exercise {
  name: string;
  trainingPhase?: string; // 운동 단계: 근지구력, 근비대, 최대근력, 파워
  sets: Array<{ weight: number; reps: number; rir?: number }>; // 각 세트마다 무게, 개수, RIR
  totalTime?: number; // 총 운동시간 (분)
  // 유산소 운동 관련
  cardioMethod?: 'rpe' | 'trimp' | 'distance' | 'power'; // 운동량 계산 방식
  cardioTime?: number; // 운동 시간 (분)
  cardioRPE?: number; // RPE 값
  cardioHRAvg?: number; // 평균 심박수
  cardioHRRest?: number; // 안정시 심박수
  cardioHRMax?: number; // 최대 심박수
  // 거리 기반
  cardioDistance?: number; // 거리 (km)
  cardioWeight?: number; // 체중 (kg)
  // 파워 기반
  cardioPower?: number; // 평균 파워 (W)
  cardioTimeSeconds?: number; // 시간 (초)
  cardioNP?: number; // Normalized Power
  cardioIF?: number; // Intensity Factor
  cardioFTP?: number; // Functional Threshold Power
  cardioVolume?: number; // 계산된 운동량 (AU, TRIMP, 또는 TSS)
}

export function DailyLogTab({ accessToken, supabaseUrl, publicAnonKey }: DailyLogTabProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // 음식 기록 목록 표시/숨김 상태
  const [showFoodList, setShowFoodList] = useState(true);
  const [showNutritionGoal, setShowNutritionGoal] = useState(true);
  const [showExerciseLog, setShowExerciseLog] = useState(true);

  // 프로필 목표 영양소 상태
  const [goalCalories, setGoalCalories] = useState(0);
  const [goalProtein, setGoalProtein] = useState(0);
  const [goalCarbs, setGoalCarbs] = useState(0);
  const [goalFat, setGoalFat] = useState(0);
  const [isLoadingGoals, setIsLoadingGoals] = useState(true);
  const [userName, setUserName] = useState("");
  const [userGender, setUserGender] = useState(""); // 성별 정보 추가

  // Food form state
  const [foodName, setFoodName] = useState("");
  const [foodCalories, setFoodCalories] = useState("");
  const [foodProtein, setFoodProtein] = useState("");
  const [foodCarbs, setFoodCarbs] = useState("");
  const [foodFat, setFoodFat] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Exercise form state
  const [exerciseName, setExerciseName] = useState("");
  const [trainingPhase, setTrainingPhase] = useState(""); // 운동 단계
  const [totalTime, setTotalTime] = useState(""); // 총 운동시간
  const [currentSets, setCurrentSets] = useState<Array<{ weight: string; reps: string; rir?: string }>>([
    { weight: "", reps: "", rir: "" }
  ]);
  const [exerciseSuggestions, setExerciseSuggestions] = useState<string[]>([]);
  const [showExerciseSuggestions, setShowExerciseSuggestions] = useState(false);
  
  // 스탑워치 상태
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0); // 초 단위
  const [workoutStartTime, setWorkoutStartTime] = useState<number | null>(null); // 운동 시작 시간 (타임스탬프)
  const [hasStartedWorkout, setHasStartedWorkout] = useState(false); // 운동 시작 여부

  // 유산소 운동 리스트
  const cardioExercises = [
    "런닝머신", "트레드밀", "사이클", "에어바이크", "스핀바이크",
    "스텝밀", "스텝퍼", "클라이밍머신", "로잉머신", "컨셉2 로잉",
    "일립티컬", "크로스트레이너", "어썰트 바이크", "에어러너"
  ];

  // 거리 기반 운동 (러닝, 걷기)
  const distanceBasedExercises = ["런닝머신", "트레드밀", "에어러너", "러닝", "조깅", "걷기", "워킹"];

  // 파워 기반 운동 (싸이클, 로잉, 스키)
  const powerBasedExercises = ["사이클", "에어바이크", "스핀바이크", "로잉머신", "컨셉2 로잉", "로잉", "스키", "크로스컨트리"];

  // 현재 선택된 운동이 유산소인지 확인
  const isCardio = cardioExercises.some(cardio => 
    exerciseName.toLowerCase().includes(cardio.toLowerCase())
  );

  // 현재 선택된 운동이 거리 기반인지 확인
  const isDistanceBased = distanceBasedExercises.some(exercise => 
    exerciseName.toLowerCase().includes(exercise.toLowerCase())
  );

  // 현재 선택된 운동이 파워 기반인지 확인
  const isPowerBased = powerBasedExercises.some(exercise => 
    exerciseName.toLowerCase().includes(exercise.toLowerCase())
  );

  // 유산소 운동 form state
  const [cardioMethod, setCardioMethod] = useState<'rpe' | 'trimp' | 'distance' | 'power'>('rpe');
  const [cardioTime, setCardioTime] = useState("");
  const [cardioRPE, setCardioRPE] = useState("");
  const [cardioHRAvg, setCardioHRAvg] = useState("");
  const [cardioHRRest, setCardioHRRest] = useState("");
  const [cardioHRMax, setCardioHRMax] = useState("");
  // 거리 기반
  const [cardioDistance, setCardioDistance] = useState("");
  const [cardioWeight, setCardioWeight] = useState("");
  // 파워 기반
  const [cardioPower, setCardioPower] = useState("");
  const [cardioTimeSeconds, setCardioTimeSeconds] = useState("");
  const [cardioNP, setCardioNP] = useState("");
  const [cardioIF, setCardioIF] = useState("");
  const [cardioFTP, setCardioFTP] = useState("");
  const [powerMethod, setPowerMethod] = useState<'simple' | 'tss'>('simple'); // 파워 계산 방식
  const [cardioVolume, setCardioVolume] = useState<number | null>(null);

  // 웨어러블 연동
  const [showWearableDialog, setShowWearableDialog] = useState(false);
  const [connectedWearables, setConnectedWearables] = useState<string[]>([]);
  const [isLoadingWearableData, setIsLoadingWearableData] = useState(false);
  const [showTrainingPhaseGuide, setShowTrainingPhaseGuide] = useState(false);

  // 과거 운동 기록 조회
  const [exerciseHistory, setExerciseHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [rirFeedback, setRirFeedback] = useState<string | null>(null);
  const [oneRM, setOneRM] = useState<{ weight: number; date: string } | null>(null);
  const [trainingRecommendation, setTrainingRecommendation] = useState<{
    reps: string;
    sets: string;
    intensity: string;
    weight: string;
    tempo: string;
    rest: string;
  } | null>(null);

  // 편집 상태
  const [editingFoodIndex, setEditingFoodIndex] = useState<number | null>(null);
  const [editingExerciseIndex, setEditingExerciseIndex] = useState<number | null>(null);

  // 프로필 목표 영양소 불러오기
  useEffect(() => {
    const loadGoalNutrition = async () => {
      setIsLoadingGoals(true);
      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/make-server-2c29cd73/profile`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.profile) {
            // ProfileTab에서 계산한 recommendedCalories 등을 불러옴
            setGoalCalories(data.profile.recommendedCalories || 0);
            setGoalProtein(data.profile.recommendedProtein || 0);
            setGoalCarbs(data.profile.recommendedCarbs || 0);
            setGoalFat(data.profile.recommendedFat || 0);
            setUserName(data.profile.name || "회원");
            setUserGender(data.profile.gender || ""); // 성별 정보 저장
          }
        }
      } catch (error) {
        console.error("Error loading goal nutrition:", error);
      } finally {
        setIsLoadingGoals(false);
      }
    };

    loadGoalNutrition();
  }, [accessToken, supabaseUrl]);

  // 초과 알림 메시지 생성 함수
  const getRandomExceededMessage = (gender: string) => {
    const commonMessages = [
      '여름이 다가오고 있어요.',
      '먹은거 뺄 수 있죠?',
      '살이 찌는 소리가 들려',
      '뱃살만 1kg?',
      '바지 뒷태 기저귀핏',
      '팔뚝살 덜렁덜렁',
      '허벅지살 흐물흐물',
      '뱃살 디룩디룩',
      '주말에 먹은거 언제 빼요?'
    ];
    
    const femaleMessages = ['여름에 비키니 입어봐야지!', '올해 여름에도 래쉬가드?'];
    const maleMessages = ['여름에 상의 탈의 해봐야지!', '올해 여름에도 래쉬가드?'];
    
    let allMessages = [...commonMessages];
    
    if (gender === '여성' || gender === 'female' || gender === '여자') {
      allMessages = [...allMessages, ...femaleMessages];
    } else if (gender === '남성' || gender === 'male' || gender === '남자') {
      allMessages = [...allMessages, ...maleMessages];
    }
    
    const randomIndex = Math.floor(Math.random() * allMessages.length);
    return allMessages[randomIndex];
  };

  // 운동 동기부여 메시지 생성 함수
  const getWorkoutMotivationMessage = (gender: string) => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0: 일요일, 1: 월요일, ..., 6: 토요일
    
    const commonMessages = [
      '라잇 웨잇!',
      '유 갓 디스!',
      '운동 끝나고 맛있는거 먹으러 가야죠!',
      '내일 무슨 음식이 들어올지 몰라요',
      '내일 운동 못할지도 몰라요',
      '지금 이시��이 후회가 남지 않도록!',
      '힘들어도 이또한 지나갑니다. 지나가길 바라는 강도로 하고 계신가요?',
      '운동 멈추지 말고 끝까지 꿈틀꿈틀!!',
      '이번에 1개더 안하면 뱃살만 1kg찝니다',
      '다가올 여름 래쉬가드입으실 건가요?'
    ];

    const maleMessages = [
      '반팔티 헐렁헐렁해질 것 같은데..',
      '옷 박시하게 입으시네요?'
    ];

    const femaleMessages = [
      '골반뼈가 어딨죠?',
      '옷이 좀 껴보이네요?'
    ];

    const dayMessages: { [key: number]: string[] } = {
      5: ['오늘은 불금! 맛있는거 편하게 먹어야죠^^'], // 금요일
      6: ['오늘은 불토! 주말 편하게 즐겨야죠^^'], // 토요일
      0: ['내일 후회하지 않게 한번더!'], // 일요일
      1: ['어제 야식먹은거 생각해봐요^^', '주말에 먹은거 생각해봐요^^'], // 월요일
      2: ['어제 야식먹은거 생각해봐요^^', '주말에 먹은거 생각해봐요^^'] // 화요일
    };

    let allMessages = [...commonMessages];

    // 성별에 따른 메시지 추가
    if (gender === '여성' || gender === 'female' || gender === '여자') {
      allMessages = [...allMessages, ...femaleMessages];
    } else if (gender === '남성' || gender === 'male' || gender === '남자') {
      allMessages = [...allMessages, ...maleMessages];
    }

    // 요일별 메시지 추가
    if (dayMessages[dayOfWeek]) {
      allMessages = [...allMessages, ...dayMessages[dayOfWeek]];
    }

    const randomIndex = Math.floor(Math.random() * allMessages.length);
    return allMessages[randomIndex];
  };

  // 최고 무게 갱신 축하 메시지 생성 함수
  const getPersonalRecordMessage = (gender: string) => {
    const commonMessages = ['와 정말 대단한데요?'];
    
    const maleMessages = [
      '와 몸이 좋아보인다 했더니..역시 짝짝',
      '여자가 줄을 서겠어요!'
    ];
    
    const femaleMessages = [
      '와 지난 고생이 드디어 빛을 발하네요',
      '남자가 줄을 서겠어요!'
    ];

    let allMessages = [...commonMessages];

    if (gender === '여성' || gender === 'female' || gender === '여자') {
      allMessages = [...allMessages, ...femaleMessages];
    } else if (gender === '남성' || gender === 'male' || gender === '남자') {
      allMessages = [...allMessages, ...maleMessages];
    }

    const randomIndex = Math.floor(Math.random() * allMessages.length);
    return allMessages[randomIndex];
  };

  // localStorage에서 폼 데이터 복원
  useEffect(() => {
    const savedFoodForm = localStorage.getItem('whitby_food_form');
    const savedExerciseForm = localStorage.getItem('whitby_exercise_form');
    
    if (savedFoodForm) {
      try {
        const data = JSON.parse(savedFoodForm);
        setFoodName(data.foodName || "");
        setFoodCalories(data.foodCalories || "");
        setFoodProtein(data.foodProtein || "");
        setFoodCarbs(data.foodCarbs || "");
        setFoodFat(data.foodFat || "");
      } catch (e) {
        console.error("Error loading food form from localStorage:", e);
      }
    }
    
    if (savedExerciseForm) {
      try {
        const data = JSON.parse(savedExerciseForm);
        setExerciseName(data.exerciseName || "");
        setTrainingPhase(data.trainingPhase || "");
        setTotalTime(data.totalTime || "");
        setCurrentSets(data.currentSets || [{ weight: "", reps: "" }]);
      } catch (e) {
        console.error("Error loading exercise form from localStorage:", e);
      }
    }
  }, []);

  // 음식 폼 데이터를 localStorage에 저장
  useEffect(() => {
    const formData = { foodName, foodCalories, foodProtein, foodCarbs, foodFat };
    localStorage.setItem('whitby_food_form', JSON.stringify(formData));
  }, [foodName, foodCalories, foodProtein, foodCarbs, foodFat]);

  // 운동 폼 데이터를 localStorage에 저장
  useEffect(() => {
    const formData = { exerciseName, trainingPhase, totalTime, currentSets };
    localStorage.setItem('whitby_exercise_form', JSON.stringify(formData));
  }, [exerciseName, trainingPhase, totalTime, currentSets]);

  // 날짜별 데이터 로드
  useEffect(() => {
    const loadDailyLog = async () => {
      try {
        const response = await fetch(
          `${supabaseUrl}/functions/v1/make-server-2c29cd73/daily-log?date=${selectedDate}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data) {
            setFoods(data.foods || []);
            setExercises(data.exercises || []);
            setElapsedTime((data.totalWorkoutTime || 0) * 60); // 분을 초로 변환
          } else {
            // 데이터가 없으면 초기화
            setFoods([]);
            setExercises([]);
            setElapsedTime(0);
          }
        } else {
          // 데이터가 없으면 초기화
          setFoods([]);
          setExercises([]);
          setElapsedTime(0);
        }
      } catch (error) {
        console.error("Error loading daily log:", error);
        // 오류 시에도 초기화
        setFoods([]);
        setExercises([]);
        setElapsedTime(0);
      }
    };

    if (selectedDate && accessToken && supabaseUrl) {
      loadDailyLog();
    }
  }, [selectedDate, accessToken, supabaseUrl]);

  // 스탑워치 타이머
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedTime((prevTime) => prevTime + 1);
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  // 10분마다 운동 동기부여 알람
  useEffect(() => {
    let motivationInterval: NodeJS.Timeout | null = null;
    
    if (isRunning) {
      // 10분 = 600초 = 600000ms
      motivationInterval = setInterval(() => {
        const message = getWorkoutMotivationMessage(userGender);
        toast.info(message, { duration: 5000 });
      }, 600000); // 10분마다
    }
    
    return () => {
      if (motivationInterval) clearInterval(motivationInterval);
    };
  }, [isRunning, userGender]);

  // 운동 단계 변경 시 추천 업데이트
  useEffect(() => {
    if (trainingPhase && exerciseName && oneRM) {
      generateTrainingRecommendation(trainingPhase, oneRM.weight);
    } else if (trainingPhase && exerciseName && exerciseHistory.length > 0) {
      // 1RM이 없지만 기록이 있으면 추정
      const latestRecord = exerciseHistory[0];
      const maxSet = latestRecord.sets.reduce((max: any, set: any) => {
        if (!max || (set.weight * set.reps) > (max.weight * max.reps)) {
          return set;
        }
        return max;
      }, null);
      
      if (maxSet && maxSet.weight && maxSet.reps && maxSet.rir !== undefined) {
        const estimated1RM = maxSet.weight / (1.0278 - 0.0278 * (maxSet.reps + maxSet.rir));
        generateTrainingRecommendation(trainingPhase, estimated1RM);
      } else {
        generateTrainingRecommendation(trainingPhase, null);
      }
    } else if (trainingPhase) {
      generateTrainingRecommendation(trainingPhase, null);
    } else {
      setTrainingRecommendation(null);
    }
  }, [trainingPhase, exerciseName, oneRM, exerciseHistory]);

  // 스탑워치 시간 포맷팅 (HH:MM:SS)
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 운동 시작
  const startWorkout = () => {
    setIsRunning(true);
    setHasStartedWorkout(true);
    setWorkoutStartTime(Date.now());
    toast.success("운동을 시작합니다!");
  };

  // 일시정지
  const pauseWorkout = () => {
    setIsRunning(false);
  };

  // 운동 종료 및 저장
  const finishWorkout = async () => {
    setIsRunning(false);
    
    // 현재까지 기록된 운동들을 저장
    if (exercises.length === 0) {
      toast.error("기록된 운동이 없습니다.");
      return;
    }

    // 운동 시간 계산 (초 -> 분)
    const totalMinutes = Math.floor(elapsedTime / 60);
    
    // 운동 시간을 포함하여 저장
    await handleSave(totalMinutes);
    
    // 스탑워치 및 상태 초기화
    setElapsedTime(0);
    setHasStartedWorkout(false);
    setWorkoutStartTime(null);
    toast.success(`운동이 종료되었습니다! (총 운동 시간: ${totalMinutes}분)`);
  };

  // 운동 리셋 (타이머만 초기화)
  const resetWorkout = () => {
    setIsRunning(false);
    setElapsedTime(0);
    toast.info("타이머가 초기화되었습니다.");
  };

  const loadExerciseHistory = async (exerciseName: string) => {
    setIsLoadingHistory(true);
    
    try {
      // 최근 30일간의 데이터 조회
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30);
      
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
        
        // 해당 운동의 기록만 필터링
        const history: any[] = [];
        data.logs?.forEach((log: any) => {
          const exerciseLog = log.value.exercises?.find((ex: any) => ex.name === exerciseName);
          if (exerciseLog) {
            history.push({
              date: log.value.date,
              sets: exerciseLog.sets,
              totalTime: exerciseLog.totalTime,
            });
          }
        });
        
        // 날짜 역순 정렬 (최신순)
        history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setExerciseHistory(history);
        
        // 1RM 계산 (reps가 1인 세트 중 최고 무게)
        let maxOneRM: { weight: number; date: string } | null = null;
        history.forEach((record: any) => {
          record.sets.forEach((set: any) => {
            if (set.reps === 1) {
              if (!maxOneRM || set.weight > maxOneRM.weight) {
                maxOneRM = { weight: set.weight, date: record.date };
              }
            }
          });
        });
        setOneRM(maxOneRM);
        
        // RIR 피드백 생성
        if (history.length > 0) {
          const latestRecord = history[0];
          const rirValues = latestRecord.sets
            .map((set: any) => set.rir)
            .filter((rir: any) => rir !== undefined && rir !== null);
          
          if (rirValues.length > 0) {
            const avgRir = rirValues.reduce((sum: number, rir: number) => sum + rir, 0) / rirValues.length;
            const currentSetCount = latestRecord.sets.length;
            
            let feedback = "";
            if (avgRir <= 1) {
              feedback = `⚠️ 과부하 (평균 RIR: ${avgRir.toFixed(1)}) - 이번엔 ${currentSetCount - 1}세트를 해보세요`;
            } else if (avgRir > 1 && avgRir <= 2) {
              feedback = `✅ 최적 (평균 RIR: ${avgRir.toFixed(1)}) - 현재 ${currentSetCount}세트를 유지하세요`;
            } else if (avgRir > 2 && avgRir < 3) {
              feedback = `💪 여유 (평균 RIR: ${avgRir.toFixed(1)}) - 이번엔 ${currentSetCount + 1}세트를 해보세요`;
            } else {
              feedback = `🚀 너무 여유 (평균 RIR: ${avgRir.toFixed(1)}) - 이번엔 ${currentSetCount + 2}세트를 해보세요`;
            }
            
            setRirFeedback(feedback);
          } else {
            setRirFeedback(null);
          }
        } else {
          setRirFeedback(null);
        }
        
        // 운동 단계별 추천 생성 (1RM 또는 최근 기록을 바탕으로)
        if (trainingPhase) {
          let estimated1RM: number | null = null;
          
          // 1RM이 있으면 그대로 사용
          if (maxOneRM) {
            estimated1RM = maxOneRM.weight;
          } else if (history.length > 0) {
            // 1RM 기록이 없으면 최근 기록에서 추정
            const latestRecord = history[0];
            const maxSet = latestRecord.sets.reduce((max: any, set: any) => {
              if (!max || (set.weight * set.reps) > (max.weight * max.reps)) {
                return set;
              }
              return max;
            }, null);
            
            if (maxSet && maxSet.weight && maxSet.reps && maxSet.rir !== undefined) {
              // Brzycki 공식으로 1RM 추정
              estimated1RM = maxSet.weight / (1.0278 - 0.0278 * (maxSet.reps + maxSet.rir));
            }
          }
          
          generateTrainingRecommendation(trainingPhase, estimated1RM);
        }
      }
    } catch (error) {
      console.error("Error loading exercise history:", error);
      toast.error("과거 기록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const analyzeFoodWithAI = async () => {
    if (!foodName.trim()) {
      toast.error("음식 이름을 먼저 입력해주세요.");
      return;
    }

    setIsAnalyzing(true);
    
    // 일반적인 한국 음식 데이터베이스 (평균 1인분 기준)
    const foodDatabase: { [key: string]: { calories: number; protein: number; carbs: number; fat: number } } = {
      "닭가슴살": { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
      "계란": { calories: 155, protein: 13, carbs: 1.1, fat: 11 },
      "쌀밥": { calories: 210, protein: 4, carbs: 46, fat: 0.4 },
      "현미밥": { calories: 218, protein: 5, carbs: 45, fat: 1.8 },
      "고구마": { calories: 130, protein: 2, carbs: 30, fat: 0.2 },
      "바나나": { calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
      "사과": { calories: 95, protein: 0.5, carbs: 25, fat: 0.3 },
      "우유": { calories: 150, protein: 8, carbs: 12, fat: 8 },
      "그릭요거트": { calories: 100, protein: 17, carbs: 6, fat: 0.7 },
      "아몬드": { calories: 164, protein: 6, carbs: 6, fat: 14 },
      "땅콩버터": { calories: 188, protein: 8, carbs: 7, fat: 16 },
      "닭고기": { calories: 239, protein: 27, carbs: 0, fat: 14 },
      "소고기": { calories: 250, protein: 26, carbs: 0, fat: 15 },
      "돼지고기": { calories: 242, protein: 27, carbs: 0, fat: 14 },
      "연어": { calories: 206, protein: 22, carbs: 0, fat: 13 },
      "참치": { calories: 132, protein: 28, carbs: 0, fat: 1.3 },
      "두부": { calories: 144, protein: 15, carbs: 3, fat: 9 },
      "브로콜리": { calories: 55, protein: 4, carbs: 11, fat: 0.6 },
      "시금치": { calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
      "토마토": { calories: 22, protein: 1.1, carbs: 4.8, fat: 0.2 },
      "아보카도": { calories: 240, protein: 3, carbs: 13, fat: 22 },
      "치킨": { calories: 320, protein: 28, carbs: 15, fat: 16 },
      "피자": { calories: 285, protein: 12, carbs: 36, fat: 10 },
      "햄버거": { calories: 354, protein: 20, carbs: 33, fat: 16 },
      "라면": { calories: 380, protein: 10, carbs: 56, fat: 14 },
      "김치찌개": { calories: 150, protein: 12, carbs: 10, fat: 7 },
      "된장찌개": { calories: 120, protein: 10, carbs: 8, fat: 5 },
      "불고기": { calories: 280, protein: 25, carbs: 12, fat: 15 },
      "삼겹살": { calories: 518, protein: 17, carbs: 0, fat: 50 },
      "김밥": { calories: 350, protein: 8, carbs: 50, fat: 12 },
      "떡볶이": { calories: 382, protein: 8, carbs: 72, fat: 7 },
      "치킨너겟": { calories: 280, protein: 13, carbs: 18, fat: 18 },
      "프로틴쉐이크": { calories: 120, protein: 24, carbs: 3, fat: 1.5 },
      "오트밀": { calories: 150, protein: 5, carbs: 27, fat: 3 },
      "샐러드": { calories: 50, protein: 2, carbs: 10, fat: 1 },
      
      // 인앤아웃 (샐러드 전문점)
      "인앤아웃 치킨샐러드": { calories: 285, protein: 32, carbs: 18, fat: 10 },
      "인앤아웃 연어샐러드": { calories: 320, protein: 28, carbs: 20, fat: 15 },
      "인앤아웃 스테이크샐러드": { calories: 350, protein: 35, carbs: 22, fat: 14 },
      "인앤아웃 두부샐러드": { calories: 240, protein: 18, carbs: 25, fat: 9 },
      "인앤아웃": { calories: 285, protein: 30, carbs: 20, fat: 10 },
      
      // 밀리그램 (샐러드 전문점)
      "밀리그램 닭가슴살샐러드": { calories: 280, protein: 33, carbs: 20, fat: 8 },
      "밀리그램 연어샐러드": { calories: 310, protein: 26, carbs: 22, fat: 14 },
      "밀리그램 쉬림프샐러드": { calories: 260, protein: 28, carbs: 24, fat: 7 },
      "밀리그램 스테이크샐러드": { calories: 340, protein: 34, carbs: 23, fat: 13 },
      "밀리그램": { calories: 280, protein: 30, carbs: 22, fat: 9 },
      
      // 서브웨이
      "서브웨이 터키샌드위치": { calories: 280, protein: 18, carbs: 46, fat: 4 },
      "서브웨이 참치샌드위치": { calories: 480, protein: 20, carbs: 46, fat: 25 },
      "서브웨이 치킨샌드위치": { calories: 320, protein: 23, carbs: 48, fat: 5 },
      "서브웨이": { calories: 350, protein: 20, carbs: 47, fat: 10 },
      
      // 맥도날드
      "맥도날드 빅맥": { calories: 563, protein: 26, carbs: 46, fat: 33 },
      "맥도날드 상하이버거": { calories: 452, protein: 17, carbs: 41, fat: 25 },
      "맥도날드 1955버거": { calories: 618, protein: 30, carbs: 42, fat: 38 },
      "맥도날드 치킨너겟": { calories: 287, protein: 13, carbs: 18, fat: 18 },
      "맥도날드 감자튀김": { calories: 337, protein: 4, carbs: 42, fat: 17 },
      "맥도날드": { calories: 500, protein: 22, carbs: 44, fat: 28 },
      
      // 버거킹
      "버거킹 와퍼": { calories: 677, protein: 28, carbs: 52, fat: 40 },
      "버거킹 치즈와퍼": { calories: 771, protein: 35, carbs: 53, fat: 48 },
      "버거킹": { calories: 650, protein: 30, carbs: 52, fat: 38 },
      
      // KFC
      "kfc 치킨": { calories: 320, protein: 28, carbs: 12, fat: 19 },
      "kfc 징거버거": { calories: 490, protein: 25, carbs: 48, fat: 22 },
      "kfc": { calories: 380, protein: 26, carbs: 28, fat: 20 },
      
      // BBQ 치킨
      "bbq 황금올리브": { calories: 280, protein: 25, carbs: 8, fat: 17 },
      "bbq": { calories: 280, protein: 25, carbs: 8, fat: 17 },
      
      // 교촌치킨
      "교촌치킨": { calories: 270, protein: 24, carbs: 10, fat: 16 },
      "교촌": { calories: 270, protein: 24, carbs: 10, fat: 16 },
      
      // 스타벅스
      "스타벅스 아메리카노": { calories: 10, protein: 1, carbs: 2, fat: 0 },
      "스타벅스 카페라떼": { calories: 190, protein: 10, carbs: 18, fat: 7 },
      "스타벅스 카푸치노": { calories: 120, protein: 7, carbs: 11, fat: 4 },
      "스타벅스 카라멜마끼아또": { calories: 240, protein: 10, carbs: 34, fat: 7 },
      "스타벅스 프라푸치노": { calories: 350, protein: 5, carbs: 52, fat: 14 },
      "스타벅스 치킨샐러드랩": { calories: 320, protein: 22, carbs: 35, fat: 10 },
      "스타벅스": { calories: 180, protein: 8, carbs: 20, fat: 6 },
      
      // 투썸플레이스
      "투썸 아메리카노": { calories: 10, protein: 1, carbs: 2, fat: 0 },
      "투썸 카페라떼": { calories: 200, protein: 11, carbs: 19, fat: 8 },
      "투썸": { calories: 180, protein: 8, carbs: 20, fat: 6 },
      
      // 편의점 도시락
      "cu도시락": { calories: 550, protein: 18, carbs: 85, fat: 12 },
      "gs25도시락": { calories: 580, protein: 20, carbs: 88, fat: 14 },
      "세븐일레븐도시락": { calories: 560, protein: 19, carbs: 86, fat: 13 },
      "편의점도시락": { calories: 560, protein: 19, carbs: 86, fat: 13 },
      
      // 편의점 삼각김밥
      "삼각김밥": { calories: 180, protein: 4, carbs: 35, fat: 2.5 },
      "참치김밥": { calories: 200, protein: 6, carbs: 34, fat: 4 },
      "스팸김밥": { calories: 220, protein: 7, carbs: 35, fat: 6 },
      
      // 한식 프랜차이즈
      "본죽": { calories: 320, protein: 12, carbs: 58, fat: 4 },
      "본도시락": { calories: 650, protein: 25, carbs: 95, fat: 15 },
      "국밥": { calories: 450, protein: 28, carbs: 45, fat: 18 },
      "순두부찌개": { calories: 180, protein: 14, carbs: 12, fat: 9 },
      "제육볶음": { calories: 420, protein: 24, carbs: 35, fat: 22 },
      "비빔밥": { calories: 560, protein: 18, carbs: 85, fat: 16 },
      
      // 일본 음식
      "초밥": { calories: 350, protein: 15, carbs: 60, fat: 5 },
      "우동": { calories: 380, protein: 12, carbs: 70, fat: 4 },
      "돈까스": { calories: 580, protein: 28, carbs: 50, fat: 28 },
      "라멘": { calories: 450, protein: 18, carbs: 60, fat: 15 },
      "카레": { calories: 520, protein: 15, carbs: 75, fat: 16 },
      
      // 중국 음식
      "짜장면": { calories: 680, protein: 18, carbs: 105, fat: 22 },
      "짬뽕": { calories: 620, protein: 28, carbs: 85, fat: 18 },
      "탕수육": { calories: 850, protein: 32, carbs: 95, fat: 38 },
      "볶음밥": { calories: 720, protein: 20, carbs: 110, fat: 22 },
      
      // 양식
      "스테이크": { calories: 450, protein: 48, carbs: 2, fat: 28 },
      "파스타": { calories: 580, protein: 18, carbs: 85, fat: 18 },
      "리조또": { calories: 520, protein: 15, carbs: 72, fat: 18 },
    };

    try {
      // 입력된 음식 이름과 유사한 것 찾기
      const searchTerm = foodName.toLowerCase().trim();
      let foundFood = null;
      
      for (const [key, value] of Object.entries(foodDatabase)) {
        if (key.toLowerCase().includes(searchTerm) || searchTerm.includes(key.toLowerCase())) {
          foundFood = value;
          break;
        }
      }

      if (foundFood) {
        setFoodCalories(foundFood.calories.toString());
        setFoodProtein(foundFood.protein.toString());
        setFoodCarbs(foundFood.carbs.toString());
        setFoodFat(foundFood.fat.toString());
        toast.success("영양 정보를 찾았습니다!");
      } else {
        // 음식을 찾지 못한 경우, 기본값 추정 (AI 시뮬레이션)
        const isProteinRich = searchTerm.includes("고기") || searchTerm.includes("육") || searchTerm.includes("생선") || searchTerm.includes("계란");
        const isCarbRich = searchTerm.includes("밥") || searchTerm.includes("빵") || searchTerm.includes("면") || searchTerm.includes("떡");
        
        let estimatedCalories = 200;
        let estimatedProtein = 10;
        let estimatedCarbs = 20;
        let estimatedFat = 5;
        
        if (isProteinRich) {
          estimatedCalories = 220;
          estimatedProtein = 25;
          estimatedCarbs = 3;
          estimatedFat = 12;
        } else if (isCarbRich) {
          estimatedCalories = 250;
          estimatedProtein = 5;
          estimatedCarbs = 50;
          estimatedFat = 2;
        }
        
        setFoodCalories(estimatedCalories.toString());
        setFoodProtein(estimatedProtein.toString());
        setFoodCarbs(estimatedCarbs.toString());
        setFoodFat(estimatedFat.toString());
        toast.success("추정된 영양 정보입니다. 정확한 값으로 수정해주세요.");
      }
    } catch (error) {
      console.error("Food analysis error:", error);
      toast.error("분석 중 오류가 발생했습니다.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const addFood = async () => {
    if (!foodName || !foodCalories) {
      toast.error("음식 이름과 칼로리는 필수입니다.");
      return;
    }

    const newFood: Food = {
      name: foodName,
      calories: parseFloat(foodCalories),
      protein: parseFloat(foodProtein) || 0,
      carbs: parseFloat(foodCarbs) || 0,
      fat: parseFloat(foodFat) || 0,
    };

    const updatedFoods = [...foods, newFood];
    setFoods(updatedFoods);
    
    // 목표 초과 체크 (단백질은 제외)
    const newTotalCalories = updatedFoods.reduce((sum, f) => sum + f.calories, 0);
    const newTotalCarbs = updatedFoods.reduce((sum, f) => sum + f.carbs, 0);
    const newTotalFat = updatedFoods.reduce((sum, f) => sum + f.fat, 0);
    
    let hasExceeded = false;
    if (goalCalories > 0 && newTotalCalories > goalCalories) hasExceeded = true;
    if (goalCarbs > 0 && newTotalCarbs > goalCarbs) hasExceeded = true;
    if (goalFat > 0 && newTotalFat > goalFat) hasExceeded = true;
    
    if (hasExceeded) {
      const message = getRandomExceededMessage(userGender);
      toast.error(message, { duration: 4000 });
    } else {
      toast.success("음식이 추가되었습니다!");
    }
    
    // 자동 저장
    setTimeout(async () => {
      await handleSave(undefined, true);
    }, 100);
  };

  const removeFood = async (index: number) => {
    const updatedFoods = foods.filter((_, i) => i !== index);
    setFoods(updatedFoods);
    toast.success("음식이 삭제되었습니다!");
    
    // 자동 저장
    setTimeout(async () => {
      await handleSave(undefined, true);
    }, 100);
  };

  const startEditingFood = (index: number) => {
    const food = foods[index];
    setFoodName(food.name);
    setFoodCalories(food.calories.toString());
    setFoodProtein(food.protein.toString());
    setFoodCarbs(food.carbs.toString());
    setFoodFat(food.fat.toString());
    setEditingFoodIndex(index);
  };

  const updateFood = async () => {
    if (editingFoodIndex === null) return;
    
    if (!foodName || !foodCalories) {
      toast.error("음식 이름과 칼로리는 필수입니다.");
      return;
    }

    const updatedFood: Food = {
      name: foodName,
      calories: parseFloat(foodCalories),
      protein: parseFloat(foodProtein) || 0,
      carbs: parseFloat(foodCarbs) || 0,
      fat: parseFloat(foodFat) || 0,
    };

    const updatedFoods = [...foods];
    updatedFoods[editingFoodIndex] = updatedFood;
    setFoods(updatedFoods);
    
    // 목표 초과 체크 (단백질은 제외)
    const newTotalCalories = updatedFoods.reduce((sum, f) => sum + f.calories, 0);
    const newTotalCarbs = updatedFoods.reduce((sum, f) => sum + f.carbs, 0);
    const newTotalFat = updatedFoods.reduce((sum, f) => sum + f.fat, 0);
    
    let hasExceeded = false;
    if (goalCalories > 0 && newTotalCalories > goalCalories) hasExceeded = true;
    if (goalCarbs > 0 && newTotalCarbs > goalCarbs) hasExceeded = true;
    if (goalFat > 0 && newTotalFat > goalFat) hasExceeded = true;
    
    setFoodName("");
    setFoodCalories("");
    setFoodProtein("");
    setFoodCarbs("");
    setFoodFat("");
    setEditingFoodIndex(null);
    
    if (hasExceeded) {
      const message = getRandomExceededMessage(userGender);
      toast.error(message, { duration: 4000 });
    } else {
      toast.success("음식이 수정되었습니다!");
    }
    
    // 자동 저장
    setTimeout(async () => {
      await handleSave(undefined, true);
    }, 100);
  };

  const cancelEditingFood = () => {
    setFoodName("");
    setFoodCalories("");
    setFoodProtein("");
    setFoodCarbs("");
    setFoodFat("");
    setEditingFoodIndex(null);
  };

  const clearFoodForm = () => {
    setFoodName("");
    setFoodCalories("");
    setFoodProtein("");
    setFoodCarbs("");
    setFoodFat("");
    toast.success("폼이 초기화되었습니다!");
  };

  // 운동 데이터베이스
  const exerciseDatabase = [
    // Panata
    "Panata Chest Press", "Panata Incline Chest Press", "Panata Decline Chest Press", 
    "Panata Pec Fly", "Panata Converging Chest Press",
    "Panata Shoulder Press", "Panata Lateral Raise", "Panata Rear Delt Fly",
    "Panata Front Pulldown", "Panata Vertical Row", "Panata Low Row", "Panata T-Bar Row",
    "Panata Leg Press 45", "Panata Leg Extension", "Panata Lying Leg Curl", "Panata Seated Leg Curl",
    "Panata Hack Squat", "Panata Standing Calf Raise", "Panata Seated Calf Raise",
    "Panata Bicep Curl", "Panata Tricep Extension", "Panata Tricep Dip",
    "Panata Abdominal Crunch", "Panata Lower Back Extension",
    
    // Gym80
    "Gym80 Chest Press", "Gym80 Incline Press", "Gym80 Butterfly",
    "Gym80 Shoulder Press", "Gym80 Lateral Raise", "Gym80 Rear Deltoid",
    "Gym80 Lat Pulldown", "Gym80 Seated Row", "Gym80 Upper Back",
    "Gym80 Leg Press", "Gym80 Leg Extension", "Gym80 Leg Curl", 
    "Gym80 Hack Squat", "Gym80 Calf Raise",
    "Gym80 Biceps Curl", "Gym80 Triceps Extension",
    "Gym80 Abdominal", "Gym80 Lower Back",
    
    // Cybex
    "Cybex Bravo Functional Trainer", "Cybex Eagle Chest Press", "Cybex Eagle Incline Press",
    "Cybex Eagle Pec Fly", "Cybex Eagle Shoulder Press", "Cybex Eagle Lateral Raise",
    "Cybex Eagle Rear Delt", "Cybex Eagle Lat Pulldown", "Cybex Eagle Seated Row",
    "Cybex Eagle Low Row", "Cybex Eagle Leg Press", "Cybex Eagle Leg Extension",
    "Cybex Eagle Leg Curl", "Cybex Eagle Hack Squat", "Cybex Eagle Calf Raise",
    "Cybex Eagle Bicep Curl", "Cybex Eagle Tricep Extension",
    "Cybex Eagle Ab Crunch", "Cybex VR3 Chest Press", "Cybex VR3 Leg Press",
    
    // Hammer Strength
    "Hammer Strength Iso-Lateral Chest Press", "Hammer Strength Iso-Lateral Decline Press",
    "Hammer Strength Iso-Lateral Incline Press", "Hammer Strength Iso-Lateral Bench Press",
    "Hammer Strength Iso-Lateral Shoulder Press", "Hammer Strength Iso-Lateral Front Lat Pulldown",
    "Hammer Strength Iso-Lateral High Row", "Hammer Strength Iso-Lateral Low Row",
    "Hammer Strength Plate Loaded Leg Press", "Hammer Strength Linear Leg Press",
    "Hammer Strength Seated Leg Curl", "Hammer Strength Lying Leg Curl",
    "Hammer Strength V-Squat", "Hammer Strength Hack Squat", 
    "Hammer Strength Ground Base Combo Decline", "Hammer Strength MTS Abdominal Crunch",
    
    // Matrix
    "Matrix Ultra Chest Press", "Matrix Ultra Incline Press", "Matrix Ultra Pec Fly",
    "Matrix Ultra Shoulder Press", "Matrix Ultra Lateral Raise", "Matrix Ultra Rear Delt",
    "Matrix Ultra Lat Pulldown", "Matrix Ultra Seated Row", "Matrix Ultra Low Row",
    "Matrix Ultra Leg Press", "Matrix Ultra Leg Extension", "Matrix Ultra Leg Curl",
    "Matrix Ultra Calf Raise", "Matrix Ultra Bicep Curl", "Matrix Ultra Tricep Extension",
    "Matrix Ultra Abdominal Crunch", "Matrix Aura Series Chest Press",
    
    // Nautilus
    "Nautilus Leverage Chest Press", "Nautilus Leverage Incline Press", 
    "Nautilus Leverage Decline Press", "Nautilus Pec Fly",
    "Nautilus Leverage Shoulder Press", "Nautilus Lateral Raise",
    "Nautilus Pullover", "Nautilus Lat Pulldown", "Nautilus Low Row",
    "Nautilus Compound Row", "Nautilus Leverage Leg Press",
    "Nautilus Leg Extension", "Nautilus Leg Curl", "Nautilus Prone Leg Curl",
    "Nautilus Glute Drive", "Nautilus Calf Raise",
    "Nautilus Biceps Curl", "Nautilus Triceps Extension",
    "Nautilus Abdominal Crunch", "Nautilus Lower Back Extension",
    
    // Technogym
    "Technogym Selection Chest Press", "Technogym Selection Incline Press",
    "Technogym Selection Pectoral", "Technogym Selection Shoulder Press",
    "Technogym Selection Lateral Raise", "Technogym Selection Rear Delt",
    "Technogym Selection Lat Machine", "Technogym Selection Vertical Traction",
    "Technogym Selection Low Row", "Technogym Selection Seated Row",
    "Technogym Selection Leg Press", "Technogym Selection Leg Extension",
    "Technogym Selection Leg Curl", "Technogym Selection Hack Squat",
    "Technogym Selection Calf", "Technogym Selection Arm Curl",
    "Technogym Selection Arm Extension", "Technogym Selection Abdominal Crunch",
    "Technogym Kinesis", "Technogym Plurima",
    
    // Precor
    "Precor Discovery Series Chest Press", "Precor Discovery Series Incline Press",
    "Precor Discovery Series Pec Fly", "Precor Discovery Series Shoulder Press",
    "Precor Discovery Series Lat Pulldown", "Precor Discovery Series Seated Row",
    "Precor Discovery Series Low Row", "Precor Discovery Series Leg Press",
    "Precor Discovery Series Leg Extension", "Precor Discovery Series Leg Curl",
    "Precor Discovery Series Calf Raise", "Precor Icarian Chest Press",
    "Precor Icarian Shoulder Press", "Precor Vitality Series Chest Press",
    
    // M-torture (엠토쳐)
    "M-torture Chest Press", "M-torture Incline Press", "M-torture Pec Deck",
    "M-torture Shoulder Press", "M-torture Lateral Raise",
    "M-torture Lat Pulldown", "M-torture Seated Row", "M-torture Low Row",
    "M-torture Leg Press", "M-torture Leg Extension", "M-torture Leg Curl",
    "M-torture Hack Squat", "M-torture Calf Raise",
    "M-torture Bicep Curl", "M-torture Tricep Extension",
    
    // Life Fitness
    "Life Fitness Signature Series Chest Press", "Life Fitness Signature Series Incline Press",
    "Life Fitness Signature Series Pec Fly", "Life Fitness Signature Series Shoulder Press",
    "Life Fitness Signature Series Lateral Raise", "Life Fitness Signature Series Rear Delt",
    "Life Fitness Signature Series Lat Pulldown", "Life Fitness Signature Series Seated Row",
    "Life Fitness Signature Series Low Row", "Life Fitness Signature Series Leg Press",
    "Life Fitness Signature Series Leg Extension", "Life Fitness Signature Series Leg Curl",
    "Life Fitness Signature Series Hack Squat", "Life Fitness Signature Series Calf Raise",
    "Life Fitness Signature Series Bicep Curl", "Life Fitness Signature Series Tricep Extension",
    "Life Fitness Signature Series Abdominal Crunch", "Life Fitness Circuit Series Chest Press",
    "Life Fitness Optima Series Leg Press",
    
    // Hoist
    "Hoist Roc-It Chest Press", "Hoist Roc-It Incline Press", "Hoist Roc-It Pec Fly",
    "Hoist Roc-It Shoulder Press", "Hoist Roc-It Lateral Raise",
    "Hoist Roc-It Lat Pulldown", "Hoist Roc-It Seated Row", "Hoist Roc-It Low Row",
    "Hoist Roc-It Leg Press", "Hoist Roc-It Leg Extension", "Hoist Roc-It Leg Curl",
    "Hoist Roc-It Calf Raise", "Hoist Roc-It Bicep Curl", "Hoist Roc-It Tricep Extension",
    "Hoist Roc-It Abdominal Crunch", "Hoist HD Elite Chest Press",
    
    // Advance
    "Advance Chest Press", "Advance Incline Press", "Advance Pec Fly",
    "Advance Shoulder Press", "Advance Lateral Raise", "Advance Rear Delt",
    "Advance Lat Pulldown", "Advance Seated Row", "Advance Low Row",
    "Advance Leg Press", "Advance Leg Extension", "Advance Leg Curl",
    "Advance Hack Squat", "Advance Calf Raise",
    "Advance Bicep Curl", "Advance Tricep Extension",
    
    // D-rax
    "D-rax Chest Press", "D-rax Incline Press", "D-rax Pec Deck",
    "D-rax Shoulder Press", "D-rax Lateral Raise",
    "D-rax Lat Pulldown", "D-rax Seated Row", "D-rax Low Row",
    "D-rax Leg Press", "D-rax Leg Extension", "D-rax Leg Curl",
    "D-rax Hack Squat", "D-rax Calf Raise",
    "D-rax Bicep Curl", "D-rax Tricep Extension",
    
    // 개선스포츠
    "개선스포츠 Chest Press", "개선스포츠 Incline Press", "개선스포츠 Pec Fly",
    "개선스포츠 Shoulder Press", "개선스포츠 Lateral Raise",
    "개선스포츠 Lat Pulldown", "개선스포츠 Seated Row", "개선스포츠 Low Row",
    "개선스포츠 Leg Press", "개선스포츠 Leg Extension", "개선스포츠 Leg Curl",
    "개선스포츠 Hack Squat", "개선스포츠 Calf Raise",
    "개선스포츠 Bicep Curl", "개선스포츠 Tricep Extension",
    
    // Dynaforce
    "Dynaforce Chest Press", "Dynaforce Incline Press", "Dynaforce Pec Fly",
    "Dynaforce Shoulder Press", "Dynaforce Lateral Raise",
    "Dynaforce Lat Pulldown", "Dynaforce Seated Row", "Dynaforce Low Row",
    "Dynaforce Leg Press", "Dynaforce Leg Extension", "Dynaforce Leg Curl",
    "Dynaforce Hack Squat", "Dynaforce Calf Raise",
    "Dynaforce Bicep Curl", "Dynaforce Tricep Extension",
    
    // 프리웨이트 운동
    "바벨 벤치프레스", "바벨 인클라인 벤치프레스", "바벨 디클라인 벤치프레스",
    "바벨 백스쿼트", "바벨 프론트스쿼트", "바벨 데드리프트", "바벨 루마니안 데드리프트",
    "바벨 오버헤드프레스", "바벨 밀리터���프��스", "바벨 벤트오버로우", "바벨 언더그립로우",
    "바벨 컬", "바벨 클로즈그립 벤치프레스", "바벨 스쿼트 투 프레스",
    
    "덤벨 벤치프레스", "덤벨 인클라인 벤치프레스", "덤벨 플라이", "덤벨 인클라인 플라",
    "덤벨 숄더프레스", "덤벨 레터럴 레이즈", "덤벨 프론트 레이즈", "덤벨 리어 델트 플라이",
    "덤벨 로우", "덤벨 원암 로우", "덤벨 컬", "덤벨 해머컬", "덤벨 트라이셉스 익스텐션",
    "덤벨 킥백", "덤벨 고블릿 스쿼트", "덤벨 런지", "덤벨 불가리안 스플릿 스쿼트",
    
    "스미스머신 벤치프레스", "스미스머신 인클라인 벤치프레스", "스미스머신 스쿼트",
    "스미스머신 숄더프레스", "스미스머신 데드리프트", "스미스머신 런지",
    
    "케이블 크로스오버", "케이블 플라이", "케이블 로우", "케이블 페이스풀",
    "케이블 컬", "케이블 해머컬", "케이블 푸시다운", "케이블 오버헤드 익스텐션",
    "케이블 킥백", "케이블 우드촙", "케이블 팰로프 프레스",
    
    // 맨몸 운동
    "풀업", "친업", "와이드그립 풀업", "딥스", "체스트 딥스", "트라이셉스 딥스",
    "푸쉬업", "와이드 푸쉬업", "다이아몬드 푸쉬업", "인클라인 푸쉬업",
    "플랭크", "사이드 플랭크", "마운틴 클라이머",
    
    // 하체 전문 운동
    "레그프레스", "해크스쿼트", "레그익스텐션", "레그컬", "라잉 레그컬", "시티드 레그컬",
    "런지", "워킹런지", "리버스런지", "스텝업", "레그레이즈",
    "스탠딩 카프레이즈", "시티드 카프레이즈", "돈키 카프레이즈",
    "힙 쓰러스트", "글루트 브릿지", "레그 프레스 카프레이즈",
    
    // 유산소 운동
    "런닝머신", "트레드밀", "사이클", "에어바이크", "스핀바이크",
    "스텝밀", "스텝퍼", "클라이밍머신",
    "로잉머신", "컨셉2 로잉",
    "일립티컬", "크로스트레이너",
    "어썰트 바이크", "에어러너",
    
    // 기능성 운���
    "배틀로프", "케틀벨 스윙", "케틀벨 스내치", "케틀벨 클린", "케틀벨 터키쉬 겟업",
    "박스점프", "버피", "월볼", "메디신볼 슬램", "TRX 로우", "TRX 체스트프레스",
    "슬라이드 보드", "보수볼 스쿼트",
  ];

  const handleExerciseNameChange = (value: string) => {
    setExerciseName(value);
    setRirFeedback(null); // 운동 이름 변경 시 피드백 초기화
    
    if (value.trim().length > 0) {
      const filtered = exerciseDatabase.filter(exercise =>
        exercise.toLowerCase().includes(value.toLowerCase())
      );
      setExerciseSuggestions(filtered.slice(0, 10)); // 최대 10개만 표시
      setShowExerciseSuggestions(true);
    } else {
      setShowExerciseSuggestions(false);
    }
  };

  const selectExercise = (exercise: string) => {
    setExerciseName(exercise);
    setShowExerciseSuggestions(false);
    loadExerciseHistory(exercise);
  };

  const addSet = () => {
    // 현재 세트들이 모두 제대로 입력되었는지 확인
    const hasIncompleteSet = currentSets.some(set => !set.weight || !set.reps || !(set as any).rir);
    
    if (hasIncompleteSet) {
      toast.error("현재 세트의 무게, 개수, RIR을 모두 입력한 후 다음 세트를 추가할 수 있습니다.");
      return;
    }
    
    setCurrentSets([...currentSets, { weight: "", reps: "", rir: "" }]);
  };

  const removeSet = (index: number) => {
    if (currentSets.length > 1) {
      setCurrentSets(currentSets.filter((_, i) => i !== index));
    }
  };

  const updateSet = (index: number, field: "weight" | "reps" | "rir", value: string) => {
    const newSets = [...currentSets] as any[];
    newSets[index][field] = value;
    setCurrentSets(newSets);
  };

  // 유산소 운동량 계산
  const calculateCardioVolume = () => {
    if (cardioMethod === 'rpe') {
      // RPE 기반: 운동 시간(분) × RPE
      const time = parseFloat(cardioTime);
      const rpe = parseFloat(cardioRPE);
      
      if (!time || !rpe) {
        toast.error("운동 시간과 RPE를 모두 입력해주세요.");
        return null;
      }
      
      if (rpe < 1 || rpe > 10) {
        toast.error("RPE는 1~10 사이의 값이어야 합니다.");
        return null;
      }
      
      const volume = time * rpe;
      setCardioVolume(volume);
      return volume;
      
    } else if (cardioMethod === 'trimp') {
      // TRIMP 기반: 운동 시간(분) × 심박 강도 비율
      const time = parseFloat(cardioTime);
      const hrAvg = parseFloat(cardioHRAvg);
      const hrRest = parseFloat(cardioHRRest);
      const hrMax = parseFloat(cardioHRMax);
      
      if (!time || !hrAvg || !hrRest || !hrMax) {
        toast.error("모든 심박수 값과 운동 시간을 입력해주세요.");
        return null;
      }
      
      if (hrAvg <= hrRest || hrMax <= hrRest || hrAvg > hrMax) {
        toast.error("심박수 값을 확인해주세요. (안정시 < 평균 ≤ 최대)");
        return null;
      }
      
      // 심박 강도 비율 = (평균심박수 - 안정시심박수) / (최대심박수 - 안정시심박수)
      const hrIntensity = (hrAvg - hrRest) / (hrMax - hrRest);
      const volume = time * hrIntensity;
      setCardioVolume(volume);
      return volume;
      
    } else if (cardioMethod === 'distance') {
      // 거리 기반: 체중(kg) × 거리(km)
      const distance = parseFloat(cardioDistance);
      const weight = parseFloat(cardioWeight);
      
      if (!distance || !weight) {
        toast.error("거리와 체중을 모두 입력해주세요.");
        return null;
      }
      
      if (distance <= 0 || weight <= 0) {
        toast.error("거리와 체중은 0보다 커야 합니다.");
        return null;
      }
      
      const volume = weight * distance;
      setCardioVolume(volume);
      return volume;
      
    } else if (cardioMethod === 'power') {
      // 파워 기반
      if (powerMethod === 'simple') {
        // 간단한 방식: 평균 파워(W) × 시간(초)
        const power = parseFloat(cardioPower);
        const timeSeconds = parseFloat(cardioTimeSeconds);
        
        if (!power || !timeSeconds) {
          toast.error("평균 파워와 운동 시간을 모두 입력해주세요.");
          return null;
        }
        
        if (power <= 0 || timeSeconds <= 0) {
          toast.error("파워와 시간은 0보다 커야 합니다.");
          return null;
        }
        
        const volume = power * timeSeconds;
        setCardioVolume(volume);
        return volume;
        
      } else if (powerMethod === 'tss') {
        // TSS 방식: (시간 × NP × IF / FTP) × 100
        const timeSeconds = parseFloat(cardioTimeSeconds);
        const np = parseFloat(cardioNP);
        const ifValue = parseFloat(cardioIF);
        const ftp = parseFloat(cardioFTP);
        
        if (!timeSeconds || !np || !ifValue || !ftp) {
          toast.error("모든 TSS ��라미터를 입력해주세요.");
          return null;
        }
        
        if (ftp <= 0) {
          toast.error("FTP는 0보다 커야 합니다.");
          return null;
        }
        
        // TSS = (시간(초) × NP × IF / FTP) × 100
        const tss = (timeSeconds * np * ifValue / ftp) * 100;
        setCardioVolume(tss);
        return tss;
      }
    }
    
    return null;
  };

  // 유산소 운동 폼 초기화
  const clearCardioForm = () => {
    setCardioTime("");
    setCardioRPE("");
    setCardioHRAvg("");
    setCardioHRRest("");
    setCardioHRMax("");
    setCardioDistance("");
    setCardioWeight("");
    setCardioPower("");
    setCardioTimeSeconds("");
    setCardioNP("");
    setCardioIF("");
    setCardioFTP("");
    setCardioVolume(null);
  };

  // 웨어러블 연동 함수들
  const connectWearable = async (platform: string) => {
    setIsLoadingWearableData(true);
    
    try {
      if (platform === 'strava') {
        // Strava OAuth 연동
        const clientId = 'YOUR_STRAVA_CLIENT_ID'; // 사용자가 설정해야 함
        const redirectUri = `${window.location.origin}/strava-callback`;
        const scope = 'read,activity:read_all';
        
        // OAuth URL로 리다이렉트
        const authUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scope}`;
        
        toast.info("Strava 연동을 위해 로그인 페이지로 이동합니다.");
        // window.location.href = authUrl;
        
        // 실제 구현 시에는 OAuth flow 완료 필요
        toast.error("Strava API 연동은 아직 설정이 필요합니다. 설정 방법을 확인해주세요.");
        
      } else if (platform === 'garmin') {
        toast.error("Garmin Connect API 연동은 아직 설정이 필요합니다.");
        
      } else if (platform === 'apple') {
        toast.info("Apple Health는 iOS 앱에서만 지원됩니다. Health 데이터 내보내기 파일(.xml)을 업로드해주세요.");
        
      } else if (platform === 'google') {
        toast.error("Google Fit API 연동은 아직 설정이 필요합니다.");
      }
      
    } catch (error) {
      console.error("Wearable connection error:", error);
      toast.error("웨어러블 기기 연동 중 오류가 발생했습니다.");
    } finally {
      setIsLoadingWearableData(false);
    }
  };

  // 웨��러블에서 최근 운동 데이터 가져오기
  const fetchWearableWorkouts = async () => {
    setIsLoadingWearableData(true);
    
    try {
      // 실제로는 서버를 통해 각 플랫폼 API 호출
      // Mock 데이터로 시연
      const mockWorkouts = [
        {
          name: "런닝",
          date: new Date().toISOString(),
          duration: 30, // 분
          distance: 5.2, // km
          avgHR: 145,
          maxHR: 175,
          calories: 350,
          platform: "strava"
        },
        {
          name: "사이클",
          date: new Date(Date.now() - 86400000).toISOString(),
          duration: 45,
          avgPower: 180,
          maxPower: 250,
          distance: 20,
          calories: 520,
          platform: "garmin"
        }
      ];
      
      // 실제 구현 예시:
      // const response = await fetch(`${supabaseUrl}/functions/v1/make-server-2c29cd73/wearable/workouts`, {
      //   headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      // });
      // const workouts = await response.json();
      
      return mockWorkouts;
      
    } catch (error) {
      console.error("Failed to fetch wearable workouts:", error);
      toast.error("운동 데이터를 가져오는데 실패했습니다.");
      return [];
    } finally {
      setIsLoadingWearableData(false);
    }
  };

  // 웨어러블 운동 데이터를 폼에 자동 입력
  const loadWorkoutFromWearable = async (workout: any) => {
    setExerciseName(workout.name || "");
    
    // 거리 기반 운동인 경우
    if (workout.distance && (workout.name.includes("런닝") || workout.name.includes("걷기"))) {
      setCardioMethod('distance');
      setCardioDistance(workout.distance.toString());
      // 체중은 사용자 프로필에서 가져와야 함 (임시로 70kg)
      setCardioWeight("70");
    }
    // 파워 데이터가 있는 경우
    else if (workout.avgPower) {
      setCardioMethod('power');
      setPowerMethod('simple');
      setCardioPower(workout.avgPower.toString());
      setCardioTimeSeconds((workout.duration * 60).toString()); // 분을 초로 변환
    }
    // 심박수 데이터가 있는 경우
    else if (workout.avgHR && workout.maxHR) {
      setCardioMethod('trimp');
      setCardioTime(workout.duration.toString());
      setCardioHRAvg(workout.avgHR.toString());
      setCardioHRMax(workout.maxHR.toString());
      setCardioHRRest("60"); // 기본값
    }
    // RPE 기반으로 기본 설정
    else {
      setCardioMethod('rpe');
      setCardioTime(workout.duration.toString());
      setCardioRPE("7"); // 기본 RPE
    }
    
    setShowWearableDialog(false);
    toast.success(`${workout.name} 운동 데이터를 불러왔습니다!`);
  };

  // 운동 단계별 추천 생성
  const generateTrainingRecommendation = (phase: string, current1RM: number | null) => {
    if (!phase) {
      setTrainingRecommendation(null);
      return;
    }

    const recommendations: { [key: string]: any } = {
      "안정화/근지구력": {
        reps: "12-20회",
        sets: "1-3세트",
        intensity: "50-70% 1RM",
        tempo: "4-2-1 (느린 템포)",
        rest: "0-90초",
      },
      "근지구력": {
        reps: "8-12회 (슈퍼세트)",
        sets: "2-4세트",
        intensity: "70-80% 1RM",
        tempo: "2-0-2 + 4-2-1 혼합",
        rest: "0-60초",
      },
      "근비대": {
        reps: "6-12회",
        sets: "3-6세트",
        intensity: "75-85% 1RM",
        tempo: "2-0-2 (보통 속도)",
        rest: "0-60초",
      },
      "최대근력": {
        reps: "1-5회",
        sets: "4-6세트",
        intensity: "85-100% 1RM",
        tempo: "폭발적 (가능한 빠르게)",
        rest: "3-5분",
      },
      "파워": {
        reps: "1-10회 (주로 3-5회)",
        sets: "3-6세트",
        intensity: "30-45% 상체 / 0-60% 하체",
        tempo: "폭발적",
        rest: "3-5분",
      },
    };

    const rec = recommendations[phase];
    if (!rec) {
      setTrainingRecommendation(null);
      return;
    }

    let weightRecommendation = "";
    if (current1RM && current1RM > 0) {
      switch (phase) {
        case "안정화/근지구력":
          const stabilityMin = Math.round(current1RM * 0.5);
          const stabilityMax = Math.round(current1RM * 0.7);
          weightRecommendation = `약 ${stabilityMin}-${stabilityMax}kg`;
          break;
        case "근지구력":
          const enduranceMin = Math.round(current1RM * 0.7);
          const enduranceMax = Math.round(current1RM * 0.8);
          weightRecommendation = `약 ${enduranceMin}-${enduranceMax}kg`;
          break;
        case "근비대":
          const hypertrophyMin = Math.round(current1RM * 0.75);
          const hypertrophyMax = Math.round(current1RM * 0.85);
          weightRecommendation = `약 ${hypertrophyMin}-${hypertrophyMax}kg`;
          break;
        case "최대근력":
          const strengthMin = Math.round(current1RM * 0.85);
          const strengthMax = Math.round(current1RM * 1.0);
          weightRecommendation = `약 ${strengthMin}-${strengthMax}kg`;
          break;
        case "파워":
          const powerMin = Math.round(current1RM * 0.3);
          const powerMax = Math.round(current1RM * 0.6);
          weightRecommendation = `약 ${powerMin}-${powerMax}kg (상체는 더 가볍게)`;
          break;
      }
    } else {
      weightRecommendation = "1RM 기록을 먼저 쌓아주세요";
    }

    setTrainingRecommendation({
      reps: rec.reps,
      sets: rec.sets,
      intensity: rec.intensity,
      weight: weightRecommendation,
      tempo: rec.tempo,
      rest: rec.rest,
    });
  };

  const addExercise = async () => {
    if (!exerciseName.trim()) {
      toast.error("운동 이름을 입력해주세요.");
      return;
    }

    let newExercise: Exercise;

    // 유산소 운동인 경우
    if (isCardio) {
      const volume = calculateCardioVolume();
      if (volume === null) {
        return; // 에러는 calculateCardioVolume에서 처리됨
      }

      newExercise = {
        name: exerciseName,
        sets: [], // 유산소는 세트 없음
        cardioMethod,
        cardioVolume: volume,
      };

      // RPE 방식일 경우
      if (cardioMethod === 'rpe') {
        newExercise.cardioTime = parseFloat(cardioTime);
        newExercise.cardioRPE = parseFloat(cardioRPE);
      }
      // TRIMP 방식일 경우
      else if (cardioMethod === 'trimp') {
        newExercise.cardioTime = parseFloat(cardioTime);
        newExercise.cardioHRAvg = parseFloat(cardioHRAvg);
        newExercise.cardioHRRest = parseFloat(cardioHRRest);
        newExercise.cardioHRMax = parseFloat(cardioHRMax);
      }
      // 거리 기반일 경우
      else if (cardioMethod === 'distance') {
        newExercise.cardioDistance = parseFloat(cardioDistance);
        newExercise.cardioWeight = parseFloat(cardioWeight);
      }
      // 파워 기반일 경우
      else if (cardioMethod === 'power') {
        newExercise.cardioTimeSeconds = parseFloat(cardioTimeSeconds);
        if (powerMethod === 'simple') {
          newExercise.cardioPower = parseFloat(cardioPower);
        } else if (powerMethod === 'tss') {
          newExercise.cardioNP = parseFloat(cardioNP);
          newExercise.cardioIF = parseFloat(cardioIF);
          newExercise.cardioFTP = parseFloat(cardioFTP);
        }
      }
    } 
    // 웨이트 운동인 경우
    else {
      // 세트가 하나라도 있는지 확인
      if (currentSets.length === 0) {
        toast.error("최소 1개 세트를 입력해주세요.");
        return;
      }

      // 모든 세트가 완전히 입력되었는지 확인
      const incompleteSets = currentSets.filter(set => !set.weight || !set.reps || !(set as any).rir);
      if (incompleteSets.length > 0) {
        toast.error("모든 세트의 무게, 개수, RIR을 입력해주세요.");
        return;
      }

      newExercise = {
        name: exerciseName,
        trainingPhase: trainingPhase || undefined,
        sets: currentSets.map(set => ({ 
          weight: parseFloat(set.weight), 
          reps: parseFloat(set.reps),
          rir: parseFloat((set as any).rir)
        })),
      };

      // 웨이트 운동인 경우 최고 무게 갱신 체크
      const maxWeight = Math.max(...newExercise.sets.map(set => set.weight));
      
      // 같은 운동의 과거 기록에서 최고 무게 찾기
      const sameExerciseHistory = exerciseHistory.filter(
        (record: any) => record.exercise.name === exerciseName
      );
      
      let previousMaxWeight = 0;
      sameExerciseHistory.forEach((record: any) => {
        if (record.exercise.sets && record.exercise.sets.length > 0) {
          const recordMaxWeight = Math.max(...record.exercise.sets.map((set: any) => set.weight));
          if (recordMaxWeight > previousMaxWeight) {
            previousMaxWeight = recordMaxWeight;
          }
        }
      });

      // 기록 갱신 확인
      if (previousMaxWeight === 0) {
        // 첫 무게 등록
        const message = getPersonalRecordMessage(userGender);
        setTimeout(() => {
          toast.success(`🎉 ${message}`, { duration: 5000 });
        }, 500);
      } else if (maxWeight > previousMaxWeight) {
        // 기존 기록 갱신
        const message = getPersonalRecordMessage(userGender);
        setTimeout(() => {
          toast.success(`🎉 ${message}`, { duration: 5000 });
        }, 500);
      }
    }

    setExercises([...exercises, newExercise]);
    setExerciseName("");
    setTrainingPhase("");
    setCurrentSets([{ weight: "", reps: "", rir: "" } as any]);
    setRirFeedback(null);
    clearCardioForm();
    toast.success("운동이 추가되었습니다!");
    
    // 자동 저장
    setTimeout(async () => {
      await handleSave(undefined, true);
    }, 100);
  };

  const removeExercise = async (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
    toast.success("운동이 삭제되었습니다!");
    
    // 자동 저장
    setTimeout(async () => {
      await handleSave(undefined, true);
    }, 100);
  };

  const startEditingExercise = (index: number) => {
    const exercise = exercises[index];
    setExerciseName(exercise.name);
    
    // 유산소 운동인 경우
    if (exercise.cardioMethod) {
      setCardioMethod(exercise.cardioMethod);
      setCardioVolume(exercise.cardioVolume || null);
      
      if (exercise.cardioMethod === 'rpe') {
        setCardioTime(exercise.cardioTime?.toString() || "");
        setCardioRPE(exercise.cardioRPE?.toString() || "");
      } else if (exercise.cardioMethod === 'trimp') {
        setCardioTime(exercise.cardioTime?.toString() || "");
        setCardioHRAvg(exercise.cardioHRAvg?.toString() || "");
        setCardioHRRest(exercise.cardioHRRest?.toString() || "");
        setCardioHRMax(exercise.cardioHRMax?.toString() || "");
      } else if (exercise.cardioMethod === 'distance') {
        setCardioDistance(exercise.cardioDistance?.toString() || "");
        setCardioWeight(exercise.cardioWeight?.toString() || "");
      } else if (exercise.cardioMethod === 'power') {
        setCardioTimeSeconds(exercise.cardioTimeSeconds?.toString() || "");
        if (exercise.cardioPower) {
          setPowerMethod('simple');
          setCardioPower(exercise.cardioPower?.toString() || "");
        } else {
          setPowerMethod('tss');
          setCardioNP(exercise.cardioNP?.toString() || "");
          setCardioIF(exercise.cardioIF?.toString() || "");
          setCardioFTP(exercise.cardioFTP?.toString() || "");
        }
      }
    } 
    // 웨이트 운동인 경우
    else {
      setTrainingPhase(exercise.trainingPhase || "");
      setCurrentSets(exercise.sets.map(set => ({ 
        weight: set.weight.toString(), 
        reps: set.reps.toString(),
        rir: set.rir ? set.rir.toString() : ""
      })) as any);
    }
    
    setEditingExerciseIndex(index);
  };

  const updateExercise = async () => {
    if (editingExerciseIndex === null) return;
    
    if (!exerciseName.trim()) {
      toast.error("운동 이름을 입력해주세요.");
      return;
    }

    let updatedExercise: Exercise;

    // 유산소 운동인 경우
    if (isCardio) {
      const volume = calculateCardioVolume();
      if (volume === null) {
        return;
      }

      updatedExercise = {
        name: exerciseName,
        sets: [],
        cardioMethod,
        cardioVolume: volume,
      };

      if (cardioMethod === 'rpe') {
        updatedExercise.cardioTime = parseFloat(cardioTime);
        updatedExercise.cardioRPE = parseFloat(cardioRPE);
      } else if (cardioMethod === 'trimp') {
        updatedExercise.cardioTime = parseFloat(cardioTime);
        updatedExercise.cardioHRAvg = parseFloat(cardioHRAvg);
        updatedExercise.cardioHRRest = parseFloat(cardioHRRest);
        updatedExercise.cardioHRMax = parseFloat(cardioHRMax);
      } else if (cardioMethod === 'distance') {
        updatedExercise.cardioDistance = parseFloat(cardioDistance);
        updatedExercise.cardioWeight = parseFloat(cardioWeight);
      } else if (cardioMethod === 'power') {
        updatedExercise.cardioTimeSeconds = parseFloat(cardioTimeSeconds);
        if (powerMethod === 'simple') {
          updatedExercise.cardioPower = parseFloat(cardioPower);
        } else if (powerMethod === 'tss') {
          updatedExercise.cardioNP = parseFloat(cardioNP);
          updatedExercise.cardioIF = parseFloat(cardioIF);
          updatedExercise.cardioFTP = parseFloat(cardioFTP);
        }
      }
    }
    // 웨이트 운동인 경우
    else {
      // 세트가 하나라도 있는지 확인
      if (currentSets.length === 0) {
        toast.error("최소 1개 세트를 입력해주세요.");
        return;
      }

      // 모든 세트가 완전히 입력되었는지 확인
      const incompleteSets = currentSets.filter(set => !set.weight || !set.reps || !(set as any).rir);
      if (incompleteSets.length > 0) {
        toast.error("모든 세트의 무게, 개수, RIR을 입력해주세요.");
        return;
      }

      updatedExercise = {
        name: exerciseName,
        trainingPhase: trainingPhase || undefined,
        sets: currentSets.map(set => ({ 
          weight: parseFloat(set.weight), 
          reps: parseFloat(set.reps),
          rir: parseFloat((set as any).rir)
        })),
      };
    }

    const updatedExercises = [...exercises];
    updatedExercises[editingExerciseIndex] = updatedExercise;
    setExercises(updatedExercises);
    
    setExerciseName("");
    setTrainingPhase("");
    setCurrentSets([{ weight: "", reps: "", rir: "" } as any]);
    setEditingExerciseIndex(null);
    setRirFeedback(null);
    clearCardioForm();
    toast.success("운동이 수정되었습니다!");
    
    // 자동 저장
    setTimeout(async () => {
      await handleSave(undefined, true);
    }, 100);
  };

  const cancelEditingExercise = () => {
    setExerciseName("");
    setTrainingPhase("");
    setCurrentSets([{ weight: "", reps: "", rir: "" } as any]);
    setEditingExerciseIndex(null);
    setRirFeedback(null);
    clearCardioForm();
  };

  const handleSave = async (totalMinutes?: number, silent = false) => {
    setIsSaving(true);
    try {
      const logData = {
        date: selectedDate,
        foods,
        exercises,
        totalWorkoutTime: totalMinutes !== undefined ? totalMinutes : Math.floor(elapsedTime / 60), // 총 운동 시간 (분)
      };

      const response = await fetch(`${supabaseUrl}/functions/v1/make-server-2c29cd73/daily-log`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(logData),
      });

      if (response.ok) {
        if (!silent) {
          toast.success("일일 기록이 저장되었습니다!");
        }
      } else {
        if (!silent) {
          toast.error("기록 저장에 실패했습니다.");
        }
      }
    } catch (error) {
      console.error("Error saving daily log:", error);
      if (!silent) {
        toast.error("기록 저장 중 오류가 발생했습니다.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const totalNutrition = foods.reduce(
    (acc, food) => ({
      calories: acc.calories + food.calories,
      protein: acc.protein + food.protein,
      carbs: acc.carbs + food.carbs,
      fat: acc.fat + food.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const totalExerciseTime = exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const totalVolume = exercises.reduce((acc, ex) => acc + ex.sets.reduce((setAcc, set) => setAcc + set.weight * set.reps, 0), 0);
  
  // 운동 강도 계산 (kg/분)
  const totalMinutes = elapsedTime / 60;
  const exerciseIntensity = totalMinutes > 0 ? totalVolume / totalMinutes : 0;
  
  // 평균 RIR 계산
  const allRirValues = exercises.flatMap(ex => ex.sets.map(set => set.rir).filter(rir => rir !== undefined && rir !== null)) as number[];
  const averageRir = allRirValues.length > 0 ? allRirValues.reduce((sum, rir) => sum + rir, 0) / allRirValues.length : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 p-4 bg-white rounded-lg border">
        <Label htmlFor="date-select" className="font-semibold whitespace-nowrap">날짜 선택</Label>
        <Input
          id="date-select"
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="max-w-[200px]"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 음식 기록 */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-orange-600" />
                  <CardTitle>음식 기록</CardTitle>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFoodList(!showFoodList)}
                >
                  {showFoodList ? "숨기기" : "자세히 보기"}
                </Button>
              </div>
            </CardHeader>
          {showFoodList && (
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="food-name">음식 이름</Label>
                <Input
                  id="food-name"
                  placeholder="예: 닭가슴살"
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="food-calories">칼로리 (kcal)</Label>
                  <Input
                    id="food-calories"
                    type="number"
                    placeholder="200"
                    value={foodCalories}
                    onChange={(e) => setFoodCalories(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="food-protein">단백질 (g)</Label>
                  <Input
                    id="food-protein"
                    type="number"
                    placeholder="30"
                    value={foodProtein}
                    onChange={(e) => setFoodProtein(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="food-carbs">탄수화물 (g)</Label>
                  <Input
                    id="food-carbs"
                    type="number"
                    placeholder="0"
                    value={foodCarbs}
                    onChange={(e) => setFoodCarbs(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="food-fat">지방 (g)</Label>
                  <Input
                    id="food-fat"
                    type="number"
                    placeholder="5"
                    value={foodFat}
                    onChange={(e) => setFoodFat(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={analyzeFoodWithAI} className="w-full" disabled={isAnalyzing}>
                <Sparkles className="w-4 h-4 mr-2" />
                AI 분석
              </Button>
              {editingFoodIndex === null ? (
                <div className="flex gap-2">
                  <Button onClick={addFood} className="flex-1">
                    <Plus className="w-4 h-4 mr-2" />
                    음식 추가
                  </Button>
                  <Button onClick={clearFoodForm} variant="outline" className="w-20">
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={updateFood} className="flex-1">
                    <Save className="w-4 h-4 mr-2" />
                    수정 완료
                  </Button>
                  <Button onClick={cancelEditingFood} variant="outline" className="flex-1">
                    취소
                  </Button>
                </div>
              )}
            </div>

            {/* 추가된 음식 목록 */}
            {foods.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">오늘 섭취한 음식</h4>
                <div className="space-y-2">
                  {foods.map((food, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{food.name}</p>
                        <p className="text-xs text-gray-600">
                          {food.calories}kcal | P: {food.protein}g | C: {food.carbs}g | F: {food.fat}g
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditingFood(index)}
                        >
                          <Edit className="w-4 h-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFood(index)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
          )}
          </Card>

          {/* 목표 대비 실제 섭취량 대시보드 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-600" />
                  <CardTitle>목표 대비 섭취량</CardTitle>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNutritionGoal(!showNutritionGoal)}
                >
                  {showNutritionGoal ? "숨기기" : "자세히 보기"}
                </Button>
              </div>
              <CardDescription>프로필에서 설정한 목표 영양소와 비교</CardDescription>
            </CardHeader>
            {showNutritionGoal && (
            <CardContent>
              {isLoadingGoals ? (
                <div className="text-center py-8 text-gray-500">
                  목표 영양소 로딩 중...
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                {/* 칼로리 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">칼로리</span>
                    {goalCalories > 0 && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        totalNutrition.calories >= goalCalories 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {totalNutrition.calories >= goalCalories ? '달성' : '부족'}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-gray-900">
                      {totalNutrition.calories.toFixed(0)}
                    </div>
                    <div className="text-xs text-gray-500">
                      / {goalCalories > 0 ? goalCalories.toFixed(0) : '목표 미설정'}kcal
                    </div>
                    {goalCalories > 0 ? (
                      <>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${
                              totalNutrition.calories >= goalCalories 
                                ? 'bg-green-500' 
                                : 'bg-orange-500'
                            }`}
                            style={{ width: `${Math.min((totalNutrition.calories / goalCalories) * 100, 100)}%` }}
                          />
                        </div>
                        {totalNutrition.calories >= goalCalories ? (
                          <div className="bg-blue-50 border border-blue-200 rounded px-2 py-1.5 mt-2">
                            <div className="text-sm font-bold text-blue-700">
                              +{(totalNutrition.calories - goalCalories).toFixed(0)}kcal 초과
                            </div>
                          </div>
                        ) : (
                          <div className="bg-red-50 border border-red-200 rounded px-2 py-1.5 mt-2">
                            <div className="text-sm font-bold text-red-700">
                              {(goalCalories - totalNutrition.calories).toFixed(0)}kcal 부족
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 rounded px-2 py-1.5 mt-2">
                        <p className="text-xs text-gray-600">프로필에서 목표 설정 필요</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 단백질 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">단백질</span>
                    {goalProtein > 0 && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        totalNutrition.protein >= goalProtein 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {totalNutrition.protein >= goalProtein ? '달성' : '부족'}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-gray-900">
                      {totalNutrition.protein.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-500">
                      / {goalProtein > 0 ? goalProtein.toFixed(1) : '목표 미설정'}g
                    </div>
                    {goalProtein > 0 ? (
                      <>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${
                              totalNutrition.protein >= goalProtein 
                                ? 'bg-green-500' 
                                : 'bg-orange-500'
                            }`}
                            style={{ width: `${Math.min((totalNutrition.protein / goalProtein) * 100, 100)}%` }}
                          />
                        </div>
                        {totalNutrition.protein >= goalProtein ? (
                          <div className="bg-blue-50 border border-blue-200 rounded px-2 py-1.5 mt-2">
                            <div className="text-sm font-bold text-blue-700">
                              +{(totalNutrition.protein - goalProtein).toFixed(1)}g 초과
                            </div>
                          </div>
                        ) : (
                          <div className="bg-red-50 border border-red-200 rounded px-2 py-1.5 mt-2">
                            <div className="text-sm font-bold text-red-700">
                              {(goalProtein - totalNutrition.protein).toFixed(1)}g 부족
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 rounded px-2 py-1.5 mt-2">
                        <p className="text-xs text-gray-600">프로필에서 목표 설정 필요</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 탄수화물 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">탄수화물</span>
                    {goalCarbs > 0 && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        totalNutrition.carbs >= goalCarbs 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {totalNutrition.carbs >= goalCarbs ? '달성' : '부족'}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-gray-900">
                      {totalNutrition.carbs.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-500">
                      / {goalCarbs > 0 ? goalCarbs.toFixed(1) : '목표 미설정'}g
                    </div>
                    {goalCarbs > 0 ? (
                      <>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${
                              totalNutrition.carbs >= goalCarbs 
                                ? 'bg-green-500' 
                                : 'bg-orange-500'
                            }`}
                            style={{ width: `${Math.min((totalNutrition.carbs / goalCarbs) * 100, 100)}%` }}
                          />
                        </div>
                        {totalNutrition.carbs >= goalCarbs ? (
                          <div className="bg-blue-50 border border-blue-200 rounded px-2 py-1.5 mt-2">
                            <div className="text-sm font-bold text-blue-700">
                              +{(totalNutrition.carbs - goalCarbs).toFixed(1)}g 초과
                            </div>
                          </div>
                        ) : (
                          <div className="bg-red-50 border border-red-200 rounded px-2 py-1.5 mt-2">
                            <div className="text-sm font-bold text-red-700">
                              {(goalCarbs - totalNutrition.carbs).toFixed(1)}g 부족
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 rounded px-2 py-1.5 mt-2">
                        <p className="text-xs text-gray-600">지방 목표 설정 필요</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 지방 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">지방</span>
                    {goalFat > 0 && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        totalNutrition.fat >= goalFat 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {totalNutrition.fat >= goalFat ? '달성' : '부족'}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-gray-900">
                      {totalNutrition.fat.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-500">
                      / {goalFat > 0 ? goalFat.toFixed(1) : '목표 미설정'}g
                    </div>
                    {goalFat > 0 ? (
                      <>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${
                              totalNutrition.fat >= goalFat 
                                ? 'bg-green-500' 
                                : 'bg-orange-500'
                            }`}
                            style={{ width: `${Math.min((totalNutrition.fat / goalFat) * 100, 100)}%` }}
                          />
                        </div>
                        {totalNutrition.fat >= goalFat ? (
                          <div className="bg-blue-50 border border-blue-200 rounded px-2 py-1.5 mt-2">
                            <div className="text-sm font-bold text-blue-700">
                              +{(totalNutrition.fat - goalFat).toFixed(1)}g 초과
                            </div>
                          </div>
                        ) : (
                          <div className="bg-red-50 border border-red-200 rounded px-2 py-1.5 mt-2">
                            <div className="text-sm font-bold text-red-700">
                              {(goalFat - totalNutrition.fat).toFixed(1)}g 부족
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 rounded px-2 py-1.5 mt-2">
                        <p className="text-xs text-gray-600">프로필에서 목표 설정 필���</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          )}
          </Card>
        </div>

        {/* 운동 기록 */}
        <Card id="workout-log-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-purple-600" />
                <CardTitle>운동 기록</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <WorkoutLogShareButton 
                  elementId="workout-log-card"
                  userName={userName}
                  selectedDate={selectedDate}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowExerciseLog(!showExerciseLog)}
                >
                  {showExerciseLog ? "숨기기" : "자세히 보기"}
                </Button>
              </div>
            </div>
          </CardHeader>
          {showExerciseLog && (
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {/* 스탑워치 */}
              <div className="space-y-3 p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600 mb-2">운동 시간</p>
                  <p className="text-4xl font-bold text-purple-900 font-mono tracking-wider">
                    {formatTime(elapsedTime)}
                  </p>
                </div>
                <div className="flex gap-2">
                  {!hasStartedWorkout ? (
                    <Button onClick={startWorkout} className="w-full bg-green-600 hover:bg-green-700">
                      <Play className="w-4 h-4 mr-2" />
                      운동 시작
                    </Button>
                  ) : (
                    <>
                      {!isRunning ? (
                        <Button onClick={() => setIsRunning(true)} className="flex-1 bg-green-600 hover:bg-green-700">
                          <Play className="w-4 h-4 mr-2" />
                          재개
                        </Button>
                      ) : (
                        <Button onClick={pauseWorkout} className="flex-1 bg-yellow-600 hover:bg-yellow-700">
                          <Pause className="w-4 h-4 mr-2" />
                          일시정지
                        </Button>
                      )}
                      <Button onClick={resetWorkout} variant="outline" className="flex-1">
                        <RotateCcw className="w-4 h-4 mr-2" />
                        리셋
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* 운동 피드백 섹션 */}
              <div className="space-y-3 p-4 bg-gradient-to-br from-green-50 to-teal-50 rounded-lg border border-green-200">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Target className="w-4 h-4 text-green-600" />
                  운동 피드백
                </h4>
                
                {exerciseName ? (
                  <div className="space-y-3">
                    {/* 1RM 최고 기록 */}
                    {oneRM && (
                      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-orange-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl">🏆</span>
                          <h5 className="font-bold text-orange-900 text-sm">1RM 최고 기록</h5>
                        </div>
                        <p className="text-xs font-semibold text-orange-800">
                          {userName}님의 1RM은 {new Date(oneRM.date).toLocaleDateString('ko-KR', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })} <span className="text-base font-bold text-orange-600">{oneRM.weight}kg</span>이 최고 기록입니다.
                        </p>
                      </div>
                    )}

                    {/* RIR 피드백 */}
                    {rirFeedback && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Target className="w-4 h-4 text-blue-600" />
                          <span className="font-semibold text-blue-900 text-xs">세트 추천</span>
                        </div>
                        <p className="text-xs text-blue-800">{rirFeedback}</p>
                      </div>
                    )}

                    {/* 운동 단계별 추천 */}
                    {trainingRecommendation && (
                      <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">🎯</span>
                          <h5 className="font-bold text-purple-900 text-sm">{trainingPhase} 단계 추천</h5>
                        </div>
                        <div className="space-y-2 text-xs">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-white rounded p-2">
                              <div className="text-gray-600 font-medium mb-1">목표 반복수</div>
                              <div className="text-purple-900 font-bold">{trainingRecommendation.reps}</div>
                            </div>
                            <div className="bg-white rounded p-2">
                              <div className="text-gray-600 font-medium mb-1">목표 세트수</div>
                              <div className="text-purple-900 font-bold">{trainingRecommendation.sets}</div>
                            </div>
                          </div>
                          <div className="bg-white rounded p-2">
                            <div className="text-gray-600 font-medium mb-1">도전 무게</div>
                            <div className="text-purple-900 font-bold">{trainingRecommendation.weight}</div>
                            <div className="text-gray-500 text-xs mt-0.5">({trainingRecommendation.intensity})</div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-white rounded p-2">
                              <div className="text-gray-600 font-medium mb-1">템포</div>
                              <div className="text-purple-900 font-semibold">{trainingRecommendation.tempo}</div>
                            </div>
                            <div className="bg-white rounded p-2">
                              <div className="text-gray-600 font-medium mb-1">휴식 시간</div>
                              <div className="text-purple-900 font-semibold">{trainingRecommendation.rest}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 최근 운동 기록 */}
                    {exerciseHistory.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="font-semibold text-xs text-gray-700 flex items-center gap-1">
                          <History className="w-3 h-3" />
                          최근 30일 운동 기록 ({exerciseHistory.length}회)
                        </h5>
                        <div className="max-h-96 overflow-y-auto space-y-2">
                          {exerciseHistory.map((record, index) => {
                            const totalVolume = record.sets.reduce((sum: number, set: any) => sum + (set.weight * set.reps), 0);
                            const rirValues = record.sets.map((set: any) => set.rir).filter((rir: any) => rir !== undefined && rir !== null);
                            const avgRir = rirValues.length > 0 ? rirValues.reduce((sum: number, rir: number) => sum + rir, 0) / rirValues.length : null;
                            
                            return (
                              <div key={index} className="border rounded-lg p-2 space-y-1 bg-white">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold text-purple-900">
                                    {new Date(record.date).toLocaleDateString('ko-KR', { 
                                      year: 'numeric',
                                      month: 'short', 
                                      day: 'numeric',
                                      weekday: 'short'
                                    })}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    {avgRir !== null && (
                                      <span className="text-xs font-semibold text-emerald-700">
                                        평균 RIR: {avgRir.toFixed(1)}
                                      </span>
                                    )}
                                    <span className="text-xs font-semibold text-purple-700">
                                      총 볼륨: {totalVolume.toLocaleString()}kg
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="space-y-1">
                                  {record.sets.map((set: any, setIndex: number) => (
                                    <div key={setIndex} className="flex items-center justify-between text-xs bg-gray-50 p-1 rounded">
                                      <span className="text-gray-600">세트 {setIndex + 1}</span>
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">{set.weight}kg × {set.reps}개</span>
                                        {set.rir !== undefined && set.rir !== null && (
                                          <span className="text-emerald-600 font-semibold">RIR: {set.rir}</span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {isLoadingHistory && (
                      <div className="flex items-center justify-center py-3">
                        <p className="text-xs text-gray-500">기록을 불러오는 중...</p>
                      </div>
                    )}

                    {!isLoadingHistory && exerciseHistory.length === 0 && !oneRM && (
                      <div className="text-center py-3 text-xs text-gray-500">
                        <History className="w-6 h-6 mx-auto mb-1 text-gray-400" />
                        <p>아직 {exerciseName}의 기록이 없습니다.</p>
                        <p className="text-xs mt-1">첫 번째 기록을 남겨보세요!</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 text-xs text-gray-500">
                    <Target className="w-6 h-6 mx-auto mb-1 text-gray-400" />
                    <p>운동 이름을 선택하면</p>
                    <p>과거 기록과 피드백이 표시됩니다</p>
                  </div>
                )}
              </div>

              <div className="space-y-2 relative">
                <Label htmlFor="exercise-name">운동 이름</Label>
                <Input
                  id="exercise-name"
                  placeholder="예: 벤치프레스"
                  value={exerciseName}
                  onChange={(e) => handleExerciseNameChange(e.target.value)}
                  onFocus={() => {
                    if (exerciseName.trim().length > 0) setShowExerciseSuggestions(true);
                  }}
                  onBlur={() => {
                    // 약간의 지연을 주어 클릭 이벤트가 먼저 처리되도록
                    setTimeout(() => setShowExerciseSuggestions(false), 200);
                  }}
                />
                {showExerciseSuggestions && exerciseSuggestions.length > 0 && (
                  <div className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5">
                    {exerciseSuggestions.map((exercise, index) => (
                      <div
                        key={index}
                        className="cursor-pointer select-none px-4 py-2 hover:bg-gray-100"
                        onClick={() => selectExercise(exercise)}
                      >
                        {exercise}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* RIR 피드백 */}
                {rirFeedback && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      <span>{rirFeedback}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 유산소 운동 입력 폼 */}
              {isCardio ? (
                <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-900 font-semibold">
                      <Dumbbell className="w-5 h-5" />
                      <span>유산소 운동량 입력</span>
                    </div>
                    
                    {/* 웨어러블 연동 버튼 */}
                    <Dialog open={showWearableDialog} onOpenChange={setShowWearableDialog}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="gap-2"
                        >
                          <Watch className="w-4 h-4" />
                          웨어러블 연동
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Watch className="w-5 h-5" />
                            웨어러블 기기 연동
                          </DialogTitle>
                          <DialogDescription>
                            운동 기록을 자동으로 불러와 입력 폼에 채워줍니다.
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-6">
                          {/* 플랫폼 연결 */}
                          <div className="space-y-3">
                            <h3 className="font-semibold text-sm">플랫폼 연결</h3>
                            <div className="grid grid-cols-2 gap-3">
                              <Button
                                variant="outline"
                                className="h-auto py-4 flex flex-col gap-2"
                                onClick={() => connectWearable('strava')}
                                disabled={isLoadingWearableData}
                              >
                                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                                  <Link className="w-6 h-6 text-white" />
                                </div>
                                <span className="font-semibold">Strava</span>
                                <span className="text-xs text-gray-500">러닝, 사이클</span>
                              </Button>
                              
                              <Button
                                variant="outline"
                                className="h-auto py-4 flex flex-col gap-2"
                                onClick={() => connectWearable('garmin')}
                                disabled={isLoadingWearableData}
                              >
                                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                                  <Watch className="w-6 h-6 text-white" />
                                </div>
                                <span className="font-semibold">Garmin</span>
                                <span className="text-xs text-gray-500">다양한 운동</span>
                              </Button>
                              
                              <Button
                                variant="outline"
                                className="h-auto py-4 flex flex-col gap-2"
                                onClick={() => connectWearable('apple')}
                                disabled={isLoadingWearableData}
                              >
                                <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center">
                                  <Watch className="w-6 h-6 text-white" />
                                </div>
                                <span className="font-semibold">Apple Health</span>
                                <span className="text-xs text-gray-500">iOS 전용</span>
                              </Button>
                              
                              <Button
                                variant="outline"
                                className="h-auto py-4 flex flex-col gap-2"
                                onClick={() => connectWearable('google')}
                                disabled={isLoadingWearableData}
                              >
                                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                                  <Watch className="w-6 h-6 text-white" />
                                </div>
                                <span className="font-semibold">Google Fit</span>
                                <span className="text-xs text-gray-500">Android 전용</span>
                              </Button>
                            </div>
                          </div>
                          
                          {/* 최근 운동 목록 (Mock) */}
                          <div className="space-y-3">
                            <h3 className="font-semibold text-sm">최근 운동 기록 (데모)</h3>
                            <div className="space-y-2">
                              <div 
                                className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition"
                                onClick={() => loadWorkoutFromWearable({
                                  name: "런닝",
                                  duration: 30,
                                  distance: 5.2,
                                  avgHR: 145,
                                  maxHR: 175,
                                  platform: "strava"
                                })}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-semibold">런닝 🏃</div>
                                    <div className="text-xs text-gray-500">
                                      30분 • 5.2km • 평균 심박수 145bpm
                                    </div>
                                  </div>
                                  <Download className="w-4 h-4 text-blue-600" />
                                </div>
                              </div>
                              
                              <div 
                                className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition"
                                onClick={() => loadWorkoutFromWearable({
                                  name: "사이클",
                                  duration: 45,
                                  avgPower: 180,
                                  distance: 20,
                                  platform: "garmin"
                                })}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-semibold">사이클 ����</div>
                                    <div className="text-xs text-gray-500">
                                      45분 • 20km • 평균 파워 180W
                                    </div>
                                  </div>
                                  <Download className="w-4 h-4 text-blue-600" />
                                </div>
                              </div>

                              <div 
                                className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition"
                                onClick={() => loadWorkoutFromWearable({
                                  name: "걷기",
                                  duration: 60,
                                  distance: 4.5,
                                  avgHR: 110,
                                  maxHR: 130,
                                  platform: "apple"
                                })}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-semibold">걷기 🚶</div>
                                    <div className="text-xs text-gray-500">
                                      60분 • 4.5km • 평균 심박수 110bpm
                                    </div>
                                  </div>
                                  <Download className="w-4 h-4 text-blue-600" />
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* 안내 메시지 */}
                          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex gap-2">
                              <HelpCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                              <div className="text-sm text-blue-900">
                                <div className="font-semibold mb-1">API 연동 설정 안내</div>
                                <ul className="text-xs space-y-1 list-disc list-inside">
                                  <li>Strava: OAuth 2.0 API 키 필요 (strava.com/settings/api)</li>
                                  <li>Garmin: Connect API 신청 필요 (developer.garmin.com)</li>
                                  <li>Apple Health: iOS 앱에서만 지원 또는 XML 파일 업로드</li>
                                  <li>Google Fit: REST API 키 필요 (console.cloud.google.com)</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* 계산 방식 선택 */}
                  <div className="space-y-2">
                    <Label htmlFor="cardio-method">계산 방식</Label>
                    <Select 
                      value={cardioMethod} 
                      onValueChange={(value: 'rpe' | 'trimp' | 'distance' | 'power') => {
                        setCardioMethod(value);
                        // 방식 변경 시 자동으로 적합한 메소드 선택
                        if (value === 'distance' && !isDistanceBased) {
                          // 거리 기반 운동이 아닌데 선택한 경우 경고는 하지 않음 (사용자가 원할 수 있음)
                        } else if (value === 'power' && !isPowerBased) {
                          // 파워 기반 운동이 아닌데 선택한 경우
                        }
                      }}
                    >
                      <SelectTrigger id="cardio-method">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rpe">RPE 기반 (권장)</SelectItem>
                        <SelectItem value="trimp">심박수 기반 (TRIMP)</SelectItem>
                        <SelectItem value="distance">거리 기반 (러닝·걷기)</SelectItem>
                        <SelectItem value="power">파워 기반 (싸이클·로잉·스키)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 운동 시간 */}
                  <div className="space-y-2">
                    <Label htmlFor="cardio-time">운동 시간 (분)</Label>
                    <Input
                      id="cardio-time"
                      type="number"
                      placeholder="예: 40"
                      value={cardioTime}
                      onChange={(e) => setCardioTime(e.target.value)}
                    />
                  </div>

                  {/* RPE 방식 */}
                  {cardioMethod === 'rpe' && (
                    <div className="space-y-2">
                      <Label htmlFor="cardio-rpe">RPE (1-10)</Label>
                      <Input
                        id="cardio-rpe"
                        type="number"
                        placeholder="예: 6"
                        min="1"
                        max="10"
                        step="0.5"
                        value={cardioRPE}
                        onChange={(e) => setCardioRPE(e.target.value)}
                      />
                      <p className="text-xs text-gray-600">
                        💡 공식: 운동량 = 운동 시간(분) × RPE
                      </p>
                    </div>
                  )}

                  {/* TRIMP 방식 */}
                  {cardioMethod === 'trimp' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="cardio-hr-avg">평균 심박수 (bpm)</Label>
                        <Input
                          id="cardio-hr-avg"
                          type="number"
                          placeholder="예: 150"
                          value={cardioHRAvg}
                          onChange={(e) => setCardioHRAvg(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cardio-hr-rest">안정시 심박수 (bpm)</Label>
                        <Input
                          id="cardio-hr-rest"
                          type="number"
                          placeholder="예: 60"
                          value={cardioHRRest}
                          onChange={(e) => setCardioHRRest(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cardio-hr-max">최대 심박수 (bpm)</Label>
                        <Input
                          id="cardio-hr-max"
                          type="number"
                          placeholder="예: 190"
                          value={cardioHRMax}
                          onChange={(e) => setCardioHRMax(e.target.value)}
                        />
                      </div>
                      <p className="text-xs text-gray-600">
                        💡 공식: 운동량 = 운동 시간(분) × (평균심박수 - 안정시심박수) ÷ (최대심박수 - 안정시심박수)
                      </p>
                    </>
                  )}

                  {/* 거리 기반 방식 */}
                  {cardioMethod === 'distance' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="cardio-distance">거리 (km)</Label>
                        <Input
                          id="cardio-distance"
                          type="number"
                          placeholder="예: 5"
                          step="0.1"
                          value={cardioDistance}
                          onChange={(e) => setCardioDistance(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cardio-weight">체중 (kg)</Label>
                        <Input
                          id="cardio-weight"
                          type="number"
                          placeholder="예: 70"
                          step="0.1"
                          value={cardioWeight}
                          onChange={(e) => setCardioWeight(e.target.value)}
                        />
                      </div>
                      <p className="text-xs text-gray-600">
                        💡 공식: 운동량 = 체중(kg) × 거리(km)
                      </p>
                    </>
                  )}

                  {/* 파워 기반 방식 */}
                  {cardioMethod === 'power' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="power-method">파워 계산 방식</Label>
                        <Select value={powerMethod} onValueChange={(value: 'simple' | 'tss') => setPowerMethod(value)}>
                          <SelectTrigger id="power-method">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="simple">간단한 방식 (파워 × 시간)</SelectItem>
                            <SelectItem value="tss">TSS (Training Stress Score)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cardio-time-seconds">운동 시간 (초)</Label>
                        <Input
                          id="cardio-time-seconds"
                          type="number"
                          placeholder="예: 3600"
                          value={cardioTimeSeconds}
                          onChange={(e) => setCardioTimeSeconds(e.target.value)}
                        />
                      </div>

                      {powerMethod === 'simple' ? (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="cardio-power">평균 파워 (W)</Label>
                            <Input
                              id="cardio-power"
                              type="number"
                              placeholder="예: 200"
                              value={cardioPower}
                              onChange={(e) => setCardioPower(e.target.value)}
                            />
                          </div>
                          <p className="text-xs text-gray-600">
                            💡 공식: 운동량 = 평균 파워(W) × 시간(초)
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="cardio-np">Normalized Power (NP)</Label>
                            <Input
                              id="cardio-np"
                              type="number"
                              placeholder="예: 180"
                              value={cardioNP}
                              onChange={(e) => setCardioNP(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="cardio-if">Intensity Factor (IF)</Label>
                            <Input
                              id="cardio-if"
                              type="number"
                              placeholder="예: 0.85"
                              step="0.01"
                              value={cardioIF}
                              onChange={(e) => setCardioIF(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="cardio-ftp">FTP (Functional Threshold Power)</Label>
                            <Input
                              id="cardio-ftp"
                              type="number"
                              placeholder="예: 250"
                              value={cardioFTP}
                              onChange={(e) => setCardioFTP(e.target.value)}
                            />
                          </div>
                          <p className="text-xs text-gray-600">
                            💡 공식: TSS = (시간 × NP × IF ÷ FTP) × 100
                          </p>
                        </>
                      )}
                    </>
                  )}

                  {/* 계산된 운동량 표시 */}
                  {cardioVolume !== null && (
                    <div className="p-3 bg-green-100 border border-green-300 rounded-lg">
                      <p className="text-sm font-semibold text-green-900">
                        계산된 운동량: {cardioVolume.toFixed(2)} {
                          cardioMethod === 'rpe' ? 'AU' : 
                          cardioMethod === 'trimp' ? 'TRIMP' : 
                          cardioMethod === 'distance' ? 'AU' :
                          powerMethod === 'tss' ? 'TSS' : 'J (Joules)'
                        }
                      </p>
                    </div>
                  )}

                  {/* 계산 버튼 */}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => calculateCardioVolume()}
                  >
                    운동량 계산하기
                  </Button>
                </div>
              ) : (
                <>
                  {/* 운동 단계 */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="training-phase">운동 단계</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0"
                        onClick={() => setShowTrainingPhaseGuide(true)}
                      >
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                    <Select value={trainingPhase} onValueChange={setTrainingPhase}>
                      <SelectTrigger id="training-phase">
                        <SelectValue placeholder="운동 단계를 선택해주세요" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="안정화/근지구력">안정화/근지구력</SelectItem>
                        <SelectItem value="근지구력">근지구력</SelectItem>
                        <SelectItem value="근비대">근비대</SelectItem>
                        <SelectItem value="최대근력">최대근력</SelectItem>
                        <SelectItem value="파워">파워</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 세트 테이블 */}
                  <div className="space-y-2">
                <Label>세트 기록</Label>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="py-2 px-3 text-left">세트</th>
                        <th className="py-2 px-3 text-left">KG</th>
                        <th className="py-2 px-3 text-left">개수</th>
                        <th className="py-2 px-3 text-left">
                          <div className="flex items-center gap-1">
                            RIR
                            <Dialog>
                              <DialogTrigger asChild>
                                <button className="hover:bg-gray-200 rounded-full p-0.5">
                                  <HelpCircle className="w-3.5 h-3.5 text-gray-500" />
                                </button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle>RIR의 정확한 정의</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <h3 className="font-bold text-lg mb-2">RIR (Reps In Reserve)</h3>
                                    <p className="text-sm text-gray-700 font-medium">
                                      "지금 세트에서 더 할 수 있었던 반복 횟수"
                                    </p>
                                  </div>
                                  
                                  <div className="space-y-3">
                                    <h4 className="font-semibold text-sm">예시:</h4>
                                    
                                    <div className="p-3 bg-red-50 border border-red-200 rounded">
                                      <p className="text-sm font-medium mb-1">80kg으로 8회 하고 실패</p>
                                      <p className="text-lg font-bold text-red-700">→ RIR 0</p>
                                    </div>
                                    
                                    <div className="p-3 bg-orange-50 border border-orange-200 rounded">
                                      <p className="text-sm font-medium mb-1">80kg으로 8회 하고 1회 더 가능했다면</p>
                                      <p className="text-lg font-bold text-orange-700">→ RIR 1</p>
                                    </div>
                                    
                                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                                      <p className="text-sm font-medium mb-1">80kg으로 8회 하고 2회 더 가능했다면</p>
                                      <p className="text-lg font-bold text-yellow-700">→ RIR 2</p>
                                    </div>
                                    
                                    <div className="p-3 bg-green-50 border border-green-200 rounded">
                                      <p className="text-sm font-medium mb-1">80kg으로 8회 하고 3회 더 가능했다면</p>
                                      <p className="text-lg font-bold text-green-700">→ RIR 3</p>
                                    </div>
                                  </div>
                                  
                                  <div className="p-3 bg-purple-50 border border-purple-200 rounded">
                                    <p className="text-xs text-purple-900 font-medium">
                                      💡 <strong>팁:</strong> 대부분의 운동에서 RIR 1-3을 목표로 하면 최적의 효과를 얻을 수 있습니다!
                                    </p>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </th>
                        <th className="py-2 px-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentSets.map((set, index) => (
                        <tr key={index} className="border-t">
                          <td className="py-2 px-3">{index + 1}</td>
                          <td className="py-2 px-3">
                            <Input
                              type="number"
                              placeholder="0"
                              value={set.weight}
                              onChange={(e) => updateSet(index, "weight", e.target.value)}
                              className="h-8"
                              step={isCardio ? "0.1" : "0.5"}
                            />
                          </td>
                          <td className="py-2 px-3">
                            <Input
                              type="number"
                              placeholder="0"
                              value={set.reps}
                              onChange={(e) => updateSet(index, "reps", e.target.value)}
                              className="h-8"
                              step={isCardio ? "1" : "1"}
                            />
                          </td>
                          <td className="py-2 px-3">
                            <Input
                              type="number"
                              placeholder="0"
                              value={(set as any).rir || ""}
                              onChange={(e) => updateSet(index, "rir", e.target.value)}
                              className="h-8 w-16 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              step="1"
                              min="0"
                              max="10"
                            />
                          </td>
                          <td className="py-2 px-3">
                            {currentSets.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeSet(index)}
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Button 
                  onClick={addSet} 
                  variant="outline" 
                  className="w-full" 
                  size="sm"
                  disabled={!hasStartedWorkout}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  세트 추가
                </Button>
              </div>
                </>
              )}

              {editingExerciseIndex === null ? (
                <Button 
                  onClick={addExercise} 
                  className="w-full"
                  disabled={!hasStartedWorkout}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  운동 추가
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={updateExercise} className="flex-1">
                    <Save className="w-4 h-4 mr-2" />
                    수정 완료
                  </Button>
                  <Button onClick={cancelEditingExercise} variant="outline" className="flex-1">
                    취소
                  </Button>
                </div>
              )}

              <Button 
                onClick={finishWorkout} 
                className="w-full bg-red-600 hover:bg-red-700" 
                disabled={!hasStartedWorkout || exercises.length === 0}
              >
                <Square className="w-4 h-4 mr-2" />
                운동 종료
              </Button>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">오늘 수행한 운동</h4>
              {exercises.length === 0 ? (
                <p className="text-sm text-gray-500">아직 기록된 운동이 없습니다.</p>
              ) : (
                <div className="space-y-3">
                  {exercises.map((exercise, index) => (
                    <div
                      key={index}
                      className="p-3 bg-gray-50 rounded-lg space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-left text-purple-900">
                            {exercise.name}
                          </div>
                          {exercise.cardioMethod ? (
                            <div className="text-xs text-blue-600 mt-0.5">
                              유산소 운동 ({
                                exercise.cardioMethod === 'rpe' ? 'RPE 기반' : 
                                exercise.cardioMethod === 'trimp' ? '심박수 기반' :
                                exercise.cardioMethod === 'distance' ? '거리 기반' :
                                '파워 기반'
                              })
                            </div>
                          ) : exercise.trainingPhase && (
                            <div className="text-xs text-purple-600 mt-0.5">
                              {exercise.trainingPhase}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditingExercise(index)}
                          >
                            <Edit className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeExercise(index)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-xs space-y-1">
                        {exercise.cardioMethod ? (
                          <div className="space-y-1">
                            {exercise.cardioMethod === 'rpe' && (
                              <>
                                <div className="text-gray-600">
                                  운동 시간: {exercise.cardioTime}분
                                </div>
                                <div className="text-gray-600">
                                  RPE: {exercise.cardioRPE}
                                </div>
                              </>
                            )}
                            {exercise.cardioMethod === 'trimp' && (
                              <>
                                <div className="text-gray-600">
                                  운동 시간: {exercise.cardioTime}분
                                </div>
                                <div className="text-gray-600">
                                  평균 심박수: {exercise.cardioHRAvg}bpm<br />
                                  안정시 심박수: {exercise.cardioHRRest}bpm<br />
                                  최대 심박수: {exercise.cardioHRMax}bpm
                                </div>
                              </>
                            )}
                            {exercise.cardioMethod === 'distance' && (
                              <>
                                <div className="text-gray-600">
                                  거리: {exercise.cardioDistance}km
                                </div>
                                <div className="text-gray-600">
                                  체중: {exercise.cardioWeight}kg
                                </div>
                              </>
                            )}
                            {exercise.cardioMethod === 'power' && (
                              <>
                                <div className="text-gray-600">
                                  운동 시간: {exercise.cardioTimeSeconds}초
                                </div>
                                {exercise.cardioPower && (
                                  <div className="text-gray-600">
                                    평균 파워: {exercise.cardioPower}W
                                  </div>
                                )}
                                {exercise.cardioNP && (
                                  <div className="text-gray-600">
                                    NP: {exercise.cardioNP}, IF: {exercise.cardioIF}, FTP: {exercise.cardioFTP}
                                  </div>
                                )}
                              </>
                            )}
                            <div className="text-green-700 font-semibold">
                              운동량: {exercise.cardioVolume?.toFixed(2)} {
                                exercise.cardioMethod === 'rpe' ? 'AU' : 
                                exercise.cardioMethod === 'trimp' ? 'TRIMP' :
                                exercise.cardioMethod === 'distance' ? 'AU' :
                                exercise.cardioNP ? 'TSS' : 'J'
                              }
                            </div>
                          </div>
                        ) : (
                          exercise.sets.map((set, setIndex) => (
                            <div key={setIndex} className="text-gray-600">
                              세트 {setIndex + 1}: {set.weight}kg × {set.reps}개
                              {set.rir !== undefined && ` (RIR: ${set.rir})`}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-semibold text-purple-900 mb-2">오늘 총 운동량</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-purple-700">총 세트:</span>
                  <span className="font-bold ml-1">{totalExerciseTime}세트</span>
                </div>
                <div>
                  <span className="text-purple-700">총 ���륨:</span>
                  <span className="font-bold ml-1">{totalVolume.toLocaleString()}kg</span>
                </div>
                <div>
                  <span className="text-purple-700">운동 시간:</span>
                  <span className="font-bold ml-1">{totalMinutes.toFixed(1)}분</span>
                </div>
                <div>
                  <span className="text-purple-700">운동 강도:</span>
                  <span className="font-bold ml-1">{exerciseIntensity.toFixed(1)}kg/분</span>
                </div>
                {averageRir !== null && (
                  <div>
                    <span className="text-purple-700">평균 RIR:</span>
                    <span className="font-bold ml-1">{averageRir.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          )}
        </Card>
      </div>

      {/* 운동 단계 가이드 Dialog */}
      <Dialog open={showTrainingPhaseGuide} onOpenChange={setShowTrainingPhaseGuide}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>운동 단계별 가이드</DialogTitle>
            <DialogDescription>
              각 운동 단계별 권장 세트, 반복수, 강도를 확인하세요
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="p-3 text-left font-semibold bg-gray-50">단계</th>
                  <th className="p-3 text-left font-semibold bg-gray-50">반복수</th>
                  <th className="p-3 text-left font-semibold bg-gray-50">세트</th>
                  <th className="p-3 text-left font-semibold bg-gray-50">강도(%1RM)</th>
                  <th className="p-3 text-left font-semibold bg-gray-50">템포(편심-등척-동심)</th>
                  <th className="p-3 text-left font-semibold bg-gray-50">휴식</th>
                  <th className="p-3 text-left font-semibold bg-gray-50">주요 목적</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">1. 안정화/근지구력</td>
                  <td className="p-3">12–20</td>
                  <td className="p-3">1–3</td>
                  <td className="p-3 font-semibold text-blue-700">50–70%</td>
                  <td className="p-3 font-semibold text-purple-700">4-2-1 (느림)</td>
                  <td className="p-3 font-semibold text-green-700">0–90초</td>
                  <td className="p-3">신경근 안정성, 지구력</td>
                </tr>
                <tr className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">2. 근지구력<br/><span className="text-xs text-gray-600">(Strength Endurance)</span></td>
                  <td className="p-3">8–12<br/><span className="text-xs text-gray-600">(슈퍼세트)</span></td>
                  <td className="p-3">2–4</td>
                  <td className="p-3 font-semibold text-blue-700">70–80%<br/><span className="text-xs">+ 안정화는 체중/가벼움</span></td>
                  <td className="p-3 font-semibold text-purple-700">2-0-2<br/>+ 4-2-1 혼합</td>
                  <td className="p-3 font-semibold text-green-700">0–60초</td>
                  <td className="p-3">안정성 + 근력 연결</td>
                </tr>
                <tr className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">3. 근비대</td>
                  <td className="p-3">6–12</td>
                  <td className="p-3">3–6</td>
                  <td className="p-3 font-semibold text-blue-700">75–85%</td>
                  <td className="p-3 font-semibold text-purple-700">2-0-2<br/><span className="text-xs">(보통 속도)</span></td>
                  <td className="p-3 font-semibold text-green-700">0–60초</td>
                  <td className="p-3">근단면적 증가</td>
                </tr>
                <tr className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">4. 최대근력</td>
                  <td className="p-3">1–5</td>
                  <td className="p-3">4–6</td>
                  <td className="p-3 font-semibold text-blue-700">85–100%</td>
                  <td className="p-3 font-semibold text-purple-700">X-X-X<br/><span className="text-xs">(가능한 빠르게)</span></td>
                  <td className="p-3 font-semibold text-green-700">3–5분</td>
                  <td className="p-3">최대 힘 생성</td>
                </tr>
                <tr className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">5. 파워</td>
                  <td className="p-3">1–10<br/><span className="text-xs text-gray-600">(주로 3–5)</span></td>
                  <td className="p-3">3–6</td>
                  <td className="p-3 font-semibold text-blue-700">30–45% 상체<br/>0–60% 하체<br/><span className="text-xs">+ 고중량 복합</span></td>
                  <td className="p-3 font-semibold text-purple-700">폭발�� X-X-X</td>
                  <td className="p-3 font-semibold text-green-700">3–5분</td>
                  <td className="p-3">힘 × 속도</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg text-sm">
            <p className="font-semibold text-blue-900 mb-2">💡 템포 표기법 설명</p>
            <p className="text-blue-800">
              <strong>4-2-1</strong> = 4초 내리기(편심) - 2초 정지(등척) - 1초 들어올리기(동심)<br/>
              <strong>X-X-X</strong> = 최대한 빠르게(폭발적으로) 수행
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}