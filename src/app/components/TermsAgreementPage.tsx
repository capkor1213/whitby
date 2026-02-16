import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { TermsDetailDialog } from "@/app/components/TermsDetailDialog";
import { toast } from "sonner";
import { CheckCircle2, ChevronRight, AlertTriangle } from "lucide-react";
import whitbyLogo from "figma:asset/e51e097fc8aad7c73b8d6f36e3388a97303b1760.png";
import { getSupabaseClient } from "@/utils/supabase/client";

interface TermsAgreementPageProps {
  accessToken: string;
  supabaseUrl: string;
  onComplete: () => void;
}

// 약관 버전 정의
const CURRENT_TERMS_VERSION = {
  service: "1.0.0",
  privacy: "1.0.0",
  health: "1.0.0",
  age: "1.0.0",
  marketing: "1.0.0",
};

export function TermsAgreementPage({ accessToken, supabaseUrl, onComplete }: TermsAgreementPageProps) {
  const [serviceTerms, setServiceTerms] = useState(false);
  const [privacyPolicy, setPrivacyPolicy] = useState(false);
  const [ageConfirmation, setAgeConfirmation] = useState(false);
  const [healthInfoConsent, setHealthInfoConsent] = useState(false);
  
  // 마케팅 수단별 동의
  const [marketingEmail, setMarketingEmail] = useState(false);
  const [marketingSms, setMarketingSms] = useState(false);
  const [marketingPush, setMarketingPush] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openDialog, setOpenDialog] = useState<"service" | "privacy" | "health" | "age" | "marketing" | null>(null);
  const [userId, setUserId] = useState("");
  const [userIp, setUserIp] = useState("127.0.0.1");

  const supabase = getSupabaseClient();

  useEffect(() => {
    loadUserInfo();
    fetchUserIp();
  }, []);

  const loadUserInfo = async () => {
    try {
      const { data } = await supabase.auth.getUser(accessToken);
      if (data.user) {
        setUserId(data.user.id);
      }
    } catch (error) {
      console.error("Error loading user info:", error);
    }
  };

  const fetchUserIp = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      setUserIp(data.ip);
    } catch (error) {
      console.error("Error fetching IP:", error);
    }
  };

  const allRequiredChecked = serviceTerms && privacyPolicy && ageConfirmation;
  const anyMarketingChecked = marketingEmail || marketingSms || marketingPush;
  const allChecked = allRequiredChecked && healthInfoConsent && anyMarketingChecked;

  const handleSelectAll = () => {
    if (allChecked) {
      setServiceTerms(false);
      setPrivacyPolicy(false);
      setAgeConfirmation(false);
      setHealthInfoConsent(false);
      setMarketingEmail(false);
      setMarketingSms(false);
      setMarketingPush(false);
    } else {
      setServiceTerms(true);
      setPrivacyPolicy(true);
      setAgeConfirmation(true);
      setHealthInfoConsent(true);
      setMarketingEmail(true);
      setMarketingSms(true);
      setMarketingPush(true);
    }
  };

  const handleSubmit = async () => {
    if (!allRequiredChecked) {
      toast.error("필수 약관에 모두 동의해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      const timestamp = new Date().toISOString();
      
      // 동의 로그 생성 (각 항목별로)
      const consentLogs = [];

      // 필수 항목
      consentLogs.push({
        userId,
        type: "terms",
        agreed: serviceTerms,
        agreedAt: timestamp,
        version: CURRENT_TERMS_VERSION.service,
        ipAddress: userIp,
      });

      consentLogs.push({
        userId,
        type: "privacy",
        agreed: privacyPolicy,
        agreedAt: timestamp,
        version: CURRENT_TERMS_VERSION.privacy,
        ipAddress: userIp,
      });

      consentLogs.push({
        userId,
        type: "age",
        agreed: ageConfirmation,
        agreedAt: timestamp,
        version: CURRENT_TERMS_VERSION.age,
        ipAddress: userIp,
      });

      // 선택 항목
      if (healthInfoConsent) {
        consentLogs.push({
          userId,
          type: "health",
          agreed: healthInfoConsent,
          agreedAt: timestamp,
          version: CURRENT_TERMS_VERSION.health,
          ipAddress: userIp,
        });
      }

      // 마케팅 수단별
      if (marketingEmail) {
        consentLogs.push({
          userId,
          type: "marketing_email",
          agreed: marketingEmail,
          agreedAt: timestamp,
          version: CURRENT_TERMS_VERSION.marketing,
          ipAddress: userIp,
        });
      }

      if (marketingSms) {
        consentLogs.push({
          userId,
          type: "marketing_sms",
          agreed: marketingSms,
          agreedAt: timestamp,
          version: CURRENT_TERMS_VERSION.marketing,
          ipAddress: userIp,
        });
      }

      if (marketingPush) {
        consentLogs.push({
          userId,
          type: "marketing_push",
          agreed: marketingPush,
          agreedAt: timestamp,
          version: CURRENT_TERMS_VERSION.marketing,
          ipAddress: userIp,
        });
      }

      // 약관 동의 정보를 localStorage에 저장
      const termsData = {
        serviceTerms,
        privacyPolicy,
        ageConfirmation,
        healthInfoConsent,
        marketingEmail,
        marketingSms,
        marketingPush,
        agreedAt: timestamp,
        versions: CURRENT_TERMS_VERSION,
        ipAddress: userIp,
      };

      // localStorage에 저장
      localStorage.setItem(`terms_${accessToken.substring(0, 10)}`, JSON.stringify(termsData));
      localStorage.setItem(`consent_logs_${userId}`, JSON.stringify(consentLogs));

      toast.success("약관 동의가 완료되었습니다.");
      onComplete();
    } catch (error) {
      console.error("Error submitting terms agreement:", error);
      toast.error("약관 동의 처리 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={whitbyLogo} alt="Whitby Logo" className="h-16 w-auto object-contain" />
          </div>
          <CardTitle className="text-2xl">서비스 이용약관 동의</CardTitle>
          <CardDescription>
            Whitby 서비스를 이용하기 위해 약관에 동의해주세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 전체 동의 */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="all-terms"
                checked={allChecked}
                onCheckedChange={handleSelectAll}
                className="w-5 h-5"
              />
              <label
                htmlFor="all-terms"
                className="text-base font-bold text-gray-900 cursor-pointer flex-1"
              >
                전체 동의
              </label>
              <CheckCircle2 className={`w-6 h-6 ${allChecked ? 'text-blue-600' : 'text-gray-300'}`} />
            </div>
            <p className="text-xs text-gray-600 mt-2 ml-8">
              선택 항목을 포함한 모든 약관에 동의합니다
            </p>
          </div>

          <div className="border-t pt-4 space-y-4">
            {/* 필수 약관들 */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <Checkbox
                  id="service-terms"
                  checked={serviceTerms}
                  onCheckedChange={(checked) => setServiceTerms(checked as boolean)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label
                    htmlFor="service-terms"
                    className="text-sm font-medium text-gray-900 cursor-pointer flex items-center gap-2"
                  >
                    <span className="text-red-600 font-bold">[필수]</span>
                    서비스 이용약관 동의
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Whitby 서비스 이용을 위한 기본 약관입니다 (v{CURRENT_TERMS_VERSION.service})
                  </p>
                </div>
                <button className="text-xs text-blue-600 hover:underline whitespace-nowrap" onClick={() => setOpenDialog("service")}>
                  보기
                </button>
              </div>

              <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <Checkbox
                  id="privacy-policy"
                  checked={privacyPolicy}
                  onCheckedChange={(checked) => setPrivacyPolicy(checked as boolean)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label
                    htmlFor="privacy-policy"
                    className="text-sm font-medium text-gray-900 cursor-pointer flex items-center gap-2"
                  >
                    <span className="text-red-600 font-bold">[필수]</span>
                    개인정보 수집 및 이용 동의
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    회원 관리 및 서비스 제공을 위한 개인정보 수집에 동의합니다 (v{CURRENT_TERMS_VERSION.privacy})
                  </p>
                </div>
                <button className="text-xs text-blue-600 hover:underline whitespace-nowrap" onClick={() => setOpenDialog("privacy")}>
                  보기
                </button>
              </div>

              <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <Checkbox
                  id="age-confirmation"
                  checked={ageConfirmation}
                  onCheckedChange={(checked) => setAgeConfirmation(checked as boolean)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label
                    htmlFor="age-confirmation"
                    className="text-sm font-medium text-gray-900 cursor-pointer flex items-center gap-2"
                  >
                    <span className="text-red-600 font-bold">[필수]</span>
                    만 14세 이상입니다
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    만 14세 미만은 서비스를 이용할 수 없습니다
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4 space-y-4">
              {/* 선택 약관들 */}
              <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors border-2 border-orange-200 bg-orange-50">
                <Checkbox
                  id="health-info"
                  checked={healthInfoConsent}
                  onCheckedChange={(checked) => setHealthInfoConsent(checked as boolean)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label
                    htmlFor="health-info"
                    className="text-sm font-medium text-gray-700 cursor-pointer flex items-center gap-2"
                  >
                    <span className="text-blue-600 font-bold">[선택]</span>
                    건강정보(민감정보) 수집 및 이용 동의
                  </label>
                  <p className="text-xs text-gray-600 mt-1 font-medium">
                    <AlertTriangle className="w-3 h-3 inline mr-1" />
                    목적: 운동 관리·분석 및 개인 맞춤형 피드백 제공
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    • 수집 항목: 신체 정보(체중, 근육량, 체지방), 운동 기록, 인바디 데이터
                  </p>
                  <p className="text-xs text-gray-500">
                    • 본 정보는 의료적 진단·치료를 대체하지 않습니다
                  </p>
                  <p className="text-xs text-gray-500">
                    • 동의하지 않아도 서비스 이용 가능 (단, 일부 기능 제한)
                  </p>
                </div>
                <button className="text-xs text-blue-600 hover:underline whitespace-nowrap" onClick={() => setOpenDialog("health")}>
                  보기
                </button>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  <span className="text-blue-600 font-bold">[선택]</span>
                  마케팅 정보 수신 동의 (수단별 선택)
                </p>
                <div className="ml-4 space-y-3">
                  <div className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded">
                    <Checkbox
                      id="marketing-email"
                      checked={marketingEmail}
                      onCheckedChange={(checked) => setMarketingEmail(checked as boolean)}
                      className="mt-1"
                    />
                    <label
                      htmlFor="marketing-email"
                      className="text-sm text-gray-700 cursor-pointer flex-1"
                    >
                      이메일 수신 동의
                      <p className="text-xs text-gray-500 mt-1">
                        이벤트, 프로모션, 신규 기능 등의 정보를 이메일로 받습니다
                      </p>
                    </label>
                  </div>

                  <div className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded">
                    <Checkbox
                      id="marketing-sms"
                      checked={marketingSms}
                      onCheckedChange={(checked) => setMarketingSms(checked as boolean)}
                      className="mt-1"
                    />
                    <label
                      htmlFor="marketing-sms"
                      className="text-sm text-gray-700 cursor-pointer flex-1"
                    >
                      SMS 수신 동의
                      <p className="text-xs text-gray-500 mt-1">
                        이벤트, 프로모션, 신규 기능 등의 정보를 SMS로 받습니다
                      </p>
                    </label>
                  </div>

                  <div className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded">
                    <Checkbox
                      id="marketing-push"
                      checked={marketingPush}
                      onCheckedChange={(checked) => setMarketingPush(checked as boolean)}
                      className="mt-1"
                    />
                    <label
                      htmlFor="marketing-push"
                      className="text-sm text-gray-700 cursor-pointer flex-1"
                    >
                      앱 푸시 알림 수신 동의
                      <p className="text-xs text-gray-500 mt-1">
                        이벤트, 프로모션, 신규 기능 등의 정보를 푸시 알림으로 받습니다
                      </p>
                    </label>
                  </div>

                  <p className="text-xs text-gray-500 mt-2 ml-2">
                    • 마케팅 수신은 언제든지 철회 가능합니다 (설정 {'>'} 알림 관리)
                  </p>
                </div>
                <button className="text-xs text-blue-600 hover:underline mt-2 ml-4" onClick={() => setOpenDialog("marketing")}>
                  상세보기
                </button>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              <strong>안내:</strong> 본 서비스는 운동 관리 및 참고 자료 제공을 목적으로 하며, 의료적 진단·치료·처방을 대체하지 않습니다. 
              건강상 문제가 있거나 의학적 조언이 필요한 경우 반드시 전문 의료인과 상담하시기 바랍니다.
            </p>
          </div>

          <div className="pt-4">
            <Button
              onClick={handleSubmit}
              disabled={!allRequiredChecked || isSubmitting}
              className="w-full"
              size="lg"
            >
              {isSubmitting ? "처리 중..." : "동의하고 계속하기"}
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
            {!allRequiredChecked && (
              <p className="text-xs text-red-600 text-center mt-2">
                필수 약관에 모두 동의해주세요
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* 약관 상세 보기 모달 */}
      {openDialog && (
        <TermsDetailDialog
          open={!!openDialog}
          onOpenChange={(open) => !open && setOpenDialog(null)}
          type={openDialog}
        />
      )}
    </div>
  );
}
