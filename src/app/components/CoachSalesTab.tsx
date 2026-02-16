import { Card, CardContent } from "@/app/components/ui/card";
import { DollarSign } from "lucide-react";

interface CoachSalesTabProps {
  accessToken: string;
  supabaseUrl: string;
  publicAnonKey: string;
  coachId: string;
}

export function CoachSalesTab({ 
  accessToken, 
  supabaseUrl, 
  publicAnonKey,
  coachId
}: CoachSalesTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">매출 관리</h2>
        <p className="text-gray-500 mt-1">매출과 수익을 확인하세요</p>
      </div>

      <Card>
        <CardContent className="py-12 text-center">
          <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">매출 관리 기능은 준비 중입니다.</p>
        </CardContent>
      </Card>
    </div>
  );
}
