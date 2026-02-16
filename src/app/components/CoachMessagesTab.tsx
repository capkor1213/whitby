import { Card, CardContent } from "@/app/components/ui/card";
import { MessageSquare } from "lucide-react";

interface CoachMessagesTabProps {
  accessToken: string;
  supabaseUrl: string;
  publicAnonKey: string;
  coachId: string;
}

export function CoachMessagesTab({ 
  accessToken, 
  supabaseUrl, 
  publicAnonKey,
  coachId
}: CoachMessagesTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">메시지</h2>
        <p className="text-gray-500 mt-1">회원들과 소통하세요</p>
      </div>

      <Card>
        <CardContent className="py-12 text-center">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">메시지 기능은 준비 중입니다.</p>
        </CardContent>
      </Card>
    </div>
  );
}
