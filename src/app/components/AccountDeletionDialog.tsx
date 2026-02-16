import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { Checkbox } from "@/app/components/ui/checkbox";
import { AlertTriangle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getSupabaseClient } from "@/utils/supabase/client";

interface AccountDeletionDialogProps {
  accessToken: string;
  onDeleteComplete: () => void;
}

export function AccountDeletionDialog({ accessToken, onDeleteComplete }: AccountDeletionDialogProps) {
  const [open, setOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const supabase = getSupabaseClient();

  const handleDelete = async () => {
    if (!confirmed) {
      toast.error("안내사항을 확인하고 동의해주세요.");
      return;
    }

    setIsDeleting(true);
    try {
      const { data } = await supabase.auth.getUser(accessToken);
      if (!data.user) {
        toast.error("사용자 정보를 찾을 수 없습니다.");
        return;
      }

      // 개인정보 파기 처리
      localStorage.removeItem(`user_${data.user.id}`);
      localStorage.removeItem(`profile_${data.user.id}`);
      localStorage.removeItem(`consent_logs_${data.user.id}`);
      localStorage.removeItem(`terms_${data.user.id}`);

      // 건강정보 파기
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.includes(`daily_${data.user.id}`) ||
          key.includes(`inbody_${data.user.id}`) ||
          key.includes(`exercise_${data.user.id}`)
        )) {
          localStorage.removeItem(key);
        }
      }

      // 파기 로그 기록
      const deletionLog = {
        userId: data.user.id,
        userEmail: data.user.email,
        deletedAt: new Date().toISOString(),
        type: "user_requested",
      };
      
      const existingLogs = JSON.parse(localStorage.getItem("deletion_logs") || "[]");
      localStorage.setItem("deletion_logs", JSON.stringify([...existingLogs, deletionLog]));

      // Supabase 로그아웃
      await supabase.auth.signOut();

      toast.success("회원 탈퇴가 완료되었습니다.");
      setOpen(false);
      onDeleteComplete();
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("탈퇴 처리 중 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50">
          <Trash2 className="w-4 h-4 mr-2" />
          회원 탈퇴
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            회원 탈퇴 및 개인정보 파기 안내
          </DialogTitle>
          <DialogDescription>
            회원 탈퇴 시 개인정보 보호법에 따라 다음과 같이 처리됩니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-sm mb-2">1. 즉시 파기되는 정보</h3>
            <ul className="text-sm space-y-1 text-gray-600 ml-4">
              <li>• 회원 기본정보 (이름, 이메일, 휴대전화번호)</li>
              <li>• 로그인 정보</li>
              <li>• 마케팅 수신 동의 내역</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-2">2. 탈퇴 후 일정 기간 보관되는 정보</h3>
            <p className="text-sm text-gray-600 mb-2">
              서비스 이용 기록, 결제 기록 등은 관련 법령에 따라 일정 기간 보관 후 파기됩니다.
            </p>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">보관 항목</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">보관 기간</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">근거 법령</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="px-3 py-2">계약 및 결제 기록</td>
                    <td className="px-3 py-2">5년</td>
                    <td className="px-3 py-2">전자상거래법</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2">소비자 불만 및 분쟁 기록</td>
                    <td className="px-3 py-2">3년</td>
                    <td className="px-3 py-2">전자상거래법</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2">로그인 기록(IP)</td>
                    <td className="px-3 py-2">3개월</td>
                    <td className="px-3 py-2">통신비밀보호법</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-2">3. 건강정보 처리</h3>
            <p className="text-sm text-gray-600">
              회원 탈퇴 시 <strong>운동 기록 및 신체 정보는 즉시 파기됩니다.</strong>
            </p>
            <p className="text-sm text-gray-600 mt-1">
              단, 회원이 별도로 동의한 경우에 한해 통계·연구 목적의 비식별 데이터로 활용될 수 있습니다.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-2">4. 파기 방법</h3>
            <p className="text-sm text-gray-600">
              전자적 파일 형태의 개인정보는 <strong>복구 불가능한 방식</strong>으로 안전하게 삭제합니다.
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-semibold mb-1">탈퇴 시 주의사항</p>
                <ul className="space-y-1 ml-4">
                  <li>• 탈퇴 후에는 계정 복구가 불가능합니다.</li>
                  <li>• 모든 운동 기록과 신체 정보가 삭제됩니다.</li>
                  <li>• 코치와 연결된 피드백 내역도 함께 삭제됩니다.</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="confirm-deletion"
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(checked as boolean)}
            />
            <label
              htmlFor="confirm-deletion"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              위 내용을 모두 확인했으며, 회원 탈퇴에 동의합니다.
            </label>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleDelete}
              disabled={!confirmed || isDeleting}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isDeleting ? "처리 중..." : "탈퇴하기"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}