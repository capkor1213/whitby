import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Wallet, DollarSign, TrendingUp, TrendingDown, Calendar, Edit, Save, User } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { toast } from "sonner";

interface CenterSalaryTabProps {
  accessToken: string;
  supabaseUrl: string;
  publicAnonKey: string;
}

interface SalaryConfig {
  baseSalary: number;
  sessionCommissionRate: number; // 세션당 수수료율 (%)
  sessionRate: number; // 세션 단가
  bonusRate: number; // 보너스율 (%)
  commissionTiers: CommissionTier[]; // 매출별 커미션 등급
}

interface CommissionTier {
  minRevenue: number; // 최소 매출
  maxRevenue: number; // 최대 매출 (0이면 무제한)
  rate: number; // 커미션율 (%)
}

interface StaffSalary {
  id: string;
  name: string;
  role: "coach" | "manager";
  baseSalary: number;
  commission: number;
  sessionIncome: number;
  refunds: number;
  bonus: number;
  totalSalary: number;
  sessions: number;
}

export function CenterSalaryTab({ accessToken, supabaseUrl, publicAnonKey }: CenterSalaryTabProps) {
  const [selectedMonth, setSelectedMonth] = useState("2025-02");
  const [salaries, setSalaries] = useState<StaffSalary[]>([]);
  const [salaryConfig, setSalaryConfig] = useState<SalaryConfig>({
    baseSalary: 2500000,
    sessionCommissionRate: 70,
    sessionRate: 50000,
    bonusRate: 5,
    commissionTiers: [
      { minRevenue: 0, maxRevenue: 1000000, rate: 50 },
      { minRevenue: 1000000, maxRevenue: 2000000, rate: 60 },
      { minRevenue: 2000000, maxRevenue: 0, rate: 70 },
    ],
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadSalaries();
  }, [selectedMonth]);

  const loadSalaries = () => {
    // 데모 데이터
    setSalaries([
      {
        id: "1",
        name: "박코치",
        role: "coach",
        baseSalary: 0,
        commission: 2310000,
        sessionIncome: 3500000,
        refunds: 200000,
        bonus: 0,
        totalSalary: 2310000,
        sessions: 45,
      },
      {
        id: "2",
        name: "최트레이너",
        role: "coach",
        baseSalary: 0,
        commission: 1960000,
        sessionIncome: 2800000,
        refunds: 0,
        bonus: 0,
        totalSalary: 1960000,
        sessions: 38,
      },
      {
        id: "3",
        name: "김선생",
        role: "coach",
        baseSalary: 0,
        commission: 2730000,
        sessionIncome: 4200000,
        refunds: 300000,
        bonus: 0,
        totalSalary: 2730000,
        sessions: 52,
      },
      {
        id: "4",
        name: "김매니저",
        role: "manager",
        baseSalary: 2500000,
        commission: 0,
        sessionIncome: 0,
        refunds: 0,
        bonus: 125000,
        totalSalary: 2625000,
        sessions: 0,
      },
    ]);
  };

  const handleSaveConfig = () => {
    toast.success("급여 설정이 저장되었습니다.");
    setIsEditing(false);
  };

  const totalStats = {
    totalSalary: salaries.reduce((sum, s) => sum + s.totalSalary, 0),
    totalCommission: salaries.reduce((sum, s) => sum + s.commission, 0),
    totalSessionIncome: salaries.reduce((sum, s) => sum + s.sessionIncome, 0),
    totalRefunds: salaries.reduce((sum, s) => sum + s.refunds, 0),
    totalBonus: salaries.reduce((sum, s) => sum + s.bonus, 0),
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">급여 관리</h1>
          <p className="text-gray-500 mt-1">기본급, 커미션, 수업료, 환불 등을 관리합니다</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2025-02">2025년 2월</SelectItem>
              <SelectItem value="2025-01">2025년 1월</SelectItem>
              <SelectItem value="2024-12">2024년 12월</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">급여 현황</TabsTrigger>
          <TabsTrigger value="details">상세 내역</TabsTrigger>
          <TabsTrigger value="settings">급여 설정</TabsTrigger>
        </TabsList>

        {/* 급여 현황 */}
        <TabsContent value="overview" className="space-y-6">
          {/* 전체 통계 */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>총 급여</CardDescription>
                <CardTitle className="text-2xl text-blue-600">
                  {(totalStats.totalSalary / 10000).toFixed(0)}만원
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>총 커미션</CardDescription>
                <CardTitle className="text-2xl text-green-600">
                  {(totalStats.totalCommission / 10000).toFixed(0)}만원
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>수업료 수입</CardDescription>
                <CardTitle className="text-2xl text-purple-600">
                  {(totalStats.totalSessionIncome / 10000).toFixed(0)}만원
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>총 환불</CardDescription>
                <CardTitle className="text-2xl text-red-600">
                  {(totalStats.totalRefunds / 10000).toFixed(0)}만원
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>총 보너스</CardDescription>
                <CardTitle className="text-2xl text-yellow-600">
                  {(totalStats.totalBonus / 10000).toFixed(0)}만원
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* 직원별 급여 */}
          <Card>
            <CardHeader>
              <CardTitle>직원별 급여 내역</CardTitle>
              <CardDescription>{selectedMonth} 급여 현황</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {salaries.map((salary) => (
                  <div
                    key={salary.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {salary.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold">{salary.name}</div>
                        <div className="text-sm text-gray-500">
                          {salary.role === "coach" ? "코치" : "매니저"}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-blue-600">
                        {salary.totalSalary.toLocaleString()}원
                      </div>
                      <div className="text-sm text-gray-500">
                        {salary.sessions > 0 && `수업 ${salary.sessions}회`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 상세 내역 */}
        <TabsContent value="details" className="space-y-6">
          <div className="grid gap-4">
            {salaries.map((salary) => (
              <Card key={salary.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{salary.name}</CardTitle>
                    <div className="text-2xl font-bold text-blue-600">
                      {salary.totalSalary.toLocaleString()}원
                    </div>
                  </div>
                  <CardDescription>
                    {salary.role === "coach" ? "코치" : "매니저"} • {selectedMonth}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {salary.baseSalary > 0 && (
                      <div className="flex justify-between items-center pb-2 border-b">
                        <span className="text-gray-600">기본급</span>
                        <span className="font-semibold">
                          +{salary.baseSalary.toLocaleString()}원
                        </span>
                      </div>
                    )}
                    {salary.sessionIncome > 0 && (
                      <div className="flex justify-between items-center pb-2 border-b">
                        <span className="text-gray-600">
                          수업료 수입 ({salary.sessions}회)
                        </span>
                        <span className="font-semibold text-green-600">
                          +{salary.sessionIncome.toLocaleString()}원
                        </span>
                      </div>
                    )}
                    {salary.refunds > 0 && (
                      <div className="flex justify-between items-center pb-2 border-b">
                        <span className="text-gray-600">환불</span>
                        <span className="font-semibold text-red-600">
                          -{salary.refunds.toLocaleString()}원
                        </span>
                      </div>
                    )}
                    {salary.commission > 0 && (
                      <div className="flex justify-between items-center pb-2 border-b">
                        <span className="text-gray-600">
                          커미션 ({salaryConfig.sessionCommissionRate}%)
                        </span>
                        <span className="font-semibold text-blue-600">
                          +{salary.commission.toLocaleString()}원
                        </span>
                      </div>
                    )}
                    {salary.bonus > 0 && (
                      <div className="flex justify-between items-center pb-2 border-b">
                        <span className="text-gray-600">보너스</span>
                        <span className="font-semibold text-yellow-600">
                          +{salary.bonus.toLocaleString()}원
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 text-lg font-bold">
                      <span>총 급여</span>
                      <span className="text-blue-600">
                        {salary.totalSalary.toLocaleString()}원
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 급여 설정 */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>급여 정책 설정</CardTitle>
                  <CardDescription>기본급, 커미션율, 세션 단가 등을 설정합니다</CardDescription>
                </div>
                <Button
                  onClick={() => (isEditing ? handleSaveConfig() : setIsEditing(true))}
                  variant={isEditing ? "default" : "outline"}
                >
                  {isEditing ? (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      저장
                    </>
                  ) : (
                    <>
                      <Edit className="w-4 h-4 mr-2" />
                      수정
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 기본급 */}
              <div>
                <h3 className="font-semibold mb-3">기본급 설정</h3>
                <div className="grid gap-4">
                  <div>
                    <Label>매니저 기본급 (월)</Label>
                    <Input
                      type="number"
                      value={salaryConfig.baseSalary}
                      onChange={(e) =>
                        setSalaryConfig({
                          ...salaryConfig,
                          baseSalary: Number(e.target.value),
                        })
                      }
                      disabled={!isEditing}
                      placeholder="2500000"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      매니저의 기본급을 설정합니다
                    </p>
                  </div>
                </div>
              </div>

              {/* 커미션 설정 */}
              <div>
                <h3 className="font-semibold mb-3">커미션 (인센티브) 등급 설정</h3>
                <p className="text-sm text-gray-600 mb-4">
                  월 매출에 따라 자동으로 커미션율이 적용됩니다
                </p>
                <div className="space-y-3">
                  {salaryConfig.commissionTiers.map((tier, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1 grid grid-cols-3 gap-3">
                        <div>
                          <Label className="text-xs">최소 매출 (원)</Label>
                          <Input
                            type="number"
                            value={tier.minRevenue}
                            onChange={(e) => {
                              const newTiers = [...salaryConfig.commissionTiers];
                              newTiers[index].minRevenue = Number(e.target.value);
                              setSalaryConfig({ ...salaryConfig, commissionTiers: newTiers });
                            }}
                            disabled={!isEditing}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">최대 매출 (원)</Label>
                          <Input
                            type="number"
                            value={tier.maxRevenue}
                            onChange={(e) => {
                              const newTiers = [...salaryConfig.commissionTiers];
                              newTiers[index].maxRevenue = Number(e.target.value);
                              setSalaryConfig({ ...salaryConfig, commissionTiers: newTiers });
                            }}
                            disabled={!isEditing}
                            placeholder="0 (무제한)"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">커미션율 (%)</Label>
                          <Input
                            type="number"
                            value={tier.rate}
                            onChange={(e) => {
                              const newTiers = [...salaryConfig.commissionTiers];
                              newTiers[index].rate = Number(e.target.value);
                              setSalaryConfig({ ...salaryConfig, commissionTiers: newTiers });
                            }}
                            disabled={!isEditing}
                            placeholder="70"
                            min="0"
                            max="100"
                          />
                        </div>
                      </div>
                      {isEditing && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newTiers = salaryConfig.commissionTiers.filter((_, i) => i !== index);
                            setSalaryConfig({ ...salaryConfig, commissionTiers: newTiers });
                          }}
                        >
                          삭제
                        </Button>
                      )}
                    </div>
                  ))}
                  {isEditing && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newTiers = [
                          ...salaryConfig.commissionTiers,
                          { minRevenue: 0, maxRevenue: 0, rate: 70 },
                        ];
                        setSalaryConfig({ ...salaryConfig, commissionTiers: newTiers });
                      }}
                    >
                      등급 추가
                    </Button>
                  )}
                </div>
                <div className="mt-4 bg-green-50 p-3 rounded-lg">
                  <h4 className="font-semibold text-green-900 text-sm mb-2">현재 커미션 등급</h4>
                  <div className="space-y-1 text-sm text-green-800">
                    {salaryConfig.commissionTiers.map((tier, index) => (
                      <div key={index}>
                        • {tier.minRevenue.toLocaleString()}원 ~ {tier.maxRevenue === 0 ? '무제한' : tier.maxRevenue.toLocaleString() + '원'}: {tier.rate}%
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 수업료 설정 */}
              <div>
                <h3 className="font-semibold mb-3">수업료 설정</h3>
                <div className="grid gap-4">
                  <div>
                    <Label>세션당 단가 (원)</Label>
                    <Input
                      type="number"
                      value={salaryConfig.sessionRate}
                      onChange={(e) =>
                        setSalaryConfig({
                          ...salaryConfig,
                          sessionRate: Number(e.target.value),
                        })
                      }
                      disabled={!isEditing}
                      placeholder="50000"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      1회 수업당 기본 단가를 설정합니다
                    </p>
                  </div>
                </div>
              </div>

              {/* 보너스 설정 */}
              <div>
                <h3 className="font-semibold mb-3">보너스 설정</h3>
                <div className="grid gap-4">
                  <div>
                    <Label>보너스율 (%)</Label>
                    <Input
                      type="number"
                      value={salaryConfig.bonusRate}
                      onChange={(e) =>
                        setSalaryConfig({
                          ...salaryConfig,
                          bonusRate: Number(e.target.value),
                        })
                      }
                      disabled={!isEditing}
                      placeholder="5"
                      min="0"
                      max="100"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      기본급 대비 보너스율 (기본: 5%)
                    </p>
                  </div>
                </div>
              </div>

              {/* 예시 계산 */}
              <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                <h4 className="font-semibold text-blue-900">급여 계산 예시 (코치)</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <div>• 월 45회 수업 × {salaryConfig.sessionRate.toLocaleString()}원 = 2,250,000원</div>
                  <div>• 환불 200,000원 차감 = 2,050,000원</div>
                  <div>• 커미션 {salaryConfig.sessionCommissionRate}% 적용 = {(2050000 * salaryConfig.sessionCommissionRate / 100).toLocaleString()}원</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}