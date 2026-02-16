import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Badge } from "@/app/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Dumbbell, Search, TrendingUp, DollarSign, Calendar, Users, RefreshCcw, AlertCircle, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/app/components/ui/dialog";
import { toast } from "sonner";

interface CenterStaffCoachTabProps {
  accessToken: string;
  supabaseUrl: string;
  publicAnonKey: string;
}

interface Coach {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialties: string[];
  joinedAt: string;
  status: "active" | "inactive";
  stats: {
    totalMembers: number;
    remainingSessions: number;
    monthlyRevenue: number;
    monthlySessions: number;
    monthlyRefunds: number;
    monthlySalary: number;
    sessionRate: number; // 세션당 급여
  };
}

export function CenterStaffCoachTab({ accessToken, supabaseUrl, publicAnonKey }: CenterStaffCoachTabProps) {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  useEffect(() => {
    loadCoaches();
  }, []);

  const loadCoaches = () => {
    // 데모 데이터
    setCoaches([
      {
        id: "1",
        name: "박코치",
        email: "coach1@example.com",
        phone: "010-1111-2222",
        specialties: ["웨이트 트레이닝", "다이어트"],
        joinedAt: "2024-01-10",
        status: "active",
        stats: {
          totalMembers: 15,
          remainingSessions: 180,
          monthlyRevenue: 3500000,
          monthlySessions: 45,
          monthlyRefunds: 200000,
          monthlySalary: 2310000, // (3500000 - 200000) * 0.7
          sessionRate: 50000,
        },
      },
      {
        id: "2",
        name: "최트레이너",
        email: "coach2@example.com",
        phone: "010-3333-4444",
        specialties: ["필라테스", "재활운동"],
        joinedAt: "2024-02-05",
        status: "active",
        stats: {
          totalMembers: 12,
          remainingSessions: 150,
          monthlyRevenue: 2800000,
          monthlySessions: 38,
          monthlyRefunds: 0,
          monthlySalary: 1960000,
          sessionRate: 50000,
        },
      },
      {
        id: "3",
        name: "김선생",
        email: "coach3@example.com",
        phone: "010-5555-6666",
        specialties: ["요가", "스트레칭"],
        joinedAt: "2023-11-20",
        status: "active",
        stats: {
          totalMembers: 20,
          remainingSessions: 240,
          monthlyRevenue: 4200000,
          monthlySessions: 52,
          monthlyRefunds: 300000,
          monthlySalary: 2730000,
          sessionRate: 50000,
        },
      },
    ]);
  };

  const handleViewDetails = (coach: Coach) => {
    setSelectedCoach(coach);
    setIsDetailDialogOpen(true);
  };

  const filteredCoaches = coaches.filter(
    (c) =>
      c.name.includes(searchQuery) ||
      c.email.includes(searchQuery) ||
      c.phone.includes(searchQuery)
  );

  const totalStats = {
    totalCoaches: coaches.length,
    totalMembers: coaches.reduce((sum, c) => sum + c.stats.totalMembers, 0),
    totalRevenue: coaches.reduce((sum, c) => sum + c.stats.monthlyRevenue, 0),
    totalRefunds: coaches.reduce((sum, c) => sum + c.stats.monthlyRefunds, 0),
    totalSalary: coaches.reduce((sum, c) => sum + c.stats.monthlySalary, 0),
    totalSessions: coaches.reduce((sum, c) => sum + c.stats.monthlySessions, 0),
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">스태프 코치 관리</h1>
        <p className="text-gray-500 mt-1">센터에 등록된 코치들의 매출, 급여, 수업 현황을 관리합니다</p>
      </div>

      {/* 전체 통계 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>총 코치</CardDescription>
            <CardTitle className="text-2xl">{totalStats.totalCoaches}명</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>총 담당 회원</CardDescription>
            <CardTitle className="text-2xl">{totalStats.totalMembers}명</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>이번 달 PT 매출</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {(totalStats.totalRevenue / 10000).toFixed(0)}만원
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>이번 달 환불</CardDescription>
            <CardTitle className="text-2xl text-red-600">
              {(totalStats.totalRefunds / 10000).toFixed(0)}만원
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>이번 달 급여</CardDescription>
            <CardTitle className="text-2xl text-blue-600">
              {(totalStats.totalSalary / 10000).toFixed(0)}만원
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>이번 달 수업</CardDescription>
            <CardTitle className="text-2xl">{totalStats.totalSessions}회</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* 검색 */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="코치 이름, 이메일, 전화번호로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* 코치 목록 */}
      <div className="grid gap-4">
        {filteredCoaches.map((coach) => (
          <Card key={coach.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {coach.name.charAt(0)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{coach.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      {coach.specialties.join(", ")}
                      <Badge variant="outline" className="ml-2">
                        {coach.status === "active" ? "활성" : "비활성"}
                      </Badge>
                    </CardDescription>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleViewDetails(coach)}>
                  <Eye className="w-4 h-4 mr-2" />
                  상세보기
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <div className="text-sm">
                  <div className="text-gray-500 mb-1">담당 회원</div>
                  <div className="font-semibold flex items-center gap-1">
                    <Users className="w-4 h-4 text-blue-500" />
                    {coach.stats.totalMembers}명
                  </div>
                </div>
                <div className="text-sm">
                  <div className="text-gray-500 mb-1">잔여 세션</div>
                  <div className="font-semibold flex items-center gap-1">
                    <RefreshCcw className="w-4 h-4 text-green-500" />
                    {coach.stats.remainingSessions}회
                  </div>
                </div>
                <div className="text-sm">
                  <div className="text-gray-500 mb-1">이번 달 매출</div>
                  <div className="font-semibold text-green-600 flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    {(coach.stats.monthlyRevenue / 10000).toFixed(0)}만원
                  </div>
                </div>
                <div className="text-sm">
                  <div className="text-gray-500 mb-1">이번 달 환불</div>
                  <div className="font-semibold text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {(coach.stats.monthlyRefunds / 10000).toFixed(0)}만원
                  </div>
                </div>
                <div className="text-sm">
                  <div className="text-gray-500 mb-1">이번 달 급여</div>
                  <div className="font-semibold text-blue-600 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    {(coach.stats.monthlySalary / 10000).toFixed(0)}만원
                  </div>
                </div>
                <div className="text-sm">
                  <div className="text-gray-500 mb-1">이번 달 수업</div>
                  <div className="font-semibold flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-purple-500" />
                    {coach.stats.monthlySessions}회
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 상세 다이얼로그 */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedCoach?.name} 코치 상세 정보</DialogTitle>
            <DialogDescription>코치의 매출, 급여, 수업 현황을 확인할 수 있습니다</DialogDescription>
          </DialogHeader>
          {selectedCoach && (
            <div className="space-y-6">
              {/* 기본 정보 */}
              <div>
                <h3 className="font-semibold mb-3">기본 정보</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">이메일:</span> {selectedCoach.email}
                  </div>
                  <div>
                    <span className="text-gray-500">전화번호:</span> {selectedCoach.phone}
                  </div>
                  <div>
                    <span className="text-gray-500">전문 분야:</span> {selectedCoach.specialties.join(", ")}
                  </div>
                  <div>
                    <span className="text-gray-500">입사일:</span> {selectedCoach.joinedAt}
                  </div>
                </div>
              </div>

              {/* 이번 달 통계 */}
              <div>
                <h3 className="font-semibold mb-3">이번 달 통계</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-sm text-gray-500 mb-1">PT 매출</div>
                      <div className="text-2xl font-bold text-green-600">
                        {(selectedCoach.stats.monthlyRevenue / 10000).toFixed(0)}만원
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-sm text-gray-500 mb-1">환불 금액</div>
                      <div className="text-2xl font-bold text-red-600">
                        {(selectedCoach.stats.monthlyRefunds / 10000).toFixed(0)}만원
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-sm text-gray-500 mb-1">수업 횟수</div>
                      <div className="text-2xl font-bold">
                        {selectedCoach.stats.monthlySessions}회
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-sm text-gray-500 mb-1">예상 급여 (70%)</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {(selectedCoach.stats.monthlySalary / 10000).toFixed(0)}만원
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* 급여 계산 상세 */}
              <div>
                <h3 className="font-semibold mb-3">급여 계산 내역</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>세션 단가:</span>
                    <span className="font-semibold">
                      {selectedCoach.stats.sessionRate.toLocaleString()}원
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>이번 달 매출:</span>
                    <span className="font-semibold text-green-600">
                      +{selectedCoach.stats.monthlyRevenue.toLocaleString()}원
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>이번 달 환불:</span>
                    <span className="font-semibold text-red-600">
                      -{selectedCoach.stats.monthlyRefunds.toLocaleString()}원
                    </span>
                  </div>
                  <div className="border-t pt-2 flex justify-between text-base font-bold">
                    <span>총 급여 (70%):</span>
                    <span className="text-blue-600">
                      {selectedCoach.stats.monthlySalary.toLocaleString()}원
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {filteredCoaches.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Dumbbell className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-500 text-center">
              {searchQuery ? "검색 결과가 없습니다." : "등록된 코치가 없습니다."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
