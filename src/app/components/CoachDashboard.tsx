import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { 
  Home, 
  Users, 
  MessageSquare, 
  DollarSign, 
  Dumbbell, 
  User,
  TrendingUp,
  Calendar,
  Clock,
  AlertCircle
} from "lucide-react";
import { CoachHomeTab } from "./CoachHomeTab";
import { CoachMembersTab } from "./CoachMembersTab";
import { CoachMessagesTab } from "./CoachMessagesTab";
import { CoachSalesTab } from "./CoachSalesTab";
import { CoachPTProductsTab } from "./CoachPTProductsTab";
import { CoachProfileTab } from "./CoachProfileTab";
import { CoachScheduleTab } from "./CoachScheduleTab";

interface CoachDashboardProps {
  accessToken: string;
  supabaseUrl: string;
  publicAnonKey: string;
  userId: string;
  userName: string;
  onLogout: () => void;
}

export function CoachDashboard({ 
  accessToken, 
  supabaseUrl, 
  publicAnonKey,
  userId,
  userName,
  onLogout
}: CoachDashboardProps) {
  const [activeTab, setActiveTab] = useState("home");
  const [coachProfile, setCoachProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCoachProfile();
  }, []);

  const loadCoachProfile = async () => {
    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/make-server-2c29cd73/coach-profile`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCoachProfile(data.profile);
      }
    } catch (error) {
      console.error("Error loading coach profile:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">위트비 코치 대시보드</h1>
              <p className="text-sm text-gray-500 mt-1">{coachProfile?.name || userName} 코치님 환영합니다</p>
            </div>
            <Badge className="bg-purple-600 text-white">코치</Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-7 w-full max-w-4xl">
            <TabsTrigger value="home" className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">홈</span>
            </TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">회원</span>
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">스케줄</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">메세지</span>
            </TabsTrigger>
            <TabsTrigger value="sales" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              <span className="hidden sm:inline">매출관리</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4" />
              <span className="hidden sm:inline">PT상품관리</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">프로필 설정</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="space-y-6">
            <CoachHomeTab
              accessToken={accessToken}
              supabaseUrl={supabaseUrl}
              publicAnonKey={publicAnonKey}
              coachId={userId}
            />
          </TabsContent>

          <TabsContent value="members" className="space-y-6">
            <CoachMembersTab
              accessToken={accessToken}
              supabaseUrl={supabaseUrl}
              publicAnonKey={publicAnonKey}
              coachId={userId}
            />
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
            <CoachScheduleTab
              accessToken={accessToken}
              supabaseUrl={supabaseUrl}
              publicAnonKey={publicAnonKey}
              coachId={userId}
              coachName={coachProfile?.name || userName}
            />
          </TabsContent>

          <TabsContent value="messages" className="space-y-6">
            <CoachMessagesTab
              accessToken={accessToken}
              supabaseUrl={supabaseUrl}
              publicAnonKey={publicAnonKey}
              coachId={userId}
            />
          </TabsContent>

          <TabsContent value="sales" className="space-y-6">
            <CoachSalesTab
              accessToken={accessToken}
              supabaseUrl={supabaseUrl}
              publicAnonKey={publicAnonKey}
              coachId={userId}
            />
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <CoachPTProductsTab
              accessToken={accessToken}
              supabaseUrl={supabaseUrl}
              publicAnonKey={publicAnonKey}
              coachId={userId}
              coachName={coachProfile?.name || "코치"}
            />
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <CoachProfileTab
              accessToken={accessToken}
              supabaseUrl={supabaseUrl}
              publicAnonKey={publicAnonKey}
              coachId={userId}
              onProfileUpdate={loadCoachProfile}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}