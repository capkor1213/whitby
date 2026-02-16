import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Activity, Plus } from "lucide-react";

interface InBodyTabProps {
  accessToken: string;
  supabaseUrl: string;
  publicAnonKey: string;
}

export function InBodyTab({ accessToken, supabaseUrl, publicAnonKey }: InBodyTabProps) {
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [measurementDate, setMeasurementDate] = useState(new Date().toISOString().split("T")[0]);
  const [weight, setWeight] = useState("");
  const [muscleMass, setMuscleMass] = useState("");
  const [bodyFat, setBodyFat] = useState("");

  useEffect(() => {
    loadMeasurements();
  }, []);

  const loadMeasurements = async () => {
    setIsLoading(true);
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
      toast.error("측정 기록 로딩 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!weight || !muscleMass || !bodyFat) {
      toast.error("모든 항목을 입력해주세요.");
      return;
    }

    setIsSaving(true);
    try {
      // 1. 인바디 기록 저장
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
        // 2. 프로필의 현 신체 정보 자동 업데이트
        await updateCurrentBodyInfo();
        
        toast.success("인바디 측정 기록이 저장되었습니다!");
        setWeight("");
        setMuscleMass("");
        setBodyFat("");
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

  const updateCurrentBodyInfo = async () => {
    try {
      // 현재 프로필 정보 가져오기
      const profileResponse = await fetch(`${supabaseUrl}/functions/v1/make-server-2c29cd73/profile`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        const currentProfile = profileData.profile || {};

        // 현재 신체 정보 업데이트
        const updatedProfile = {
          ...currentProfile,
          currentWeight: parseFloat(weight),
          currentMuscleMass: parseFloat(muscleMass),
          currentBodyFat: parseFloat(bodyFat),
          updatedAt: new Date().toISOString(),
        };

        // 프로필 업데이트
        await fetch(`${supabaseUrl}/functions/v1/make-server-2c29cd73/profile`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(updatedProfile),
        });
      }
    } catch (error) {
      console.error("Error updating current body info:", error);
      // 에러가 발생해도 인바디 기록은 저장되었으므로 무시
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
          toast.success("AI 피드백이 자동으로 생성되었습니다! 피드백 탭에서 확인하세요.");
        }
      }
    } catch (error) {
      console.error("Error generating auto feedback:", error);
      // Don't show error toast for auto-feedback failure to avoid confusion
    }
  };

  const latestMeasurement = measurements.length > 0 ? measurements[measurements.length - 1] : null;
  const firstMeasurement = measurements.length > 0 ? measurements[0] : null;

  const progress = latestMeasurement && firstMeasurement ? {
    weight: latestMeasurement.weight - firstMeasurement.weight,
    muscleMass: latestMeasurement.muscleMass - firstMeasurement.muscleMass,
    bodyFat: latestMeasurement.bodyFat - firstMeasurement.bodyFat,
  } : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-red-600" />
            <CardTitle>인바디 기록</CardTitle>
          </div>
          <CardDescription>인바디 측정 결과를 입력하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
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
          </div>
          <Button onClick={handleSave} className="w-full mt-4" disabled={isSaving}>
            <Plus className="w-4 h-4 mr-2" />
            {isSaving ? "저장 중..." : "측정 기록 추가"}
          </Button>
        </CardContent>
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

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500">측정 기록 로딩 중...</p>
        </div>
      )}

      {!isLoading && measurements.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">아직 측정 기록이 없습니다.</p>
            <p className="text-sm text-gray-400 mt-2">위 양식을 사용하여 첫 측정 기록을 추가하세요.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}