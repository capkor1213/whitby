import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { 
  Users, 
  Dumbbell, 
  DollarSign, 
  TrendingUp,
  Calendar,
  RefreshCcw,
  AlertCircle,
  MessageSquare
} from "lucide-react";

interface CoachHomeTabProps {
  accessToken: string;
  supabaseUrl: string;
  publicAnonKey: string;
  coachId: string;
}

interface CoachStats {
  currentMembers: number;
  remainingSessions: number;
  monthlyRevenue: number;
  monthlySalary: number;
  monthlyTotalClasses: number;
  monthlyRefunds: number;
  monthlyExpiring: number;
}

export function CoachHomeTab({ 
  accessToken, 
  supabaseUrl, 
  publicAnonKey,
  coachId
}: CoachHomeTabProps) {
  const [stats, setStats] = useState<CoachStats>({
    currentMembers: 0,
    remainingSessions: 0,
    monthlyRevenue: 0,
    monthlySalary: 0,
    monthlyTotalClasses: 0,
    monthlyRefunds: 0,
    monthlyExpiring: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${supabaseUrl}/functions/v1/make-server-2c29cd73/coach-stats`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error loading coach stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">통계 로딩 중...</p>
      </div>
    );
  }

  const currentMonth = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long" });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">대시보드 홈</h2>
        <p className="text-gray-500 mt-1">코치님의 운영 현황을 확인하세요</p>
      </div>

      {/* 주요 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">현재 관리 회원 수</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.currentMembers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              활성 회원
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">현재 잔여 PT세션 수</CardTitle>
            <Dumbbell className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.remainingSessions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              남은 세션
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">이번 달 PT 매출</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₩{stats.monthlyRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {currentMonth}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">이번 달 급여</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">₩{stats.monthlySalary.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              예상 급여
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 추가 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">이번 달 총 수업 수</CardTitle>
            <Calendar className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">{stats.monthlyTotalClasses}</div>
            <p className="text-xs text-muted-foreground mt-1">
              진행한 세션
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">이번 달 환불 금액</CardTitle>
            <RefreshCcw className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">₩{stats.monthlyRefunds.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {currentMonth}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">이번 달 만기자 수</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.monthlyExpiring}</div>
            <p className="text-xs text-muted-foreground mt-1">
              PT 만료 예정 회원
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 빠른 액션 */}
      <Card>
        <CardHeader>
          <CardTitle>빠른 작업</CardTitle>
          <CardDescription>자주 사용하는 기능에 빠르게 접근하세요</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-center">
            <Users className="w-6 h-6 mx-auto mb-2 text-purple-600" />
            <p className="text-sm font-medium">회원 관리</p>
          </button>
          <button className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-center">
            <Dumbbell className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <p className="text-sm font-medium">PT 상품</p>
          </button>
          <button className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-center">
            <MessageSquare className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <p className="text-sm font-medium">메시지 보내기</p>
          </button>
          <button className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-center">
            <Calendar className="w-6 h-6 mx-auto mb-2 text-orange-600" />
            <p className="text-sm font-medium">일정 보기</p>
          </button>
        </CardContent>
      </Card>
    </div>
  );
}