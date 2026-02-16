import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { ProfileTab } from "@/app/components/ProfileTab";
import { DailyLogTab } from "@/app/components/DailyLogTab";
import { WeeklyAnalysisTab } from "@/app/components/WeeklyAnalysisTab";
import { StoreTab } from "@/app/components/StoreTab";
import { SettingsTab } from "@/app/components/SettingsTab";
import { AdminDashboard } from "@/app/components/AdminDashboard";
import { Settings, User, Dumbbell } from "lucide-react";
import whitbyLogo from "figma:asset/e51e097fc8aad7c73b8d6f36e3388a97303b1760.png";
import { getSupabaseClient } from "@/utils/supabase/client";

interface DashboardProps {
  accessToken: string;
  onLogout: () => void;
  supabaseUrl: string;
  publicAnonKey: string;
  userName: string;
}

export function Dashboard({ accessToken, onLogout, supabaseUrl, publicAnonKey, userName: initialUserName }: DashboardProps) {
  const [userName, setUserName] = useState(initialUserName);
  const [userType, setUserType] = useState("member");
  const [certification, setCertification] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [showSettings, setShowSettings] = useState(false); // 설정 페이지 표시 여부

  const supabase = getSupabaseClient();

  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const { data } = await supabase.auth.getUser(accessToken);
        
        if (data.user?.user_metadata) {
          setUserName(data.user.user_metadata.name || "");
          setUserType(data.user.user_metadata.userType || "member");
          setCertification(data.user.user_metadata.certification || "");
          setSpecialty(data.user.user_metadata.specialty || "");
        }
      } catch (error) {
        console.error("Error loading user info:", error);
      }
    };

    loadUserInfo();
  }, [accessToken]);

  // 관리자인 경우 관리자 대시보드 표시
  if (userType === "admin") {
    return <AdminDashboard accessToken={accessToken} onLogout={onLogout} />;
  }

  // 설정 페이지 표시
  if (showSettings) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center">
                  <img src={whitbyLogo} alt="Whitby Logo" className="h-10 w-auto object-contain" />
                </div>
                <div>
                  <h1 className="text-2xl text-gray-900" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 700 }}>Whitby</h1>
                  <p className="text-sm text-gray-500">설정</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowSettings(false)}
                size="sm"
              >
                닫기
              </Button>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <SettingsTab 
            accessToken={accessToken} 
            supabaseUrl={supabaseUrl} 
            publicAnonKey={publicAnonKey}
            onLogout={onLogout}
            userName={userName}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center">
                <img src={whitbyLogo} alt="Whitby Logo" className="h-10 w-auto object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl text-gray-900" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 700 }}>Whitby</h1>
                  {userType === "coach" ? (
                    <Badge className="bg-purple-600 hover:bg-purple-700">
                      <Dumbbell className="w-3 h-3 mr-1" />
                      코치
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <User className="w-3 h-3 mr-1" />
                      회원
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-500">주간별 운동 관리</p>
              </div>
            </div>
            
            {/* 오른쪽: 환영 메시지 + 설정 아이콘 */}
            <div className="flex flex-col items-end gap-1">
              <p className="text-sm text-gray-700">
                {userName || "사용자"} 환영합니다
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(true)}
                className="h-9 w-9 p-0"
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="daily" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="daily">일일 기록</TabsTrigger>
            <TabsTrigger value="weekly">주간 분석</TabsTrigger>
            <TabsTrigger value="store">스토어</TabsTrigger>
          </TabsList>

          <TabsContent value="daily" forceMount className="data-[state=inactive]:hidden">
            <DailyLogTab accessToken={accessToken} supabaseUrl={supabaseUrl} publicAnonKey={publicAnonKey} />
          </TabsContent>

          <TabsContent value="weekly" forceMount className="data-[state=inactive]:hidden">
            <WeeklyAnalysisTab accessToken={accessToken} supabaseUrl={supabaseUrl} publicAnonKey={publicAnonKey} />
          </TabsContent>

          <TabsContent value="store" forceMount className="data-[state=inactive]:hidden">
            <StoreTab accessToken={accessToken} supabaseUrl={supabaseUrl} publicAnonKey={publicAnonKey} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}