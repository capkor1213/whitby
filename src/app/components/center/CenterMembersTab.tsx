import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { UserCheck, UserX, ClipboardList } from "lucide-react";
import { ActiveMembersTab } from "./members/ActiveMembersTab";
import { InactiveMembersTab } from "./members/InactiveMembersTab";
import { AttendanceTab } from "./members/AttendanceTab";

interface CenterMembersTabProps {
  accessToken: string;
  supabaseUrl: string;
  publicAnonKey: string;
}

export function CenterMembersTab({ accessToken, supabaseUrl, publicAnonKey }: CenterMembersTabProps) {
  const [activeSubTab, setActiveSubTab] = useState("active");

  const subTabs = [
    { id: "active", label: "활성 고객 관리", icon: UserCheck },
    { id: "inactive", label: "종료 고객 관리", icon: UserX },
    { id: "attendance", label: "출석부", icon: ClipboardList },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* 상단 헤더 */}
      <div className="p-6 border-b bg-white">
        <h2 className="text-2xl font-bold text-gray-900">회원 관리</h2>
        <p className="text-gray-500 mt-1 text-sm">센터 회원 정보를 관리합니다</p>
      </div>

      {/* 서브 탭 네비게이션 */}
      <div className="bg-white border-b px-6">
        <div className="flex gap-1">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  activeSubTab === tab.id
                    ? "border-blue-600 text-blue-600 font-medium"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 서브 탭 콘텐츠 */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {activeSubTab === "active" && (
          <ActiveMembersTab 
            accessToken={accessToken} 
            supabaseUrl={supabaseUrl} 
            publicAnonKey={publicAnonKey} 
          />
        )}
        {activeSubTab === "inactive" && (
          <InactiveMembersTab 
            accessToken={accessToken} 
            supabaseUrl={supabaseUrl} 
            publicAnonKey={publicAnonKey} 
          />
        )}
        {activeSubTab === "attendance" && (
          <AttendanceTab 
            accessToken={accessToken} 
            supabaseUrl={supabaseUrl} 
            publicAnonKey={publicAnonKey} 
          />
        )}
      </div>
    </div>
  );
}
