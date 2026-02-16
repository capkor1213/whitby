import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Check, Star } from "lucide-react";

interface CenterServicesTabProps {
  accessToken: string;
  supabaseUrl: string;
  publicAnonKey: string;
}

export function CenterServicesTab({ accessToken, supabaseUrl, publicAnonKey }: CenterServicesTabProps) {
  const services = [
    {
      name: "기본 플랜",
      price: "무료",
      features: [
        "회원 관리 (최대 50명)",
        "락커 관리",
        "기본 통계",
        "이메일 지원",
      ],
      current: true,
    },
    {
      name: "스탠다드 플랜",
      price: "₩99,000/월",
      features: [
        "회원 관리 (최대 200명)",
        "락커 관리",
        "고급 통계 및 리포트",
        "문자 메시지 발송",
        "쿠폰 관리",
        "우선 지원",
      ],
      current: false,
      recommended: true,
    },
    {
      name: "프리미엄 플랜",
      price: "₩199,000/월",
      features: [
        "무제한 회원 관리",
        "락커 관리",
        "실시간 대시보드",
        "문자 메시지 발송",
        "쿠폰 관리",
        "모바일 앱 연동",
        "맞춤형 리포트",
        "전담 매니저",
        "24/7 지원",
      ],
      current: false,
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900">서비스 플랜 선택</h2>
        <p className="text-gray-500 mt-2">센터에 맞는 플랜을 선택하세요</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {services.map((service, index) => (
          <Card
            key={index}
            className={`relative ${
              service.recommended
                ? "border-2 border-blue-500 shadow-lg"
                : service.current
                ? "border-2 border-green-500"
                : ""
            }`}
          >
            {service.recommended && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <div className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" />
                  추천
                </div>
              </div>
            )}
            {service.current && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <div className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  현재 플랜
                </div>
              </div>
            )}

            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl">{service.name}</CardTitle>
              <div className="mt-4">
                <span className="text-3xl font-bold">{service.price}</span>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {service.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full mt-6 ${
                  service.current
                    ? "bg-gray-400 cursor-not-allowed"
                    : service.recommended
                    ? "bg-blue-600 hover:bg-blue-700"
                    : ""
                }`}
                disabled={service.current}
              >
                {service.current ? "현재 사용 중" : "플랜 선택"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 플랜 비교 표 */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>플랜 상세 비교</CardTitle>
          <CardDescription>각 플랜의 기능을 자세히 비교해보세요</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">기능</th>
                  <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">기본</th>
                  <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">스탠다드</th>
                  <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">프리미엄</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "회원 관리", basic: "50명", standard: "200명", premium: "무제한" },
                  { feature: "락커 관리", basic: "✓", standard: "✓", premium: "✓" },
                  { feature: "통계 및 리포트", basic: "기본", standard: "고급", premium: "실시간" },
                  { feature: "문자 메시지", basic: "✗", standard: "✓", premium: "✓" },
                  { feature: "쿠폰 관리", basic: "✗", standard: "✓", premium: "✓" },
                  { feature: "모바일 앱", basic: "✗", standard: "✗", premium: "✓" },
                  { feature: "지원", basic: "이메일", standard: "우선", premium: "24/7" },
                ].map((row, index) => (
                  <tr key={index} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{row.feature}</td>
                    <td className="py-3 px-4 text-center text-gray-600">{row.basic}</td>
                    <td className="py-3 px-4 text-center text-gray-600">{row.standard}</td>
                    <td className="py-3 px-4 text-center text-gray-600">{row.premium}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
