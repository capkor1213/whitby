import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { Progress } from "@/app/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { toast } from "sonner";
import { ChevronRight, ChevronLeft, User, Target, Activity, Info } from "lucide-react";
import whitbyLogo from "figma:asset/e51e097fc8aad7c73b8d6f36e3388a97303b1760.png";
import { getSupabaseClient } from "@/utils/supabase/client";

interface OnboardingPageProps {
  accessToken: string;
  supabaseUrl: string;
  publicAnonKey: string;
  onComplete: () => void;
}

export function OnboardingPage({ accessToken, supabaseUrl, publicAnonKey, onComplete }: OnboardingPageProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = getSupabaseClient();

  // Step 1: 닉네임
  const [nickname, setNickname] = useState("");

  // Step 2: 사용자 타입 ('일반인' 또는 '선수')
  const [userType, setUserType] = useState("general"); // "general" or "athlete"

  // Step 2: 현재 신체 정보 (공통)
  const [gender, setGender] = useState("male");
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [currentWeight, setCurrentWeight] = useState("");
  const [weeklyWorkoutFrequency, setWeeklyWorkoutFrequency] = useState("2-3"); // "0-1", "2-3", "4-5", "6+"

  // Step 2: 선수 전용 (체성분 정보)
  const [bodyFatPercent, setBodyFatPercent] = useState(""); // 체지방률 (%)

  // Step 3: 목표 설정
  const [goalType, setGoalType] = useState("maintain"); // general: "bulk", "maintain", "diet" / athlete: "lean_bulk", "maintain", "cut"

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      const { data } = await supabase.auth.getUser(accessToken);
      
      if (data.user?.user_metadata?.name) {
        setNickname(data.user.user_metadata.name);
      }
    } catch (error) {
      console.error("Error loading user info:", error);
    }
  };

  const calculateRecommendations = () => {
    const weight = parseFloat(currentWeight);
    const userAge = parseFloat(age);
    const userHeight = parseFloat(height);
    const bfPercent = parseFloat(bodyFatPercent);

    if (!weight || !userAge || !userHeight) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }

    let bmr = 0;
    let tdee = 0;
    let activityFactor = 1.4;

    // 활동계수 계산 (새 기준)
    if (weeklyWorkoutFrequency === "0-1") {
      activityFactor = 1.2;
    } else if (weeklyWorkoutFrequency === "2-3") {
      activityFactor = 1.4;
    } else if (weeklyWorkoutFrequency === "4-5") {
      activityFactor = 1.6;
    } else if (weeklyWorkoutFrequency === "6+") {
      activityFactor = 1.8;
    }

    if (userType === "general") {
      // ========== 일반인 모드 ==========
      
      // 1. Mifflin-St Jeor 공식으로 BMR 계산
      if (gender === "male") {
        bmr = (10 * weight) + (6.25 * userHeight) - (5 * userAge) + 5;
      } else {
        bmr = (10 * weight) + (6.25 * userHeight) - (5 * userAge) - 161;
      }
      tdee = bmr * activityFactor;

      // 2. 목표별 칼로리 조정
      let calorieAdjustment = 1.0;
      if (goalType === "bulk") {
        calorieAdjustment = 1.15; // TDEE +10~20%, 중간값 +15%
      } else if (goalType === "maintain") {
        calorieAdjustment = 1.0; // TDEE 유지
      } else if (goalType === "diet") {
        calorieAdjustment = 0.825; // TDEE -10~25%, 중간값 -17.5%
      }
      const calories = tdee * calorieAdjustment;

      // 3. 단백질 계산 (체중 기준)
      let proteinMin = 1.4;
      let proteinMax = 2.0;
      if (goalType === "bulk") {
        proteinMin = 1.6;
        proteinMax = 2.2;
      } else if (goalType === "maintain") {
        proteinMin = 1.4;
        proteinMax = 2.0;
      } else if (goalType === "diet") {
        proteinMin = 2.0;
        proteinMax = 3.0;
      }
      const proteinPerKg = (proteinMin + proteinMax) / 2;
      const protein = weight * proteinPerKg;

      // 4. 탄수화물 계산 (운동량 기준)
      let carbsMin = 3;
      let carbsMax = 5;
      if (weeklyWorkoutFrequency === "0-1") {
        // 가벼운 활동
        carbsMin = 3;
        carbsMax = 5;
      } else if (weeklyWorkoutFrequency === "2-3") {
        // 중간 강도 운동 (1시간/일)
        carbsMin = 5;
        carbsMax = 7;
      } else if (weeklyWorkoutFrequency === "4-5") {
        // 고강도 훈련 (1-3시간/일)
        carbsMin = 6;
        carbsMax = 10;
      } else {
        // 극한 훈련 (4시간 이상/일)
        carbsMin = 8;
        carbsMax = 12;
      }
      const carbsPerKg = (carbsMin + carbsMax) / 2;
      const carbs = weight * carbsPerKg;

      // 5. 지방 계산 (남은 20-30% 칼로리)
      const proteinCalories = protein * 4;
      const carbCalories = carbs * 4;
      const remainingCalories = calories - proteinCalories - carbCalories;
      const fat = Math.max(remainingCalories / 9, weight * 0.8); // 최소 0.8g/kg 보장

      return {
        calories: Math.round(calories),
        protein: Math.round(protein),
        carbs: Math.round(carbs),
        fat: Math.round(fat),
      };
    } else {
      // ========== 선수 모드 ==========
      
      if (!bfPercent) {
        return { calories: 0, protein: 0, carbs: 0, fat: 0 };
      }

      // 1. 제지방량(FFM) 계산
      const ffm = weight * (1 - bfPercent / 100);

      // 2. Cunningham 공식 → REE 계산
      const ree = 500 + 22 * ffm;

      // 3. 활동량 반영 → TDEE 계산
      tdee = ree * activityFactor;

      // 4. 목표별 칼로리 조정 (ISSN 기준)
      let calorieAdjustment = 1.0;
      if (goalType === "lean_bulk") {
        calorieAdjustment = 1.10; // TDEE +5~15%, 중간값 +10%
      } else if (goalType === "maintain") {
        calorieAdjustment = 1.0; // TDEE ±5%, 중간값 0%
      } else if (goalType === "cut") {
        calorieAdjustment = 0.75; // TDEE -20~30%, 중간값 -25%
      }
      const calories = tdee * calorieAdjustment;

      // 5. ISSN 매크로 분배
      // 단백질: 1.6-2.2 g/kg (체중 기준)
      const proteinPerKg = 1.9; // 중간값
      const protein = weight * proteinPerKg;

      // 지방: 총열량 20-30% (중간값 25%)
      const fatPercent = 0.25;
      const fatCalories = calories * fatPercent;
      const fat = fatCalories / 9;

      // 탄수화물: 나머지 열량
      const proteinCalories = protein * 4;
      const remainingCalories = calories - proteinCalories - fatCalories;
      const carbs = remainingCalories / 4;

      return {
        calories: Math.round(calories),
        protein: Math.round(protein),
        carbs: Math.round(carbs),
        fat: Math.round(fat),
      };
    }
  };

  const handleComplete = async () => {
    if (!nickname.trim()) {
      toast.error("닉네임을 입력해주세요.");
      return;
    }

    if (!age || !height || !currentWeight) {
      toast.error("현재 신체 정보를 모두 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Update nickname in auth metadata
      const { data, error } = await supabase.auth.updateUser({
        data: {
          name: nickname,
        },
      });
      
      if (error) {
        throw error;
      }

      // Calculate recommendations
      const recommendations = calculateRecommendations();

      // Save profile
      const profileData = {
        nickname,
        gender,
        age,
        height,
        currentWeight,
        weeklyWorkoutFrequency,
        proteinPerKg: 2.2,
        recommendedCalories: recommendations.calories,
        recommendedProtein: recommendations.protein,
        recommendedCarbs: recommendations.carbs,
        recommendedFat: recommendations.fat,
        onboardingComplete: true,
        updatedAt: new Date().toISOString(),
      };

      const response = await fetch(`${supabaseUrl}/functions/v1/make-server-2c29cd73/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(profileData),
      });

      if (response.ok) {
        toast.success("환영합니다! 프로필이 생성되었습니다.");
        onComplete();
      } else {
        toast.error("프로필 저장에 실패했습니다.");
      }
    } catch (error) {
      console.error("Error completing onboarding:", error);
      toast.error("오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={whitbyLogo} alt="Whitby Logo" className="h-16 w-auto object-contain" />
          </div>
          <CardTitle className="text-2xl">환영합니다! 🎉</CardTitle>
          <CardDescription>
            Whitby를 시작하기 위해 기본 정보를 입력해주세요
          </CardDescription>
          <Progress value={step * 33.33} className="mt-4" />
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-2">기본 정보</h3>
                <p className="text-sm text-gray-600">닉네임을 입력해주세요</p>
              </div>
              <div className="space-y-2 max-w-md mx-auto">
                <Label htmlFor="nickname">닉네임</Label>
                <Input
                  id="nickname"
                  type="text"
                  placeholder="예: 운동왕김철수"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="text-lg"
                />
              </div>
              <div className="flex justify-end max-w-md mx-auto mt-6">
                <Button onClick={() => setStep(2)} disabled={!nickname.trim()}>
                  다음 <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <User className="w-12 h-12 mx-auto text-blue-600 mb-2" />
                <h3 className="text-xl font-semibold mb-2">현재 신체 정보</h3>
                <p className="text-sm text-gray-600">사용자 유형을 선택하고 현재 신체 구성을 입력하세요</p>
              </div>

              {/* 일반인/선수 탭 */}
              <Tabs value={userType} onValueChange={setUserType} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="general">일반인</TabsTrigger>
                  <TabsTrigger value="athlete">선수</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4">
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mb-4">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-blue-700">
                        <strong>일반인 모드:</strong> Mifflin-St Jeor 공식을 사용하여 BMR을 계산합니다. 체성분 측정 없이 나이, 신장, 체중만으로 간편하게 관리할 수 있습니다.
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="gender">성별</Label>
                      <select
                        id="gender"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                      >
                        <option value="male">남성</option>
                        <option value="female">여성</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="age">나이 (세)</Label>
                      <Input
                        id="age"
                        type="number"
                        step="1"
                        placeholder="25"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="height">신장 (cm)</Label>
                      <Input
                        id="height"
                        type="number"
                        step="1"
                        placeholder="175"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="current-weight">체중 (kg)</Label>
                      <Input
                        id="current-weight"
                        type="number"
                        step="0.1"
                        placeholder="70.0"
                        value={currentWeight}
                        onChange={(e) => setCurrentWeight(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="weekly-frequency">주간 운동 빈도 (활동계수)</Label>
                      <select
                        id="weekly-frequency"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={weeklyWorkoutFrequency}
                        onChange={(e) => setWeeklyWorkoutFrequency(e.target.value)}
                      >
                        <option value="0-1">0~1회 (1.2)</option>
                        <option value="2-3">2~3회 (1.4)</option>
                        <option value="4-5">4~5회 (1.6)</option>
                        <option value="6+">6회 이상 (1.8)</option>
                      </select>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="athlete" className="space-y-4">
                  <div className="bg-purple-50 p-3 rounded-lg border border-purple-200 mb-4">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-purple-700">
                        <strong>선수 모드:</strong> Cunningham 공식을 사용하여 REE를 계산합니다. 체지방률을 기반으로 제지방량(FFM)을 계산하여 더 정밀한 영양 관리가 가능합니다.
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="gender-athlete">성별</Label>
                      <select
                        id="gender-athlete"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                      >
                        <option value="male">남성</option>
                        <option value="female">여성</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="age-athlete">나이 (세)</Label>
                      <Input
                        id="age-athlete"
                        type="number"
                        step="1"
                        placeholder="25"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="height-athlete">신장 (cm)</Label>
                      <Input
                        id="height-athlete"
                        type="number"
                        step="1"
                        placeholder="175"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="current-weight-athlete">체중 (kg)</Label>
                      <Input
                        id="current-weight-athlete"
                        type="number"
                        step="0.1"
                        placeholder="70.0"
                        value={currentWeight}
                        onChange={(e) => setCurrentWeight(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="body-fat-percent">체지방률 (%)</Label>
                      <Input
                        id="body-fat-percent"
                        type="number"
                        step="0.1"
                        placeholder="15.0"
                        value={bodyFatPercent}
                        onChange={(e) => setBodyFatPercent(e.target.value)}
                      />
                      <p className="text-xs text-gray-500">
                        💡 체성분 분석기로 측정한 체지방률을 입력하세요
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="weekly-frequency-athlete">주간 운동 빈도 (활동계수)</Label>
                      <select
                        id="weekly-frequency-athlete"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={weeklyWorkoutFrequency}
                        onChange={(e) => setWeeklyWorkoutFrequency(e.target.value)}
                      >
                        <option value="0-1">0~1회 (1.2)</option>
                        <option value="2-3">2~3회 (1.4)</option>
                        <option value="4-5">4~5회 (1.6)</option>
                        <option value="6+">6회 이상 (1.8)</option>
                      </select>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  이전
                </Button>
                <Button 
                  onClick={() => setStep(3)} 
                  disabled={!age || !height || !currentWeight || (userType === "athlete" && !bodyFatPercent)}
                >
                  다음 <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <Target className="w-12 h-12 mx-auto text-green-600 mb-2" />
                <h3 className="text-xl font-semibold mb-2">목표 설정</h3>
                <p className="text-sm text-gray-600">도달하고 싶은 목표를 설정하세요</p>
              </div>
              
              <div className="grid md:grid-cols-1 gap-4 max-w-md mx-auto">
                <div className="space-y-2">
                  <Label htmlFor="goal-type">목적</Label>
                  <select
                    id="goal-type"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={goalType}
                    onChange={(e) => setGoalType(e.target.value)}
                  >
                    {userType === "general" ? (
                      <>
                        <option value="maintain">건강 유지 (TDEE 유지)</option>
                        <option value="bulk">증량 (TDEE +15%)</option>
                        <option value="diet">다이어트 (TDEE -17.5%)</option>
                      </>
                    ) : (
                      <>
                        <option value="maintain">유지/리컴프 (TDEE ±5%)</option>
                        <option value="lean_bulk">근육 증가/린벌크 (TDEE +10%)</option>
                        <option value="cut">체지방 감량 (TDEE -25%)</option>
                      </>
                    )}
                  </select>
                  <div className="bg-gray-50 p-2 rounded mt-2">
                    <p className="text-xs text-gray-600">
                      {userType === "general" ? (
                        <>
                          <strong>일반인 모드:</strong> Mifflin-St Jeor 공식 기반 BMR 계산 → TDEE 산출
                        </>
                      ) : (
                        <>
                          <strong>선수 모드:</strong> Cunningham 공식(FFM 기반) → REE 계산 → TDEE 산출
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* 일일 권장 섭취량 미리보기 */}
              {currentWeight && (
                <div className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    💊 일일 권장 섭취량
                    {userType === "athlete" && (
                      <span className="text-xs font-normal text-purple-600 bg-purple-100 px-2 py-0.5 rounded">
                        ISSN 기준
                      </span>
                    )}
                  </h4>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <p className="text-xs text-gray-600">칼로리</p>
                      <p className="text-xl font-bold text-purple-900">{calculateRecommendations().calories}</p>
                      <p className="text-xs text-gray-500">kcal/일</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <p className="text-xs text-gray-600">단백질</p>
                      <p className="text-xl font-bold text-blue-900">{calculateRecommendations().protein}</p>
                      <p className="text-xs text-gray-500">g/일</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <p className="text-xs text-gray-600">탄수화물</p>
                      <p className="text-xl font-bold text-green-900">{calculateRecommendations().carbs}</p>
                      <p className="text-xs text-gray-500">g/일</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <p className="text-xs text-gray-600">지방</p>
                      <p className="text-xl font-bold text-orange-900">{calculateRecommendations().fat}</p>
                      <p className="text-xs text-gray-500">g/일</p>
                    </div>
                  </div>
                  
                  {/* 계산 방식 설명 */}
                  <div className="bg-white p-3 rounded-lg border border-blue-100 text-xs text-gray-700 space-y-1">
                    {userType === "general" ? (
                      <>
                        <p className="font-semibold text-blue-800 mb-1">📐 계산 방식 (일반인)</p>
                        <p>• 단백질: {goalType === "bulk" ? "1.6~2.2" : goalType === "diet" ? "2.0~3.0" : "1.4~2.0"} g/kg (체중 기준)</p>
                        <p>• 탄수화물: {
                          weeklyWorkoutFrequency === "0-1" ? "3~5 g/kg (가벼운 활동)" : 
                          weeklyWorkoutFrequency === "2-3" ? "5~7 g/kg (중간 강도 운동)" : 
                          weeklyWorkoutFrequency === "4-5" ? "6~10 g/kg (고강도 훈련)" : 
                          "8~12 g/kg (극한 훈련)"
                        }</p>
                        <p>• 지방: 남은 칼로리의 20~30%</p>
                      </>
                    ) : (
                      <>
                        <p className="font-semibold text-purple-800 mb-1">📐 계산 방식 (선수 - ISSN)</p>
                        <p>• 단백질: 1.6~2.2 g/kg (체중 기준)</p>
                        <p>• 지방: 총 열량의 20~30%</p>
                        <p>• 탄수화물: 나머지 열량</p>
                        {bodyFatPercent && (
                          <p className="text-purple-600 mt-2">
                            💪 제지방량(FFM): {(parseFloat(currentWeight) * (1 - parseFloat(bodyFatPercent) / 100)).toFixed(1)} kg
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  이전
                </Button>
                <Button 
                  onClick={handleComplete}
                  disabled={isSubmitting || !currentWeight}
                >
                  {isSubmitting ? "저장 중..." : "시작하기"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}