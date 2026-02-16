import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { User, Target, Activity, TrendingUp, Save, Info, HelpCircle, ChevronDown, ChevronUp, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { getSupabaseClient } from "@/utils/supabase/client";
import { AccountDeletionDialog } from "@/app/components/AccountDeletionDialog";

interface ProfileTabProps {
  accessToken: string;
  supabaseUrl: string;
  publicAnonKey: string;
}

export function ProfileTab({ accessToken, supabaseUrl, publicAnonKey }: ProfileTabProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showCalculationDetails, setShowCalculationDetails] = useState(false); // 계산 공식 상세 토글
  const [showRecalculateDialog, setShowRecalculateDialog] = useState(false); // 다시 계산하기 Dialog

  // User account info (회원가입 시 입력한 계정 정보)
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [addressDetail, setAddressDetail] = useState("");

  // User type ('일반인' 또는 '선수')
  const [userType, setUserType] = useState("general"); // "general" or "athlete"

  // User body info (회원가입 시 입력한 신체 정보)
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState("male");
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [currentWeight, setCurrentWeight] = useState("");
  const [bodyFatPercent, setBodyFatPercent] = useState(""); // 선수 전용: 체지방률 (%)
  const [weeklyWorkoutFrequency, setWeeklyWorkoutFrequency] = useState("2-3"); // "0-1", "2-3", "4-5", "6+"

  // Goal type
  const [goalType, setGoalType] = useState("maintain"); // general: "bulk", "maintain", "diet" / athlete: "lean_bulk", "maintain", "cut"
  const [proteinPerKg, setProteinPerKg] = useState("2.2"); // 단백질 kg당 g (필요시 수동 조정)

  // Nutrition recommendations
  const [recommendedCalories, setRecommendedCalories] = useState(0);
  const [recommendedProtein, setRecommendedProtein] = useState(0);
  const [recommendedCarbs, setRecommendedCarbs] = useState(0);
  const [recommendedFat, setRecommendedFat] = useState(0);

  const supabase = getSupabaseClient();

  useEffect(() => {
    loadProfile();
  }, []);

  // 목표 타입이 변경되면 권장 단백질량 자동 설정 (기존 값이 없을 때만)
  useEffect(() => {
    if (!proteinPerKg || proteinPerKg === "2.2") {
      let recommendedProtein = 2.2;
      if (goalType === "fatloss") {
        recommendedProtein = 2.4;
      } else if (goalType === "bulk" || goalType === "leanmass") {
        recommendedProtein = 2.2;
      } else {
        recommendedProtein = 2.0;
      }
      setProteinPerKg(recommendedProtein.toString());
    }
  }, [goalType]);

  useEffect(() => {
    calculateRecommendations();
  }, [gender, age, height, currentWeight, bodyFatPercent, weeklyWorkoutFrequency, goalType, proteinPerKg, userType]);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      // 1. Supabase Auth에서 계정 정보 로드
      const { data: userData } = await supabase.auth.getUser(accessToken);
      if (userData.user) {
        setEmail(userData.user.email || "");
        setName(userData.user.user_metadata?.name || "");
        setPhone(userData.user.user_metadata?.phone || "");
        setAddress(userData.user.user_metadata?.address || "");
        setAddressDetail(userData.user.user_metadata?.addressDetail || "");
      }

      // 2. 프로필 정보 로드 (목표 정보 + 회원가입 시 입력한 현재 신체 정보)
      const response = await fetch(`${supabaseUrl}/functions/v1/make-server-2c29cd73/profile`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.profile) {
          // 기본 정보
          setNickname(data.profile.nickname || "");
          setGender(data.profile.gender || "male");
          setAge(data.profile.age || "");
          setHeight(data.profile.height || "");
          
          // 현재 신체 정보 (회원가입 시 입력한 정보)
          setCurrentWeight(data.profile.currentWeight || "");
          
          // 목표 정보
          setGoalType(data.profile.goalType || "maintain");
          setWeeklyWorkoutFrequency(data.profile.weeklyWorkoutFrequency || "2-3");
          setProteinPerKg(data.profile.proteinPerKg || "2.2");
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("프로필 로딩 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateRecommendations = () => {
    const weight = parseFloat(currentWeight);
    const userAge = parseFloat(age);
    const userHeight = parseFloat(height);
    const bfPercent = parseFloat(bodyFatPercent);

    if (!weight || !userAge || !userHeight) {
      return;
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
      const proteinPerKgValue = parseFloat(proteinPerKg) || (proteinMin + proteinMax) / 2;
      const protein = weight * proteinPerKgValue;

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

      setRecommendedCalories(Math.round(calories));
      setRecommendedProtein(Math.round(protein));
      setRecommendedCarbs(Math.round(carbs));
      setRecommendedFat(Math.round(fat));
    } else {
      // ========== 선수 모드 ==========
      
      if (!bfPercent) {
        return;
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
      const proteinPerKgValue = parseFloat(proteinPerKg) || 1.9; // 중간값
      const protein = weight * proteinPerKgValue;

      // 지방: 총열량 20-30% (중간값 25%)
      const fatPercent = 0.25;
      const fatCalories = calories * fatPercent;
      const fat = fatCalories / 9;

      // 탄수화물: 나머지 열량
      const proteinCalories = protein * 4;
      const remainingCalories = calories - proteinCalories - fatCalories;
      const carbs = remainingCalories / 4;

      setRecommendedCalories(Math.round(calories));
      setRecommendedProtein(Math.round(protein));
      setRecommendedCarbs(Math.round(carbs));
      setRecommendedFat(Math.round(fat));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const profileData = {
        nickname,
        gender,
        age,
        height,
        currentWeight,
        bodyFatPercent,
        goalType,
        updatedAt: new Date().toISOString(),
        weeklyWorkoutFrequency,
        proteinPerKg,
        // 계산된 권장 영양소 추가
        recommendedCalories,
        recommendedProtein,
        recommendedCarbs,
        recommendedFat,
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
        toast.success("프로필이 저장되었습니다!");
      } else {
        toast.error("프로필 저장에 실패했습니다.");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("프로필 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">프로필 로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 다시 계산하기 Dialog */}
      <Dialog open={showRecalculateDialog} onOpenChange={setShowRecalculateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>일일 권장 섭취량 다시 계산</DialogTitle>
            <DialogDescription>
              '예'를 누르면 현재 신체 정보를 기반으로 재계산되며 최근 인바디와 운동 기록을 통해 수정된 섭취량은 초기화 됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-700">
              현재 신체 정보와 목표 설정 탭의 정보를 기반으로 일일 권장 섭취량이 재계산됩니다.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRecalculateDialog(false)}
            >
              아니오
            </Button>
            <Button
              onClick={() => {
                calculateRecommendations();
                toast.success("일일 권장 섭취량이 재계산되었습니다!");
                setShowRecalculateDialog(false);
              }}
            >
              예
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 권장 섭취량 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>일일 권장 섭취량</CardTitle>
              <CardDescription>
                ISSN 전략 기반 과학적 칼로리 및 영양소 계산
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRecalculateDialog(true)}
            >
              다시 계산하기
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 계산 결과 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
              <p className="text-sm text-purple-600 font-medium">칼로리</p>
              <p className="text-2xl font-bold text-purple-900">{recommendedCalories}</p>
              <p className="text-xs text-purple-600">kcal/일</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">단백질</p>
              <p className="text-2xl font-bold text-blue-900">{recommendedProtein}</p>
              <p className="text-xs text-blue-600">g/일</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
              <p className="text-sm text-green-600 font-medium">탄수화물</p>
              <p className="text-2xl font-bold text-green-900">{recommendedCarbs}</p>
              <p className="text-xs text-green-600">g/일</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg">
              <p className="text-sm text-orange-600 font-medium">지방</p>
              <p className="text-2xl font-bold text-orange-900">{recommendedFat}</p>
              <p className="text-xs text-orange-600">g/일</p>
            </div>
          </div>

          {/* 계산 공식 상세 */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-700">📐 계산 공식 상세</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCalculationDetails(!showCalculationDetails)}
                className="h-8 px-3 text-xs"
              >
                {showCalculationDetails ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-1" />
                    숨기기
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-1" />
                    자세히 보기
                  </>
                )}
              </Button>
            </div>

            {showCalculationDetails && (
              <div className="space-y-3 text-sm">
                {(() => {
                  // ⭐ 현재 신체 정보 기준으로 표시
                  const currentW = parseFloat(currentWeight) || 0;
                  const userAge = parseFloat(age) || 0;
                  const userHeight = parseFloat(height) || 0;
                  const frequency = parseInt(weeklyWorkoutFrequency);

                  // Activity factor
                  let activityFactor = 1.45;
                  let activityName = "보통";
                  
                  if (frequency === 0) {
                    activityFactor = 1.2;
                    activityName = "거의 비활동 (0회)";
                  } else if (frequency <= 2) {
                    activityFactor = 1.35;
                    activityName = "가벼운 활동 (1~2회)";
                  } else if (frequency === 3) {
                    activityFactor = 1.45;
                    activityName = "보통 (3회)";
                  } else if (frequency <= 5) {
                    activityFactor = 1.6;
                    activityName = "활동 많음 (4~5회)";
                  } else if (frequency === 6) {
                    activityFactor = 1.75;
                    activityName = "고활동 (6회 이상)";
                  } else {
                    activityFactor = 1.9;
                    activityName = "엘리트 (하루 2회/선수)";
                  }

                  // Goal adjustment
                  let goalAdjustment = 1.0;
                  let goalName = "유지";
                  if (goalType === "bulk") { goalAdjustment = 1.15; goalName = "벌크 (+15%)"; }
                  else if (goalType === "leanmass") { goalAdjustment = 1.10; goalName = "린매스 (+10%)"; }
                  else if (goalType === "fatloss") { goalAdjustment = 0.85; goalName = "감량 (-15%)"; }

                  // Frequency adjustment
                  let frequencyAdjustment = 1.0;
                  let freqName = "보정 없음";
                  if (frequency <= 2) { frequencyAdjustment = 0.95; freqName = "-5%"; }
                  else if (frequency >= 6) { frequencyAdjustment = 1.10; freqName = "+10%"; }
                  else if (frequency >= 4) { frequencyAdjustment = 1.05; freqName = "+5%"; }

                  // BMR calculation (현재 체중 기준)
                  let bmr = 0;
                  if (userAge && userHeight) {
                    if (gender === "male") {
                      bmr = (10 * currentW) + (6.25 * userHeight) - (5 * userAge) + 5;
                    } else {
                      bmr = (10 * currentW) + (6.25 * userHeight) - (5 * userAge) - 161;
                    }
                  } else {
                    if (gender === "male") {
                      bmr = currentW * 24.2;
                    } else {
                      bmr = currentW * 22;
                    }
                  }

                  // Carbs per kg (ISSN 기준으로 계산)
                  let carbsMin = 3.0;
                  let carbsMax = 5.0;
                  let fatPercent = 0.25;
                  
                  if (goalType === "bulk") {
                    carbsMin = 4.0;
                    carbsMax = 7.0;
                    fatPercent = 0.25;
                  } else if (goalType === "leanmass") {
                    carbsMin = 3.0;
                    carbsMax = 5.0;
                    fatPercent = 0.25;
                  } else if (goalType === "fatloss") {
                    carbsMin = 2.0;
                    carbsMax = 4.0;
                    fatPercent = 0.20;
                  } else {
                    carbsMin = 3.0;
                    carbsMax = 5.0;
                    fatPercent = 0.25;
                  }

                  let carbsPerKg = (carbsMin + carbsMax) / 2;
                  if (frequency <= 2) {
                    carbsPerKg = carbsMin;
                  } else if (frequency === 3) {
                    carbsPerKg = carbsMin + (carbsMax - carbsMin) * 0.33;
                  } else if (frequency <= 5) {
                    carbsPerKg = carbsMin + (carbsMax - carbsMin) * 0.66;
                  } else {
                    carbsPerKg = carbsMax;
                  }

                  return (
                    <>
                      {/* 1. 기본 정보 */}
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="font-semibold text-gray-700 mb-1">1️⃣ 현재 신체 정보 (계산 기준)</p>
                        <p className="text-gray-600">• 현재 체중: {currentW.toFixed(1)} kg</p>
                        {userAge && userHeight && (
                          <>
                            <p className="text-gray-600">• 나이: {userAge}세</p>
                            <p className="text-gray-600">• 신장: {userHeight} cm</p>
                          </>
                        )}
                      </div>

                      {/* 2. BMR 계산 */}
                      <div className="bg-blue-50 p-3 rounded">
                        <p className="font-semibold text-blue-700 mb-1">2️⃣ 기초대사량 (BMR) - Mifflin-St Jeor 공식</p>
                        {userAge && userHeight ? (
                          gender === "male" ? (
                            <p className="text-blue-600">
                              BMR = (10 × {currentW.toFixed(1)}) + (6.25 × {userHeight}) - (5 × {userAge}) + 5<br/>
                              = <span className="font-semibold">{bmr.toFixed(0)} kcal</span>
                            </p>
                          ) : (
                            <p className="text-blue-600">
                              BMR = (10 × {currentW.toFixed(1)}) + (6.25 × {userHeight}) - (5 × {userAge}) - 161<br/>
                              = <span className="font-semibold">{bmr.toFixed(0)} kcal</span>
                            </p>
                          )
                        ) : (
                          <p className="text-blue-600">
                            BMR = {currentW.toFixed(1)} × {gender === "male" ? "24.2" : "22"}<br/>
                            = <span className="font-semibold">{bmr.toFixed(0)} kcal</span> (간소화 공식)
                          </p>
                        )}
                      </div>

                      {/* 3. TDEE 계산 */}
                      <div className="bg-green-50 p-3 rounded">
                        <p className="font-semibold text-green-700 mb-1">3️⃣ 총 일일 소비 칼로리 (TDEE)</p>
                        <p className="text-green-600">
                          TDEE = BMR × 활동계수<br/>
                          = {bmr.toFixed(0)} × {activityFactor} ({activityName})<br/>
                          = <span className="font-semibold">{(bmr * activityFactor).toFixed(0)} kcal</span>
                        </p>
                      </div>

                      {/* 4. 최종 칼로리 */}
                      <div className="bg-purple-50 p-3 rounded">
                        <p className="font-semibold text-purple-700 mb-1">4️⃣ 최종 섭취 칼로리 (목표 {goalName} 적용)</p>
                        <p className="text-purple-600">
                          칼로리 = TDEE × 목표조정 × 운동빈도보정<br/>
                          = {(bmr * activityFactor).toFixed(0)} × {goalAdjustment} ({goalName}) × {frequencyAdjustment} ({freqName})<br/>
                          = <span className="font-semibold text-lg">{recommendedCalories} kcal</span>
                        </p>
                      </div>

                      {/* 5. 단백질 */}
                      <div className="bg-blue-50 p-3 rounded">
                        <p className="font-semibold text-blue-700 mb-1">5️⃣ 단백질 (⭐ 목표 제지방량 기준 - ISSN)</p>
                        <p className="text-blue-600">
                          단백질 = 목표 FFM × {proteinPerKg}g/kg<br/>
                          = {currentW.toFixed(1)} × {proteinPerKg}<br/>
                          = <span className="font-semibold text-lg">{recommendedProtein}g</span> ({(recommendedProtein * 4).toFixed(0)} kcal)
                        </p>
                      </div>

                      {/* 6. 탄수화물 */}
                      <div className="bg-green-50 p-3 rounded">
                        <p className="font-semibold text-green-700 mb-1">6️⃣ 탄수화물 (⭐ 목표 체중 기준 - ISSN)</p>
                        <p className="text-green-600">
                          탄수화물 = 목표 체중 × {carbsPerKg.toFixed(1)}g/kg<br/>
                          = {currentW.toFixed(1)} × {carbsPerKg.toFixed(1)}<br/>
                          = <span className="font-semibold text-lg">{recommendedCarbs}g</span> ({(recommendedCarbs * 4).toFixed(0)} kcal)
                        </p>
                        <p className="text-xs text-green-500 mt-1">
                          💡 ISSN 범위: {carbsMin}~{carbsMax}g/kg (운동빈도 {frequency}회 + {goalType})
                        </p>
                      </div>

                      {/* 7. 지방 */}
                      <div className="bg-orange-50 p-3 rounded">
                        <p className="font-semibold text-orange-700 mb-1">7️⃣ 지방 (⭐ TDEE의 {(fatPercent * 100).toFixed(0)}% - ISSN)</p>
                        <p className="text-orange-600">
                          지방 칼로리 = TDEE × {(fatPercent * 100).toFixed(0)}%<br/>
                          = {recommendedCalories} × {fatPercent}<br/>
                          = {(recommendedCalories * fatPercent).toFixed(0)} kcal<br/>
                          지방 = {(recommendedCalories * fatPercent).toFixed(0)} ÷ 9<br/>
                          = <span className="font-semibold text-lg">{recommendedFat}g</span>
                        </p>
                        <p className="text-xs text-orange-500 mt-1">
                          💡 ISSN 범위: {goalType === "fatloss" ? "15-25%" : "20-30%"} of TDEE
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 계정 정보 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-600" />
            <CardTitle>계정 정보</CardTitle>
          </div>
          <CardDescription>회원가입 시 입력한 정보를 확인하고 수정하세요</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="name">이름</Label>
            <Input
              id="name"
              type="text"
              placeholder="홍길동"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled
              className="bg-gray-50"
            />
            <p className="text-xs text-gray-500">💡 이름은 변경할 수 없습니다</p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              placeholder="example@email.com"
              value={email}
              disabled
              className="bg-gray-50"
            />
            <p className="text-xs text-gray-500">💡 이메일은 변경할 수 없습니다</p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="phone" className="flex items-center gap-1">
              <Phone className="w-3 h-3" />
              전화번호
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="010-1234-5678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled
              className="bg-gray-50"
            />
            <p className="text-xs text-gray-500">💡 전화번호는 변경할 수 없습니다</p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="nickname">닉네임</Label>
            <Input
              id="nickname"
              type="text"
              placeholder="닉네임"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>
          <div className="space-y-1 col-span-2">
            <Label htmlFor="address" className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              주소
            </Label>
            <Input
              id="address"
              type="text"
              placeholder="서울특별시 강남구..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled
              className="bg-gray-50"
            />
          </div>
          <div className="space-y-1 col-span-2">
            <Label htmlFor="addressDetail">상세 주소</Label>
            <Input
              id="addressDetail"
              type="text"
              placeholder="101동 1234호"
              value={addressDetail}
              onChange={(e) => setAddressDetail(e.target.value)}
              disabled
              className="bg-gray-50"
            />
            <p className="text-xs text-gray-500">💡 주소는 변경할 수 없습니다</p>
          </div>
        </CardContent>
      </Card>

      {/* 현재 신체 정보 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            <CardTitle>현재 신체 정보</CardTitle>
          </div>
          <CardDescription>사용자 유형을 선택하고 현재 신체 정보를 입력하세요</CardDescription>
        </CardHeader>
        <CardContent>
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

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
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
                <div className="space-y-1">
                  <Label htmlFor="age">나이</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="25"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="height">신장 (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    step="0.1"
                    placeholder="175.0"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="current-weight">현재 체중 (kg)</Label>
                  <Input
                    id="current-weight"
                    type="number"
                    step="0.1"
                    placeholder="75.0"
                    value={currentWeight}
                    onChange={(e) => setCurrentWeight(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="weekly-frequency">주간 운동 빈도</Label>
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

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
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
                <div className="space-y-1">
                  <Label htmlFor="age-athlete">나이</Label>
                  <Input
                    id="age-athlete"
                    type="number"
                    placeholder="25"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="height-athlete">신장 (cm)</Label>
                  <Input
                    id="height-athlete"
                    type="number"
                    step="0.1"
                    placeholder="175.0"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="current-weight-athlete">현재 체중 (kg)</Label>
                  <Input
                    id="current-weight-athlete"
                    type="number"
                    step="0.1"
                    placeholder="75.0"
                    value={currentWeight}
                    onChange={(e) => setCurrentWeight(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
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
                    💡 체성분 분석기로 측정한 값
                  </p>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="weekly-frequency-athlete">주간 운동 빈도</Label>
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
        </CardContent>
      </Card>

      {/* 목표 설정 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-green-600" />
            <CardTitle>목표 설정</CardTitle>
          </div>
          <CardDescription>운동 목표와 단백질 섭취량을 설정하세요</CardDescription>
        </CardHeader>
        <CardContent>
          {/* 일반인/선수 목표 구분 */}
          {userType === "general" ? (
            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mb-4">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-700">
                    <strong>일반인 목표:</strong> 증량, 유지, 다이어트 중 선택하세요
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="goal-type-general">목표 타입</Label>
                  <select
                    id="goal-type-general"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={goalType}
                    onChange={(e) => setGoalType(e.target.value)}
                  >
                    <option value="bulk">증량 (TDEE +15%)</option>
                    <option value="maintain">유지 (TDEE)</option>
                    <option value="diet">다이어트 (TDEE -17.5%)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="protein-per-kg-general">단백질 (g/kg)</Label>
                    <Dialog>
                      <DialogTrigger asChild>
                        <button className="text-blue-500 hover:text-blue-600 transition-colors">
                          <HelpCircle className="w-4 h-4" />
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Info className="w-5 h-5 text-blue-600" />
                            일반인 단백질 권장 범위
                          </DialogTitle>
                          <DialogDescription>
                            목표별 체중 kg당 권장 단백질 섭취량
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3 mt-4">
                          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                            <p className="font-semibold text-blue-900 mb-1">🏋️ 증량</p>
                            <p className="text-sm text-blue-700">1.6 ~ 2.2 g/kg</p>
                            <p className="text-xs text-blue-600 mt-1">근육량 증가를 위한 기본 범위</p>
                          </div>
                          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                            <p className="font-semibold text-green-900 mb-1">⚖️ 유지</p>
                            <p className="text-sm text-green-700">1.4 ~ 2.0 g/kg</p>
                            <p className="text-xs text-green-600 mt-1">현재 상태 유지를 위한 기본 범위</p>
                          </div>
                          <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                            <p className="font-semibold text-orange-900 mb-1">🔥 다이어트</p>
                            <p className="text-sm text-orange-700">2.0 ~ 3.0 g/kg</p>
                            <p className="text-xs text-orange-600 mt-1">근손실 방지를 위해 높은 단백질 섭취</p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <Input
                    id="protein-per-kg-general"
                    type="number"
                    step="0.1"
                    placeholder="1.9"
                    value={proteinPerKg}
                    onChange={(e) => setProteinPerKg(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    권장: 증량 1.9, 유지 1.7, 다이어트 2.5
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-purple-50 p-3 rounded-lg border border-purple-200 mb-4">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-purple-700">
                    <strong>선수 목표:</strong> ISSN 기준 린벌크, 유지/리컴프, 체지방 감량 중 선택하세요
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="goal-type-athlete">목표 타입</Label>
                  <select
                    id="goal-type-athlete"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={goalType}
                    onChange={(e) => setGoalType(e.target.value)}
                  >
                    <option value="lean_bulk">근육 증가/린벌크 (TDEE +10%)</option>
                    <option value="maintain">유지/리컴프 (TDEE ±5%)</option>
                    <option value="cut">체지방 감량 (TDEE -25%)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="protein-per-kg-athlete">단백질 (g/kg)</Label>
                    <Dialog>
                      <DialogTrigger asChild>
                        <button className="text-blue-500 hover:text-blue-600 transition-colors">
                          <HelpCircle className="w-4 h-4" />
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Info className="w-5 h-5 text-purple-600" />
                            선수 단백질 권장 범위 (ISSN)
                          </DialogTitle>
                          <DialogDescription>
                            ISSN 기준 체중 kg당 권장 단백질 섭취량
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3 mt-4">
                          <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                            <p className="font-semibold text-purple-900 mb-1">💪 ISSN 권장 범위</p>
                            <p className="text-sm text-purple-700">1.6 ~ 2.2 g/kg</p>
                            <p className="text-xs text-purple-600 mt-1">모든 목표에 공통 적용 (중간값 1.9)</p>
                          </div>
                          <div className="bg-indigo-50 p-2 rounded border border-indigo-200">
                            <p className="text-xs text-indigo-700">
                              💡 <strong>Tip:</strong> 선수는 목표와 관계없이 1.6~2.2g/kg 범위 내에서 설정하며, 중간값 1.9g이 적절합니다.
                            </p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <Input
                    id="protein-per-kg-athlete"
                    type="number"
                    step="0.1"
                    placeholder="1.9"
                    value={proteinPerKg}
                    onChange={(e) => setProteinPerKg(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    권장: 1.6 ~ 2.2 (중간값 1.9)
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 저장 버튼 */}
      <div className="flex justify-between items-center">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? "저장 중..." : "프로필 저장"}
        </Button>
        <AccountDeletionDialog 
          accessToken={accessToken}
          supabaseUrl={supabaseUrl}
        />
      </div>
    </div>
  );
}