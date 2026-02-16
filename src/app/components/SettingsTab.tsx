import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { ProfileTab } from "@/app/components/ProfileTab";
import { LogOut, User, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface SettingsTabProps {
  accessToken: string;
  supabaseUrl: string;
  publicAnonKey: string;
  onLogout: () => void;
  userName: string;
}

export function SettingsTab({ accessToken, supabaseUrl, publicAnonKey, onLogout, userName }: SettingsTabProps) {
  const [showProfile, setShowProfile] = useState(false);

  const handleLogoutClick = () => {
    if (confirm("로그아웃 하시겠습니까?")) {
      onLogout();
      toast.success("로그아웃되었습니다.");
    }
  };

  if (showProfile) {
    return (
      <div className="space-y-6">
        <Button
          variant="outline"
          onClick={() => setShowProfile(false)}
          className="mb-4"
        >
          ← 설정으로 돌아가기
        </Button>
        <ProfileTab accessToken={accessToken} supabaseUrl={supabaseUrl} publicAnonKey={publicAnonKey} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>설정</CardTitle>
          <CardDescription>계정 및 앱 설정을 관리하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* 계정 섹션 */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-500 px-3">계정</h3>
            
            {/* 프로필 설정 */}
            <button
              onClick={() => setShowProfile(true)}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">프로필 설정</p>
                  <p className="text-sm text-gray-500">{userName || "사용자"}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* 기타 섹션 */}
          <div className="space-y-2 pt-4 border-t">
            <h3 className="text-sm font-semibold text-gray-500 px-3">기타</h3>
            
            {/* 로그아웃 */}
            <button
              onClick={handleLogoutClick}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-red-50 transition-colors text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition-colors">
                  <LogOut className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-red-600">로그아웃</p>
                  <p className="text-sm text-gray-500">계정에서 로그아웃합니다</p>
                </div>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* 앱 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Whitby</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-gray-600">버전</span>
            <span className="text-sm font-medium text-gray-900">1.0.0</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-gray-600">개발자</span>
            <span className="text-sm font-medium text-gray-900">Whitby Team</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
