import { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Home, Users, Key, MessageSquare, DollarSign, Package, Settings, Grid3x3, Dumbbell, UserCog, ChevronDown, ChevronRight, Briefcase, Wallet, Calendar } from "lucide-react";
import { CenterHomeTab } from "@/app/components/center/CenterHomeTab";
import { CenterMembersTab } from "@/app/components/center/CenterMembersTab";
import { CenterLockersTab } from "@/app/components/center/CenterLockersTab";
import { CenterMessagesTab } from "@/app/components/center/CenterMessagesTab";
import { CenterSalesTab } from "@/app/components/center/CenterSalesTab";
import { CenterProductsTab } from "@/app/components/center/CenterProductsTab";
import { CenterSettingsTab } from "@/app/components/center/CenterSettingsTab";
import { CenterServicesTab } from "@/app/components/center/CenterServicesTab";
import { CenterCoachesTab } from "@/app/components/center/CenterCoachesTab";
import { CenterManagersTab } from "@/app/components/center/CenterManagersTab";
import { CenterStaffCoachTab } from "@/app/components/center/CenterStaffCoachTab";
import { CenterSalaryTab } from "@/app/components/center/CenterSalaryTab";
import { CenterGXManageTab } from "@/app/components/center/CenterGXManageTab";
import { CenterGXScheduleTab } from "@/app/components/center/CenterGXScheduleTab";

interface CenterDashboardProps {
  accessToken: string;
  supabaseUrl: string;
  publicAnonKey: string;
  onLogout: () => void;
  userName: string;
  userId: string;
}

export function CenterDashboard({ accessToken, supabaseUrl, publicAnonKey, onLogout, userName, userId }: CenterDashboardProps) {
  const [activeTab, setActiveTab] = useState("home");
  const [centerLogo, setCenterLogo] = useState("");
  const [staffMenuExpanded, setStaffMenuExpanded] = useState(false);
  const [gxMenuExpanded, setGxMenuExpanded] = useState(false);

  useEffect(() => {
    loadCenterProfile();
  }, []);

  const loadCenterProfile = async () => {
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/make-server-2c29cd73/centers/${userId}`, {
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCenterLogo(data.center?.logo || "");
      }
    } catch (error) {
      console.error("센터 프로필 로딩 에러:", error);
    }
  };

  const navItems = [
    { id: "home", label: "홈", icon: Home },
    { id: "members", label: "회원", icon: Users },
    { id: "coaches", label: "코치", icon: Dumbbell },
    { id: "lockers", label: "락커", icon: Key },
    { id: "messages", label: "메세지/쿠폰", icon: MessageSquare },
    { id: "sales", label: "매출관리", icon: DollarSign },
    { id: "products", label: "상품관리", icon: Package },
    { id: "settings", label: "센터 설정", icon: Settings },
    { id: "services", label: "서비스 선택", icon: Grid3x3 },
  ];

  const staffSubMenu = [
    { id: "staff-managers", label: "매니저", icon: UserCog },
    { id: "staff-coaches", label: "코치", icon: Dumbbell },
    { id: "staff-salary", label: "급여", icon: Wallet },
  ];

  const gxSubMenu = [
    { id: "gx-manage", label: "GX관리", icon: Users },
    { id: "gx-schedule", label: "스케줄 관리", icon: Calendar },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 왼쪽 사이드바 */}
      <div className="w-64 bg-white border-r flex flex-col">
        {/* 헤더 */}
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            {centerLogo && (
              <Avatar className="w-10 h-10">
                <AvatarImage src={centerLogo} alt={userName} />
                <AvatarFallback className="bg-green-100 text-green-600 text-sm">
                  {userName.charAt(0)}
                </AvatarFallback>
              </Avatar>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Whitby</h1>
              <p className="text-sm text-gray-500 mt-1">센터 관리</p>
            </div>
          </div>
        </div>

        {/* 네비게이션 */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === item.id
                    ? "bg-blue-50 text-blue-600 font-medium"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
          
          {/* 직원 메뉴 (확장 가능) */}
          <div className="space-y-1">
            <button
              onClick={() => setStaffMenuExpanded(!staffMenuExpanded)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Briefcase className="w-5 h-5" />
                <span>직원</span>
              </div>
              {staffMenuExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
            
            {/* 직원 하위 메뉴 */}
            {staffMenuExpanded && (
              <div className="ml-4 space-y-1">
                {staffSubMenu.map((subItem) => {
                  const SubIcon = subItem.icon;
                  return (
                    <button
                      key={subItem.id}
                      onClick={() => setActiveTab(subItem.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm ${
                        activeTab === subItem.id
                          ? "bg-blue-50 text-blue-600 font-medium"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <SubIcon className="w-4 h-4" />
                      <span>{subItem.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* GX 메뉴 (확장 가능) */}
          <div className="space-y-1">
            <button
              onClick={() => setGxMenuExpanded(!gxMenuExpanded)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Briefcase className="w-5 h-5" />
                <span>GX</span>
              </div>
              {gxMenuExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
            
            {/* GX 하위 메뉴 */}
            {gxMenuExpanded && (
              <div className="ml-4 space-y-1">
                {gxSubMenu.map((subItem) => {
                  const SubIcon = subItem.icon;
                  return (
                    <button
                      key={subItem.id}
                      onClick={() => setActiveTab(subItem.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm ${
                        activeTab === subItem.id
                          ? "bg-blue-50 text-blue-600 font-medium"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <SubIcon className="w-4 h-4" />
                      <span>{subItem.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* 사용자 정보 & 로그아웃 */}
        <div className="p-4 border-t">
          <div className="mb-3">
            <p className="text-sm font-medium text-gray-900">{userName}</p>
            <p className="text-xs text-gray-500">센터 관리자</p>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={onLogout}
          >
            로그아웃
          </Button>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "home" && <CenterHomeTab accessToken={accessToken} supabaseUrl={supabaseUrl} publicAnonKey={publicAnonKey} />}
        {activeTab === "members" && <CenterMembersTab accessToken={accessToken} supabaseUrl={supabaseUrl} publicAnonKey={publicAnonKey} />}
        {activeTab === "coaches" && <CenterCoachesTab accessToken={accessToken} supabaseUrl={supabaseUrl} publicAnonKey={publicAnonKey} />}
        {activeTab === "lockers" && <CenterLockersTab accessToken={accessToken} supabaseUrl={supabaseUrl} publicAnonKey={publicAnonKey} />}
        {activeTab === "messages" && <CenterMessagesTab accessToken={accessToken} supabaseUrl={supabaseUrl} publicAnonKey={publicAnonKey} />}
        {activeTab === "sales" && <CenterSalesTab accessToken={accessToken} supabaseUrl={supabaseUrl} publicAnonKey={publicAnonKey} />}
        {activeTab === "products" && <CenterProductsTab accessToken={accessToken} supabaseUrl={supabaseUrl} publicAnonKey={publicAnonKey} />}
        {activeTab === "settings" && <CenterSettingsTab accessToken={accessToken} supabaseUrl={supabaseUrl} publicAnonKey={publicAnonKey} />}
        {activeTab === "services" && <CenterServicesTab accessToken={accessToken} supabaseUrl={supabaseUrl} publicAnonKey={publicAnonKey} />}
        {activeTab === "staff-managers" && <CenterManagersTab accessToken={accessToken} supabaseUrl={supabaseUrl} publicAnonKey={publicAnonKey} />}
        {activeTab === "staff-coaches" && <CenterStaffCoachTab accessToken={accessToken} supabaseUrl={supabaseUrl} publicAnonKey={publicAnonKey} />}
        {activeTab === "staff-salary" && <CenterSalaryTab accessToken={accessToken} supabaseUrl={supabaseUrl} publicAnonKey={publicAnonKey} />}
        {activeTab === "gx-manage" && <CenterGXManageTab accessToken={accessToken} supabaseUrl={supabaseUrl} publicAnonKey={publicAnonKey} />}
        {activeTab === "gx-schedule" && <CenterGXScheduleTab accessToken={accessToken} supabaseUrl={supabaseUrl} publicAnonKey={publicAnonKey} />}
      </div>
    </div>
  );
}