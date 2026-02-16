import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { toast } from "sonner";

interface CoachProfileTabProps {
  accessToken: string;
  supabaseUrl: string;
  publicAnonKey: string;
  coachId: string;
  onProfileUpdate?: () => void;
}

export function CoachProfileTab({ 
  accessToken, 
  supabaseUrl, 
  publicAnonKey,
  coachId,
  onProfileUpdate
}: CoachProfileTabProps) {
  const [name, setName] = useState("");
  const [certification, setCertification] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [careerHistory, setCareerHistory] = useState("");
  const [message, setMessage] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [gender, setGender] = useState("");
  const [location, setLocation] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/make-server-2c29cd73/coach-profile`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.profile) {
          setName(data.profile.name || "");
          setCertification(data.profile.certification || "");
          setSpecialty(data.profile.specialty || "");
          setCareerHistory(data.profile.careerHistory || "");
          setMessage(data.profile.message || "");
          setProfileImage(data.profile.profileImage || "");
          setGender(data.profile.gender || "");
          setLocation(data.profile.location || "");
        }
      }
    } catch (error) {
      console.error("Error loading coach profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name) {
      toast.error("이름은 필수입니다.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/make-server-2c29cd73/coach-profile`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            name,
            certification,
            specialty,
            careerHistory,
            message,
            profileImage,
            gender,
            location,
          }),
        }
      );

      if (response.ok) {
        toast.success("프로필이 저장되었습니다!");
        if (onProfileUpdate) {
          onProfileUpdate();
        }
      } else {
        toast.error("프로필 저장에 실패했습니다.");
      }
    } catch (error) {
      console.error("Error saving coach profile:", error);
      toast.error("프로필 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">프로필 로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">프로필 설정</h2>
        <p className="text-gray-500 mt-1">코치 프로필 정보를 입력하세요</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
          <CardDescription>회원들에게 표시될 프로필 정보입니다</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">이름 *</Label>
              <Input
                id="name"
                placeholder="홍길동"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="certification">자격증</Label>
              <Input
                id="certification"
                placeholder="예: 생활스포츠지도사 2급"
                value={certification}
                onChange={(e) => setCertification(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="specialty">전문 분야</Label>
              <Input
                id="specialty"
                placeholder="예: 체력 향상, 재활 운동"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">성별</Label>
              <Input
                id="gender"
                placeholder="male 또는 female"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">위치</Label>
              <Input
                id="location"
                placeholder="예: 강남구, 서초구"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-image">프로필 이미지 URL</Label>
              <Input
                id="profile-image"
                placeholder="https://example.com/profile.jpg"
                value={profileImage}
                onChange={(e) => setProfileImage(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="career">경력 사항</Label>
            <Textarea
              id="career"
              placeholder="경력과 이력을 입력해주세요..."
              value={careerHistory}
              onChange={(e) => setCareerHistory(e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">소개 메시지</Label>
            <Textarea
              id="message"
              placeholder="회원들에게 전할 메시지를 입력해주세요..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>

          <Button onClick={handleSave} className="w-full" disabled={isSaving}>
            {isSaving ? "저장 중..." : "프로필 저장"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
