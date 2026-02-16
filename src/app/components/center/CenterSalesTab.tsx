import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { BarChart3, TrendingUp, Calendar } from "lucide-react";

interface CenterSalesTabProps {
  accessToken: string;
  supabaseUrl: string;
  publicAnonKey: string;
}

export function CenterSalesTab({ accessToken, supabaseUrl, publicAnonKey }: CenterSalesTabProps) {
  const monthlyData = [
    { month: "1월", revenue: 38500000, members: 12 },
    { month: "2월", revenue: 45230000, members: 15 },
  ];

  const recentTransactions = [
    { date: "2026-02-09", member: "김철수", item: "6개월권", amount: 600000 },
    { date: "2026-02-08", member: "이영희", item: "3개월권", amount: 330000 },
    { date: "2026-02-07", member: "박민수", item: "1개월권", amount: 120000 },
    { date: "2026-02-07", member: "정수연", item: "PT 10회권", amount: 500000 },
    { date: "2026-02-06", member: "최지훈", item: "6개월권", amount: 600000 },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">매출 관리</h2>
        <p className="text-gray-500 mt-2">센터의 매출 현황을 확인합니다</p>
      </div>

      {/* 주요 지표 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">이번 달 매출</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₩45,230,000</div>
            <p className="text-xs text-green-600 mt-1">
              +17.3% 전월 대비
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">이번 달 신규 회원</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15명</div>
            <p className="text-xs text-green-600 mt-1">
              +25% 전월 대비
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 객단가</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₩380,000</div>
            <p className="text-xs text-gray-500 mt-1">
              이번 달 기준
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 월별 매출 추이 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>월별 매출 추이</CardTitle>
          <CardDescription>최근 2개월 매출 현황</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {monthlyData.map((data, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{data.month}</span>
                  <span className="text-gray-600">
                    ₩{data.revenue.toLocaleString()} | 신규 {data.members}명
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${(data.revenue / 50000000) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 최근 거래 내역 */}
      <Card>
        <CardHeader>
          <CardTitle>최근 거래 내역</CardTitle>
          <CardDescription>최근 5건의 결제 내역</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">날짜</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">회원명</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">상품</th>
                  <th className="text-right py-3 px-4 font-semibold text-sm text-gray-700">금액</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((transaction, index) => (
                  <tr key={index} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-600">{transaction.date}</td>
                    <td className="py-3 px-4 font-medium">{transaction.member}</td>
                    <td className="py-3 px-4 text-gray-600">{transaction.item}</td>
                    <td className="py-3 px-4 text-right font-semibold">
                      ₩{transaction.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2">
                  <td colSpan={3} className="py-3 px-4 font-semibold text-gray-900">
                    총 합계
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-lg text-blue-600">
                    ₩{recentTransactions.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
