import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Users, DollarSign, Calendar, TrendingUp, UserCheck, UserX, Clock, AlertTriangle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

interface CenterHomeTabProps {
  accessToken: string;
  supabaseUrl: string;
  publicAnonKey: string;
}

export function CenterHomeTab({ accessToken, supabaseUrl, publicAnonKey }: CenterHomeTabProps) {
  // 데모 데이터
  const lowAttendanceMembers = [
    { name: "김민수", visits: 2, lastVisit: "2026-02-07", membership: "3개월권" },
    { name: "이서연", visits: 1, lastVisit: "2026-02-05", membership: "6개월권" },
    { name: "박준호", visits: 2, lastVisit: "2026-02-06", membership: "1개월권" },
    { name: "최유진", visits: 1, lastVisit: "2026-02-04", membership: "3개월권" },
    { name: "정민지", visits: 2, lastVisit: "2026-02-08", membership: "6개월권" },
  ];

  const genderData = [
    { name: "남성", value: 112, color: "#3b82f6" },
    { name: "여성", value: 77, color: "#ec4899" },
  ];

  const ageData = [
    { name: "20대", value: 45 },
    { name: "30대", value: 68 },
    { name: "40대", value: 52 },
    { name: "50대", value: 19 },
    { name: "60대+", value: 5 },
  ];

  const membershipData = [
    { name: "1개월권", value: 42, color: "#f59e0b" },
    { name: "3개월권", value: 78, color: "#10b981" },
    { name: "6개월권", value: 51, color: "#6366f1" },
    { name: "1년권", value: 18, color: "#8b5cf6" },
  ];

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-900">대시보드</h2>
        <p className="text-gray-500 mt-1 text-sm">센터 운영 현황을 한눈에 확인하세요</p>
      </div>

      {/* 주요 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium">총 회원 수</CardTitle>
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-xl font-bold">234</div>
            <p className="text-[10px] text-muted-foreground">
              전체 등록 회원
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium">활성 회원 수</CardTitle>
            <UserCheck className="h-3.5 w-3.5 text-green-600" />
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-xl font-bold text-green-600">189</div>
            <p className="text-[10px] text-muted-foreground">
              현재 이용 중
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium">만료 1달 임박</CardTitle>
            <Clock className="h-3.5 w-3.5 text-orange-600" />
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-xl font-bold text-orange-600">23</div>
            <p className="text-[10px] text-muted-foreground">
              30일 이내 만료
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium">만료된 회원</CardTitle>
            <UserX className="h-3.5 w-3.5 text-red-600" />
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-xl font-bold text-red-600">22</div>
            <p className="text-[10px] text-muted-foreground">
              재등록 필요
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
            <CardTitle className="text-xs font-medium">이번 달 매출</CardTitle>
            <DollarSign className="h-3.5 w-3.5 text-blue-600" />
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-xl font-bold text-blue-600">₩45,230,000</div>
            <p className="text-[10px] text-muted-foreground">
              +20.1% 전월 대비
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 분석 차트 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
        <Card className="shadow-sm">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-medium">활성회원 성별비</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-2">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={60}
                  dataKey="value"
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-medium">활성회원 연령대</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-2">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={ageData}
                margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
              >
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-medium">활성회원 멤버십 종류 비율</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-2">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={membershipData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={60}
                  dataKey="value"
                >
                  {membershipData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 출석저조자 관리 */}
      <div className="grid grid-cols-1 gap-3">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-3 px-4">
            <div>
              <CardTitle className="text-sm font-medium">출석저조자 관리</CardTitle>
              <CardDescription className="text-xs mt-1">주 3회 이하 사용자 ({lowAttendanceMembers.length}명)</CardDescription>
            </div>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">이름</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">주간 방문</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">최근 방문일</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">회원권</th>
                  </tr>
                </thead>
                <tbody>
                  {lowAttendanceMembers.map((member, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium text-gray-900">{member.name}</td>
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          {member.visits}회
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-600">{member.lastVisit}</td>
                      <td className="px-3 py-2 text-gray-600">{member.membership}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
