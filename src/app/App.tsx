import { useState, useEffect } from "react";
import { LoginPage } from "@/app/components/LoginPage";
import { TermsAgreementPage } from "@/app/components/TermsAgreementPage";
import { OnboardingPage } from "@/app/components/OnboardingPage";
import { Dashboard } from "@/app/components/Dashboard";
import { CenterDashboard } from "@/app/components/CenterDashboard";
import { CoachDashboard } from "@/app/components/CoachDashboard";
import { Toaster } from "sonner";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { getSupabaseClient } from "@/utils/supabase/client";

export default function App() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsTermsAgreement, setNeedsTermsAgreement] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [devMode, setDevMode] = useState(false); // 개발 모드
  const [userType, setUserType] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [centerDemoMode, setCenterDemoMode] = useState(false); // 센터 데모 모드
  const [coachDemoMode, setCoachDemoMode] = useState(false); // 코치 데모 모드

  const supabaseUrl = `https://${projectId}.supabase.co`;
  const supabase = getSupabaseClient();

  useEffect(() => {
    // Check if user has an active session
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        
        if (data.session?.access_token) {
          setAccessToken(data.session.access_token);
          await checkUserStatus(data.session.access_token);
        }

        // Listen to auth state changes (for OAuth redirects)
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log("Auth state changed:", event);
          if (session?.access_token) {
            setAccessToken(session.access_token);
            await checkUserStatus(session.access_token);
          } else if (event === 'SIGNED_OUT') {
            setAccessToken(null);
            setNeedsTermsAgreement(false);
            setNeedsOnboarding(false);
          }
        });

        return () => {
          authListener?.subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const checkUserStatus = async (token: string) => {
    try {
      // 현재 약관 버전
      const CURRENT_TERMS_VERSION = {
        service: "1.0.0",
        privacy: "1.0.0",
        health: "1.0.0",
        age: "1.0.0",
        marketing: "1.0.0",
      };

      // 1. 약관 동의 확인 및 버전 체크
      const localTerms = localStorage.getItem(`terms_${token.substring(0, 10)}`);
      
      if (!localTerms) {
        setNeedsTermsAgreement(true);
        setNeedsOnboarding(false);
        return;
      }

      // 약관 버전 확인
      try {
        const termsData = JSON.parse(localTerms);
        const agreedVersions = termsData.versions || {};

        // 버전이 다르면 재동의 필요
        const needsReAgreement = 
          agreedVersions.service !== CURRENT_TERMS_VERSION.service ||
          agreedVersions.privacy !== CURRENT_TERMS_VERSION.privacy;

        if (needsReAgreement) {
          console.log("약관이 변경되었습니다. 재동의가 필요합니다.");
          setNeedsTermsAgreement(true);
          setNeedsOnboarding(false);
          return;
        }
      } catch (parseError) {
        console.error("Error parsing terms data:", parseError);
        setNeedsTermsAgreement(true);
        setNeedsOnboarding(false);
        return;
      }

      // 2. 온보딩 완료 확인
      let hasCompletedOnboarding = false;

      try {
        // Get user info first
        const userInfoResponse = await fetch(`${supabaseUrl}/functions/v1/make-server-2c29cd73/user-info`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (userInfoResponse.ok) {
          const userInfoData = await userInfoResponse.json();
          setUserType(userInfoData.userInfo?.userType || "member");
          setUserName(userInfoData.userInfo?.name || "");
        }

        // Get current user to get userId
        const { data: userData } = await supabase.auth.getUser(token);
        if (userData.user) {
          setUserId(userData.user.id);
        }

        // Check onboarding status
        const profileResponse = await fetch(`${supabaseUrl}/functions/v1/make-server-2c29cd73/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          hasCompletedOnboarding = profileData.profile?.onboardingComplete;
        }
      } catch (profileError) {
        console.warn("Profile API error, checking localStorage:", profileError);
        // Fallback to localStorage
        const localProfile = localStorage.getItem(`profile_${token.substring(0, 10)}`);
        if (localProfile) {
          const profile = JSON.parse(localProfile);
          hasCompletedOnboarding = profile.onboardingComplete;
          setUserType(profile.userType);
          setUserName(profile.name);
          setUserId(profile.id);
        }
      }

      if (!hasCompletedOnboarding) {
        setNeedsTermsAgreement(false);
        setNeedsOnboarding(true);
      } else {
        setNeedsTermsAgreement(false);
        setNeedsOnboarding(false);
      }
    } catch (error) {
      console.error("Error checking user status:", error);
      setNeedsTermsAgreement(true);
      setNeedsOnboarding(false);
    }
  };

  const handleLogin = async (token: string) => {
    setAccessToken(token);
    await checkUserStatus(token);
  };

  const handleTermsComplete = async () => {
    setNeedsTermsAgreement(false);
    if (accessToken) {
      await checkUserStatus(accessToken);
    }
  };

  const handleOnboardingComplete = async () => {
    setNeedsOnboarding(false);
    if (accessToken) {
      await checkUserStatus(accessToken);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setAccessToken(null);
      setNeedsTermsAgreement(false);
      setNeedsOnboarding(false);
      setDevMode(false);
      setCenterDemoMode(false); // 센터 데모 모드 종료
      setCoachDemoMode(false); // 코치 데모 모드 종료
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // 개발 모드 활성화 (데모용)
  const enableDevMode = () => {
    setDevMode(true);
    setUserType("member");
    setUserName("데모 회원");
    setUserId("demo-user-id");
    setAccessToken("dev-mode-token");
  };

  // 센터 데모 모드 활성화
  const enableCenterDemoMode = () => {
    setCenterDemoMode(true);
    setUserType("center");
    setUserName("데모 센터");
    setUserId("center-demo-id");
    setAccessToken("center-demo-token");
  };

  // 코치 데모 모드 활성화
  const enableCoachDemoMode = () => {
    setCoachDemoMode(true);
    setUserType("coach");
    setUserName("데모 코치");
    setUserId("coach-demo-id");
    setAccessToken("coach-demo-token");
  };

  // 센터 데모 모드 종료
  const exitCenterDemoMode = () => {
    setCenterDemoMode(false);
    setUserType(null);
    setUserName("");
    setAccessToken(null);
  };

  // 코치 데모 모드 종료
  const exitCoachDemoMode = () => {
    setCoachDemoMode(false);
    setUserType(null);
    setUserName("");
    setAccessToken(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-center" richColors toastOptions={{
        style: {
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }
      }} />
      {accessToken ? (
        needsTermsAgreement ? (
          <TermsAgreementPage
            accessToken={accessToken}
            supabaseUrl={supabaseUrl}
            onComplete={handleTermsComplete}
          />
        ) : needsOnboarding ? (
          <OnboardingPage
            accessToken={accessToken}
            supabaseUrl={supabaseUrl}
            publicAnonKey={publicAnonKey}
            onComplete={handleOnboardingComplete}
          />
        ) : (
          userType === "center" ? (
            <CenterDashboard
              accessToken={accessToken}
              onLogout={handleLogout}
              supabaseUrl={supabaseUrl}
              publicAnonKey={publicAnonKey}
              userName={userName}
              userId={userId}
            />
          ) : userType === "coach" ? (
            <CoachDashboard
              accessToken={accessToken}
              onLogout={handleLogout}
              supabaseUrl={supabaseUrl}
              publicAnonKey={publicAnonKey}
              userName={userName}
              userId={userId}
            />
          ) : (
            <Dashboard
              accessToken={accessToken}
              onLogout={handleLogout}
              supabaseUrl={supabaseUrl}
              publicAnonKey={publicAnonKey}
              userName={userName}
            />
          )
        )
      ) : (
        <div>
          <LoginPage
            onLogin={handleLogin}
            supabaseUrl={supabaseUrl}
            publicAnonKey={publicAnonKey}
            onCenterDemo={enableCenterDemoMode}
            onCoachDemo={enableCoachDemoMode}
          />
          {/* 개발 모드 버튼 */}
          <div className="fixed bottom-4 right-4">
            <button
              onClick={enableDevMode}
              className="bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-gray-700 text-sm"
            >
              🚀 데모 모드로 보기
            </button>
          </div>
        </div>
      )}
    </>
  );
}