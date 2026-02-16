import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";

interface TermsDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "service" | "privacy" | "health" | "age" | "marketing";
}

export function TermsDetailDialog({ open, onOpenChange, type }: TermsDetailDialogProps) {
  const getContent = () => {
    switch (type) {
      case "service":
        return {
          title: "서비스 이용약관",
          content: (
            <div className="space-y-4 text-sm">
              <section>
                <h3 className="font-bold text-base mb-2">제1조 (목적)</h3>
                <p className="text-gray-700 leading-relaxed">
                  본 약관은 Whitby (이하 "회사")가 제공하는 Whitby 서비스의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-base mb-2">제2조 (정의)</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>"서비스"란 회사가 제공하는 웹 애플리케이션 및 관련 제반 서비스를 의미합니다.</li>
                  <li>"회원"이란 본 약관에 동의하고 서비스를 이용하는 자를 의미합니다.</li>
                </ul>
              </section>

              <section>
                <h3 className="font-bold text-base mb-2">제3조 (약관의 효력 및 변경)</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>본 약관은 회원가입 시 동의함으로써 효력이 발생합니다.</li>
                  <li>회사는 관련 법령을 위배하지 않는 범위에서 약관을 개정할 수 있으며, 변경 시 앱 내 공지를 통해 안내합니다.</li>
                </ul>
              </section>

              <section>
                <h3 className="font-bold text-base mb-2">제4조 (서비스의 제공)</h3>
                <p className="text-gray-700 mb-2">회사는 다음과 같은 서비스를 제공합니다.</p>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>회원 관리 및 운동 기록 관리</li>
                  <li>운동 프로그램 제공</li>
                  <li>신체 정보 및 운동 데이터 기반 피드백</li>
                  <li>기타 회사가 정하는 서비스</li>
                </ul>
              </section>

              <section>
                <h3 className="font-bold text-base mb-2">제5조 (회원의 의무)</h3>
                <p className="text-gray-700 mb-2">회원은 다음 행위를 하여서는 안 됩니다.</p>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>타인의 개인정보 도용</li>
                  <li>서비스 운영을 방해하는 행위</li>
                  <li>법령 및 공서양속에 반하는 행위</li>
                </ul>
              </section>

              <section>
                <h3 className="font-bold text-base mb-2">제6조 (서비스 이용 제한)</h3>
                <p className="text-gray-700 leading-relaxed">
                  회사는 회원이 본 약관을 위반한 경우 서비스 이용을 제한할 수 있습니다.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-base mb-2">제7조 (책임 제한)</h3>
                <p className="text-gray-700 leading-relaxed">
                  회사는 회원의 건강 상태 및 운동 수행 결과에 대해 의학적 책임을 지지 않으며, 서비스는 참고 자료로 활용됩니다.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-base mb-2">제8조 (분쟁 해결)</h3>
                <p className="text-gray-700 leading-relaxed">
                  본 약관과 관련한 분쟁은 대한민국 법을 따르며, 관할 법원은 회사 본점 소재지를 따릅니다.
                </p>
              </section>
            </div>
          ),
        };

      case "privacy":
        return {
          title: "[필수] 개인정보 수집 및 이용 동의",
          content: (
            <div className="space-y-4 text-sm">
              <p className="text-gray-700">
                회사는 「개인정보 보호법」에 따라 아래와 같이 개인정보를 수집·이용합니다.
              </p>

              <section>
                <h3 className="font-bold text-base mb-2">1. 수집하는 개인정보 항목</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li><strong>필수:</strong> 이름, 이메일 주소, 로그인 정보</li>
                  <li><strong>선택:</strong> 프로필 사진</li>
                </ul>
              </section>

              <section>
                <h3 className="font-bold text-base mb-2">2. 수집·이용 목적</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>회원 가입 및 본인 확인</li>
                  <li>서비스 제공 및 회원 관리</li>
                  <li>고객 문의 및 공지사항 전달</li>
                </ul>
              </section>

              <section>
                <h3 className="font-bold text-base mb-2">3. 보유 및 이용 기간</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>회원 탈퇴 시까지</li>
                  <li>단, 관련 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관</li>
                </ul>
              </section>

              <section>
                <h3 className="font-bold text-base mb-2">4. 동의 거부 권리</h3>
                <p className="text-gray-700 leading-relaxed">
                  개인정보 수집·이용에 대한 동의를 거부할 수 있으나, 거부 시 회원가입 및 서비스 이용이 제한됩니다.
                </p>
              </section>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-900">
                  ☑ 본인은 위 내용을 충분히 이해하였으며 동의합니다.
                </p>
              </div>
            </div>
          ),
        };

      case "health":
        return {
          title: "[선택] 건강정보(민감정보) 수집 및 이용 동의",
          content: (
            <div className="space-y-4 text-sm">
              <div className="p-4 bg-orange-50 border-2 border-orange-200 rounded-lg">
                <p className="text-sm font-semibold text-orange-900 mb-2">
                  ⚠️ 건강정보는 「개인정보 보호법」상 민감정보입니다
                </p>
                <p className="text-sm text-orange-800">
                  본 동의는 필수가 아니며, 동의하지 않아도 기본 서비스 이용이 가능합니다.
                </p>
              </div>

              <section>
                <h3 className="font-bold text-base mb-2">1. 수집하는 건강정보 항목</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li><strong>신체 정보:</strong> 체중, 골격근량, 체지방량, 체지방률, 신장</li>
                  <li><strong>운동 기록:</strong> 운동 종류, 무게(kg), 횟수, 세트 수, 운동 시간</li>
                  <li><strong>인바디 데이터:</strong> 제지방량(LBM), 체성분 분석 결과</li>
                  <li><strong>목표 정보:</strong> 목표 체중, 목표 근육량, 목표 체지방량, 운동 목적</li>
                </ul>
              </section>

              <section>
                <h3 className="font-bold text-base mb-2">2. 수집·이용 목적 (의료행위 아님)</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li><strong>운동 관리·분석:</strong> 개인의 운동 기록 저장 및 진행 상황 추적</li>
                  <li><strong>개인 맞춤형 피드백:</strong> ISSN(국제스포츠영양학회) 기준 영양소 권장량 제공</li>
                  <li><strong>운동 목표 설정 지원:</strong> 개인 목표 달성을 돕기 위한 참고 자료 제공</li>
                </ul>
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-sm text-red-800">
                    <strong>⛔ 본 서비스는 의료적 진단·치료·처방을 제공하지 않습니다</strong>
                  </p>
                  <p className="text-xs text-red-700 mt-1">
                    건강상 문제가 있거나 의학적 조언이 필요한 경우 반드시 전문 의료인과 상담하시기 바랍니다.
                  </p>
                </div>
              </section>

              <section>
                <h3 className="font-bold text-base mb-2">3. 보유 및 이용 기간</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>회원 탈퇴 시 <strong>즉시 파기</strong></li>
                  <li>단, 통계·연구 목적으로 별도 동의한 경우 <strong>비식별 처리 후 활용 가능</strong></li>
                </ul>
              </section>

              <section>
                <h3 className="font-bold text-base mb-2">4. 제3자 제공 및 활용</h3>
                <p className="text-gray-700 leading-relaxed">
                  건강정보는 마케팅 목적으로 활용되지 않으며, 회원의 별도 동의 없이 제3자에게 제공되지 않습니다.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-base mb-2">5. 동의 거부 권리</h3>
                <p className="text-gray-700 leading-relaxed">
                  건강정보 수집에 동의하지 않아도 기본 서비스 이용은 가능합니다. 
                  다만, 맞춤형 운동·영양 분석 서비스 제공에 제한이 있을 수 있습니다.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-base mb-2">6. 동의 철회</h3>
                <p className="text-gray-700 leading-relaxed">
                  언제든지 설정 메뉴에서 동의를 철회할 수 있으며, 철회 시 수집된 건강정보는 즉시 파기됩니다.
                </p>
              </section>

              <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-900">
                  ☑ 본인은 위 내용을 충분히 이해하였으며, 건강정보 수집 및 이용에 동의합니다.
                </p>
              </div>
            </div>
          ),
        };

      case "age":
        return {
          title: "만 14세 이상 확인",
          content: (
            <div className="space-y-4 text-sm">
              <section>
                <p className="text-gray-700 leading-relaxed mb-4">
                  본 서비스는 「개인정보 보호법」 및 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」에 따라 
                  만 14세 미만 아동의 개인정보를 수집하지 않습니다.
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  만 14세 미만의 경우 법정 대리인의 동의가 필요하며, 본 서비스는 이를 확인할 수 있는 
                  절차를 제공하지 않으므로 이용이 제한됩니다.
                </p>
              </section>

              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-semibold text-yellow-900 mb-2">
                  ⚠️ 중요 안내
                </p>
                <p className="text-sm text-yellow-800">
                  만 14세 미만인 경우 본 서비스를 이용할 수 없습니다.
                </p>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-900">
                  ☑ 본인은 만 14세 이상입니다.
                </p>
              </div>
            </div>
          ),
        };

      case "marketing":
        return {
          title: "[선택] 마케팅 정보 수신 동의",
          content: (
            <div className="space-y-4 text-sm">
              <p className="text-gray-700 leading-relaxed">
                회사는 서비스 관련 혜택, 이벤트, 공지 등을 아래 수단으로 발송할 수 있습니다.
              </p>

              <section>
                <h3 className="font-bold text-base mb-3">수신 동의 항목</h3>
                <div className="space-y-2 text-gray-700">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-gray-400 rounded"></div>
                    <span>이메일 수신 동의</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-gray-400 rounded"></div>
                    <span>SMS 수신 동의</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-gray-400 rounded"></div>
                    <span>앱 푸시 알림 수신 동의</span>
                  </div>
                </div>
              </section>

              <section className="mt-4">
                <h3 className="font-bold text-base mb-2">안내 사항</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>동의하지 않아도 서비스 이용에는 제한이 없습니다.</li>
                  <li>수신 동의는 언제든지 철회할 수 있습니다.</li>
                  <li>철회 방법: 설정 메뉴 또는 수신 메시지 내 수신거부 링크</li>
                </ul>
              </section>

              <div className="mt-6 p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-900 mb-2">
                  <strong>발송 내용 예시:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-purple-800">
                  <li>신규 운동 프로그램 안내</li>
                  <li>서비스 업데이트 소식</li>
                  <li>특별 이벤트 및 프로모션</li>
                  <li>건강 및 운동 관련 정보</li>
                </ul>
              </div>

              <div className="mt-6 p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-900">
                  ☑ 본인은 위 내용을 이해하고 마케팅 정보 수신에 동의합니다.
                </p>
              </div>
            </div>
          ),
        };

      default:
        return { title: "", content: null };
    }
  };

  const { title, content } = getContent();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{title}</DialogTitle>
          <DialogDescription>
            아래 내용을 확인해주세요
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">{content}</div>
      </DialogContent>
    </Dialog>
  );
}