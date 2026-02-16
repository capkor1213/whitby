import { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Label } from "@/app/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Separator } from "@/app/components/ui/separator";
import { Crown, User, Dumbbell, MapPin, Scale } from "lucide-react";
import whitbyLogo from "figma:asset/e51e097fc8aad7c73b8d6f36e3388a97303b1760.png";
import { getSupabaseClient } from "@/utils/supabase/client";

interface LoginPageProps {
  onLogin: (accessToken: string) => void;
  supabaseUrl: string;
  publicAnonKey: string;
  onCenterDemo?: () => void;
  onCoachDemo?: () => void;
}

export function LoginPage({ onLogin, supabaseUrl, publicAnonKey, onCenterDemo, onCoachDemo }: LoginPageProps) {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // 회원가입 - 사용자 유형 선택
  const [signupUserType, setSignupUserType] = useState<"member" | "coach" | "center">("member");
  
  // 회원가입 - 기본 정보
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupPasswordConfirm, setSignupPasswordConfirm] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupAddress, setSignupAddress] = useState("");
  const [signupAddressDetail, setSignupAddressDetail] = useState("");
  
  // 회원가입 - 신체 정보 (일반회원용)
  const [signupGender, setSignupGender] = useState("male");
  const [signupAge, setSignupAge] = useState("");
  const [signupHeight, setSignupHeight] = useState("");
  const [signupWeight, setSignupWeight] = useState("");
  const [signupMuscleMass, setSignupMuscleMass] = useState("");
  const [signupBodyFat, setSignupBodyFat] = useState("");
  
  // 코치용 추가 정보
  const [coachCertification, setCoachCertification] = useState("");
  const [coachSpecialty, setCoachSpecialty] = useState("");
  const [coachProfileImage, setCoachProfileImage] = useState<File | null>(null);
  const [coachProfileImagePreview, setCoachProfileImagePreview] = useState("");
  const [coachCareerHistory, setCoachCareerHistory] = useState("");
  const [coachMessage, setCoachMessage] = useState("");
  const [coachCenterId, setCoachCenterId] = useState(""); // 소속 센터 ID
  const [availableCenters, setAvailableCenters] = useState<any[]>([]); // 센터 목록
  
  // 센터용 추가 정보
  const [centerBusinessNumber, setCenterBusinessNumber] = useState("");
  const [centerOwnerName, setCenterOwnerName] = useState("");
  const [centerLogo, setCenterLogo] = useState<File | null>(null);
  const [centerLogoPreview, setCenterLogoPreview] = useState("");
  const [centerIntroduction, setCenterIntroduction] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const supabase = getSupabaseClient();

  // 센터 목록 불러오기
  useEffect(() => {
    if (signupUserType === "coach") {
      loadAvailableCenters();
    }
  }, [signupUserType]);

  const loadAvailableCenters = async () => {
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/make-server-2c29cd73/centers/list`, {
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableCenters(data.centers || []);
      }
    } catch (error) {
      console.error("센터 목록 로딩 에러:", error);
      // 에러가 발생해도 계속 진행 (센터 선택은 선택사항)
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (loginError) {
        setError(loginError.message);
        return;
      }

      if (data.session?.access_token) {
        onLogin(data.session.access_token);
      }
    } catch (err) {
      setError("로그인 중 오류가 발생했습니다.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'kakao') => {
    setIsLoading(true);
    setError("");

    try {
      const { data, error: socialError } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (socialError) {
        setError(socialError.message);
        console.error("Social login error:", socialError);
      }
      
      // OAuth will redirect, so we don't need to do anything else here
    } catch (err) {
      setError("소셜 로그인 중 오류가 발생했습니다.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNaverLogin = async () => {
    setError("네이버 로그인은 현재 설정이 필요합니다. Supabase 대시보드에서 네이버 OAuth 앱을 설정해주세요.");
    // Naver는 Supabase에서 기본 지원하지 않으므로 커스텀 구현이 필요합니다
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // 비밀번호 확인 검증
    if (signupPassword !== signupPasswordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      setIsLoading(false);
      return;
    }

    // 비밀번호 강도 검증
    if (signupPassword.length < 6) {
      setError("비밀번호는 최소 6자 이상이어야 합니다.");
      setIsLoading(false);
      return;
    }

    try {
      // 먼저 사용자 생성
      const response = await fetch(`${supabaseUrl}/functions/v1/make-server-2c29cd73/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          email: signupEmail,
          password: signupPassword,
          name: signupName,
          phone: signupPhone,
          address: signupAddress,
          addressDetail: signupAddressDetail,
          userType: signupUserType,
          // 신체 정보
          gender: signupGender,
          age: signupAge,
          height: signupHeight,
          currentWeight: signupWeight,
          currentMuscleMass: signupMuscleMass,
          currentBodyFat: signupBodyFat,
          // 코치용 추가 정보
          certification: coachCertification,
          specialty: coachSpecialty,
          careerHistory: coachCareerHistory,
          message: coachMessage,
          centerId: coachCenterId, // 소속 센터 ID
          // 센터용 추가 정보
          businessNumber: centerBusinessNumber,
          ownerName: centerOwnerName,
          introduction: centerIntroduction,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "회원가입에 실패했습니다.");
        return;
      }

      const userId = data.user?.id;

      // 코치 프로필 이미지가 있으면 업로드
      if (signupUserType === "coach" && coachProfileImage && userId) {
        const formData = new FormData();
        formData.append("file", coachProfileImage);
        formData.append("coachId", userId);

        try {
          const imageResponse = await fetch(
            `${supabaseUrl}/functions/v1/make-server-2c29cd73/coaches/upload-image`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${publicAnonKey}`,
              },
              body: formData,
            }
          );

          if (imageResponse.ok) {
            const imageData = await imageResponse.json();
            // 업로드된 이미지 URL을 코치 프로필에 업데이트
            await fetch(`${supabaseUrl}/functions/v1/make-server-2c29cd73/coaches/${userId}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${publicAnonKey}`,
              },
              body: JSON.stringify({
                profileImage: imageData.imageUrl,
                careerHistory: coachCareerHistory,
                message: coachMessage,
              }),
            });
          }
        } catch (imageError) {
          console.error("프로필 이미지 업로드 실패:", imageError);
          // 이미지 업로드 실패해도 회원가입은 성공으로 처리
        }
      }

      // 센터 로고가 있으면 업로드
      if (signupUserType === "center" && centerLogo && userId) {
        const formData = new FormData();
        formData.append("file", centerLogo);
        formData.append("centerId", userId);

        try {
          const imageResponse = await fetch(
            `${supabaseUrl}/functions/v1/make-server-2c29cd73/centers/upload-logo`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${publicAnonKey}`,
              },
              body: formData,
            }
          );

          if (imageResponse.ok) {
            const imageData = await imageResponse.json();
            // 업로드된 이미지 URL을 센터 프로필에 업데이트
            await fetch(`${supabaseUrl}/functions/v1/make-server-2c29cd73/centers/${userId}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${publicAnonKey}`,
              },
              body: JSON.stringify({
                logo: imageData.imageUrl,
                introduction: centerIntroduction,
              }),
            });
          }
        } catch (imageError) {
          console.error("로고 이미지 업로드 실패:", imageError);
          // 이미지 업로드 실패해도 회원가입은 성공으로 처리
        }
      }

      // After signup, automatically log in
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: signupEmail,
        password: signupPassword,
      });

      if (loginError) {
        setError("회원가입은 성공했으나 로그인에 실패했습니다. 다시 로그인해주세요.");
        return;
      }

      if (loginData.session?.access_token) {
        onLogin(loginData.session.access_token);
      }
    } catch (err) {
      setError("회원가입 중 오류가 발생했습니다.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={whitbyLogo} alt="Whitby Logo" className="h-16 w-auto object-contain" />
          </div>
          <CardTitle className="text-2xl" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 700 }}>Whitby</CardTitle>
          <CardDescription>주간별 운동 방향을 제공하는 스마트 피트니스 플래너</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">로그인</TabsTrigger>
              <TabsTrigger value="signup">회원가입</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">이메일</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="your@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">비밀번호</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "로그인 중..." : "로그인"}
                </Button>

                <div className="relative my-4">
                  <Separator />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-xs text-gray-500">
                    또는
                  </span>
                </div>

                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => handleSocialLogin('google')}
                    disabled={isLoading}
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Google로 로그인
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full bg-[#FEE500] hover:bg-[#FDD835] text-black border-[#FEE500]"
                    onClick={() => handleSocialLogin('kakao')}
                    disabled={isLoading}
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path fill="#000000" d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3z"/>
                    </svg>
                    카카오로 로그인
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full bg-[#03C75A] hover:bg-[#02B350] text-white border-[#03C75A]"
                    onClick={handleNaverLogin}
                    disabled={isLoading}
                  >
                    <span className="font-bold mr-2 text-lg">N</span>
                    네이버로 로그인
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              {/* 사용자 유형 선택 */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setSignupUserType("member")}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    signupUserType === "member"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <User className={`w-6 h-6 mx-auto mb-1 ${signupUserType === "member" ? "text-blue-600" : "text-gray-400"}`} />
                  <p className={`text-xs font-medium ${signupUserType === "member" ? "text-blue-900" : "text-gray-600"}`}>일반 회원</p>
                </button>
                <button
                  type="button"
                  onClick={() => setSignupUserType("coach")}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    signupUserType === "coach"
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Dumbbell className={`w-6 h-6 mx-auto mb-1 ${signupUserType === "coach" ? "text-purple-600" : "text-gray-400"}`} />
                  <p className={`text-xs font-medium ${signupUserType === "coach" ? "text-purple-900" : "text-gray-600"}`}>코치</p>
                </button>
                <button
                  type="button"
                  onClick={() => setSignupUserType("center")}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    signupUserType === "center"
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Crown className={`w-6 h-6 mx-auto mb-1 ${signupUserType === "center" ? "text-green-600" : "text-gray-400"}`} />
                  <p className={`text-xs font-medium ${signupUserType === "center" ? "text-green-900" : "text-gray-600"}`}>센터</p>
                </button>
              </div>

              <div className={`flex items-center gap-2 mb-4 p-3 rounded-lg ${
                signupUserType === "member" ? "bg-blue-50" :
                signupUserType === "coach" ? "bg-purple-50" : "bg-green-50"
              }`}>
                {signupUserType === "member" && (
                  <>
                    <User className="w-5 h-5 text-blue-600" />
                    <p className="text-sm text-blue-800">일반 회원으로 가입하여 운동과 식단을 관리하세요</p>
                  </>
                )}
                {signupUserType === "coach" && (
                  <>
                    <Dumbbell className="w-5 h-5 text-purple-600" />
                    <p className="text-sm text-purple-800">코치로 등록하여 회원들에게 피드백을 제공하세요</p>
                  </>
                )}
                {signupUserType === "center" && (
                  <>
                    <Crown className="w-5 h-5 text-green-600" />
                    <p className="text-sm text-green-800">센터로 등록하여 회원들에게 서비스를 제공하세요</p>
                  </>
                )}
              </div>

              <div className="space-y-3 mb-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => handleSocialLogin('google')}
                  disabled={isLoading}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google로 가입
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-[#FEE500] hover:bg-[#FDD835] text-black border-[#FEE500]"
                  onClick={() => handleSocialLogin('kakao')}
                  disabled={isLoading}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#000000" d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3z"/>
                  </svg>
                  카카오로 가입
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-[#03C75A] hover:bg-[#02B350] text-white border-[#03C75A]"
                  onClick={handleNaverLogin}
                  disabled={isLoading}
                >
                  <span className="font-bold mr-2 text-lg">N</span>
                  네이버로 가입
                </Button>
              </div>

              <div className="relative my-4">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-xs text-gray-500">
                  또는 이메일로 가입
                </span>
              </div>

              <form onSubmit={handleSignup} className="space-y-4">
                {/* 기본 정보 */}
                <div className="border-b pb-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    기본 정보
                  </h3>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">이름 *</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="홍길동"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">이메일 *</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="your@email.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">비밀번호 *</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="최소 6자 이상"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password-confirm">비밀번호 확인 *</Label>
                      <Input
                        id="signup-password-confirm"
                        type="password"
                        placeholder="비밀번호를 다시 입력하세요"
                        value={signupPasswordConfirm}
                        onChange={(e) => setSignupPasswordConfirm(e.target.value)}
                        required
                        minLength={6}
                      />
                      {signupPasswordConfirm && signupPassword !== signupPasswordConfirm && (
                        <p className="text-xs text-red-600">비밀번호가 일치하지 않습니다</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-phone">휴대전화번호</Label>
                      <Input
                        id="signup-phone"
                        type="tel"
                        placeholder="010-1234-5678"
                        value={signupPhone}
                        onChange={(e) => setSignupPhone(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* 주소 정보 */}
                <div className="border-b pb-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    주소 정보
                  </h3>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="signup-address">주소</Label>
                      <Input
                        id="signup-address"
                        type="text"
                        placeholder="서울시 강남구 테헤란로 123"
                        value={signupAddress}
                        onChange={(e) => setSignupAddress(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-address-detail">상세 주소</Label>
                      <Input
                        id="signup-address-detail"
                        type="text"
                        placeholder="101동 1001호"
                        value={signupAddressDetail}
                        onChange={(e) => setSignupAddressDetail(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* 신체 정보 */}
                <div className="pb-2">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Scale className="w-4 h-4" />
                    현재 신체 정보
                  </h3>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="signup-gender">성별</Label>
                      <select
                        id="signup-gender"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={signupGender}
                        onChange={(e) => setSignupGender(e.target.value)}
                      >
                        <option value="male">남성</option>
                        <option value="female">여성</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="signup-age">나이 (세)</Label>
                        <Input
                          id="signup-age"
                          type="number"
                          step="1"
                          placeholder="25"
                          value={signupAge}
                          onChange={(e) => setSignupAge(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-height">신장 (cm)</Label>
                        <Input
                          id="signup-height"
                          type="number"
                          step="1"
                          placeholder="175"
                          value={signupHeight}
                          onChange={(e) => setSignupHeight(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-weight">체중 (kg)</Label>
                      <Input
                        id="signup-weight"
                        type="number"
                        step="0.1"
                        placeholder="70.0"
                        value={signupWeight}
                        onChange={(e) => setSignupWeight(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="signup-muscle">골격근량 (kg)</Label>
                        <Input
                          id="signup-muscle"
                          type="number"
                          step="0.1"
                          placeholder="30.0"
                          value={signupMuscleMass}
                          onChange={(e) => setSignupMuscleMass(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-bodyfat">체지방량 (kg)</Label>
                        <Input
                          id="signup-bodyfat"
                          type="number"
                          step="0.1"
                          placeholder="15.0"
                          value={signupBodyFat}
                          onChange={(e) => setSignupBodyFat(e.target.value)}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      * 신체 정보는 선택 사항이며, 나중에 프로필에서 수정할 수 있습니다.
                    </p>
                  </div>
                </div>

                {/* 코치용 추가 정보 */}
                {signupUserType === "coach" && (
                  <div className="border-b pb-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Dumbbell className="w-4 h-4" />
                      코치 정보
                    </h3>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="coach-certification">자격증 (선택)</Label>
                        <Input
                          id="coach-certification"
                          type="text"
                          placeholder="예: NSCA-CPT, ACE-CPT"
                          value={coachCertification}
                          onChange={(e) => setCoachCertification(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="coach-specialty">전문 분야 (선택)</Label>
                        <Input
                          id="coach-specialty"
                          type="text"
                          placeholder="예: 보디빌딩, 파워리프팅, 크로스핏"
                          value={coachSpecialty}
                          onChange={(e) => setCoachSpecialty(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="coach-profile-image">프로필 이미지 (선택)</Label>
                        <Input
                          id="coach-profile-image"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setCoachProfileImage(file);
                              setCoachProfileImagePreview(URL.createObjectURL(file));
                            }
                          }}
                        />
                        {coachProfileImagePreview && (
                          <div className="mt-2">
                            <img
                              src={coachProfileImagePreview}
                              alt="Coach Profile"
                              className="h-20 w-20 object-cover rounded-full"
                            />
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="coach-career-history">경력 사항 (선택)</Label>
                        <Input
                          id="coach-career-history"
                          type="text"
                          placeholder="예: 5년간 프로 피트니스 코치 경험"
                          value={coachCareerHistory}
                          onChange={(e) => setCoachCareerHistory(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="coach-message">코치 메시지 (선택)</Label>
                        <Input
                          id="coach-message"
                          type="text"
                          placeholder="예: 건강한 삶을 위한 최선의 피트니스 계획을 제공합니다."
                          value={coachMessage}
                          onChange={(e) => setCoachMessage(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="coach-center-id">소속 센터 (선택)</Label>
                        <select
                          id="coach-center-id"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          value={coachCenterId}
                          onChange={(e) => setCoachCenterId(e.target.value)}
                        >
                          <option value="">선택하지 않음</option>
                          {availableCenters.map(center => (
                            <option key={center.id} value={center.id}>{center.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* 센터용 추가 정보 */}
                {signupUserType === "center" && (
                  <div className="border-b pb-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Crown className="w-4 h-4" />
                      센터 정보
                    </h3>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="center-business-number">사업자 등록번호 *</Label>
                        <Input
                          id="center-business-number"
                          type="text"
                          placeholder="123-45-67890"
                          value={centerBusinessNumber}
                          onChange={(e) => setCenterBusinessNumber(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="center-owner-name">센터장 이름 *</Label>
                        <Input
                          id="center-owner-name"
                          type="text"
                          placeholder="홍길동"
                          value={centerOwnerName}
                          onChange={(e) => setCenterOwnerName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="center-logo">센터 로고 (선택)</Label>
                        <Input
                          id="center-logo"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setCenterLogo(file);
                              setCenterLogoPreview(URL.createObjectURL(file));
                            }
                          }}
                        />
                        {centerLogoPreview && (
                          <div className="mt-2">
                            <img
                              src={centerLogoPreview}
                              alt="Center Logo"
                              className="h-20 w-20 object-cover rounded-full"
                            />
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="center-introduction">센터 소개 (선택)</Label>
                        <Input
                          id="center-introduction"
                          type="text"
                          placeholder="센터에 대한 간단한 소개를 작성하세요."
                          value={centerIntroduction}
                          onChange={(e) => setCenterIntroduction(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  <User className="w-4 h-4 mr-2" />
                  {isLoading ? "가입 중..." : "회원가입"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          {/* 데모 버튼들 */}
          {(onCenterDemo || onCoachDemo) && (
            <div className="mt-6">
              <Separator />
              <div className="mt-4 space-y-3">
                <p className="text-sm text-gray-500 text-center mb-3">관리 프로그램이 궁금하신가요?</p>
                
                {onCenterDemo && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCenterDemo}
                    className="w-full border-green-500 text-green-600 hover:bg-green-50"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    센터 대시보드 데모 보기
                  </Button>
                )}
                
                {onCoachDemo && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCoachDemo}
                    className="w-full border-purple-500 text-purple-600 hover:bg-purple-50"
                  >
                    <Dumbbell className="w-4 h-4 mr-2" />
                    코치 대시보드 데모 보기
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}