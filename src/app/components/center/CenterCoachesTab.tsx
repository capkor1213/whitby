import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/app/components/ui/dialog";
import { Badge } from "@/app/components/ui/badge";
import { Dumbbell, Plus, Edit, Upload, User, Award, MessageSquare, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Coach {
  id: string;
  name: string;
  email: string;
  certification?: string;
  specialty?: string;
  profileImage?: string;
  careerHistory?: string;
  message?: string;
  createdAt: string;
}

interface CenterCoachesTabProps {
  accessToken: string;
  supabaseUrl: string;
  publicAnonKey: string;
}

export function CenterCoachesTab({ accessToken, supabaseUrl, publicAnonKey }: CenterCoachesTabProps) {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingCoach, setEditingCoach] = useState<Coach | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // 편집 폼 상태
  const [profileImage, setProfileImage] = useState("");
  const [careerHistory, setCareerHistory] = useState("");
  const [message, setMessage] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadCoaches();
  }, []);

  const loadCoaches = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/make-server-2c29cd73/coaches`, {
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCoaches(data.coaches || []);
      }
    } catch (error) {
      console.error("코치 목록 로딩 에러:", error);
      toast.error("코치 목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (coach: Coach) => {
    setEditingCoach(coach);
    setProfileImage(coach.profileImage || "");
    setCareerHistory(coach.careerHistory || "");
    setMessage(coach.message || "");
    setIsDialogOpen(true);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 이미지 파일 체크
    if (!file.type.startsWith("image/")) {
      toast.error("이미지 파일만 업로드 가능합니다.");
      return;
    }

    // 파일 크기 체크 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("파일 크기는 5MB 이하여야 합니다.");
      return;
    }

    setUploadingImage(true);
    try {
      // FormData로 파일 전송
      const formData = new FormData();
      formData.append("file", file);
      formData.append("coachId", editingCoach?.id || "");

      const response = await fetch(`${supabaseUrl}/functions/v1/make-server-2c29cd73/coaches/upload-image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setProfileImage(data.imageUrl);
        toast.success("프로필 사진이 업로드되었습니다!");
      } else {
        throw new Error("업로드 실패");
      }
    } catch (error) {
      console.error("이미지 업로드 에러:", error);
      toast.error("이미지 업로드에 실패했습니다.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!editingCoach) return;

    setLoading(true);
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/make-server-2c29cd73/coaches/${editingCoach.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          profileImage,
          careerHistory,
          message,
        }),
      });

      if (response.ok) {
        toast.success("프로필이 업데이트되었습니다!");
        setIsDialogOpen(false);
        loadCoaches();
      } else {
        throw new Error("저장 실패");
      }
    } catch (error) {
      console.error("프로필 저장 에러:", error);
      toast.error("프로필 저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!editingCoach?.profileImage) return;

    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/make-server-2c29cd73/coaches/${editingCoach.id}/delete-image`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
      });

      if (response.ok) {
        setProfileImage("");
        toast.success("프로필 사진이 삭제되었습니다.");
      }
    } catch (error) {
      console.error("이미지 삭제 에러:", error);
      toast.error("이미지 삭제에 실패했습니다.");
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">코치 관리</h1>
        <p className="text-gray-500">센터 소속 코치의 프로필을 관리합니다</p>
      </div>

      {loading && coaches.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">로딩 중...</p>
        </div>
      ) : coaches.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Dumbbell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">등록된 코치가 없습니다.</p>
            <p className="text-sm text-gray-400 mt-2">코치 계정으로 가입하면 여기에 표시됩니다.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coaches.map((coach) => (
            <Card key={coach.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={coach.profileImage} alt={coach.name} />
                      <AvatarFallback className="bg-purple-100 text-purple-600 text-lg">
                        {coach.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{coach.name}</CardTitle>
                      <CardDescription className="text-xs">{coach.email}</CardDescription>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEditClick(coach)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {coach.certification && (
                  <div className="flex items-start gap-2">
                    <Award className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">자격증</p>
                      <p className="text-sm text-gray-900">{coach.certification}</p>
                    </div>
                  </div>
                )}
                {coach.specialty && (
                  <div className="flex items-start gap-2">
                    <Dumbbell className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">전문 분야</p>
                      <p className="text-sm text-gray-900">{coach.specialty}</p>
                    </div>
                  </div>
                )}
                {coach.careerHistory && (
                  <div className="flex items-start gap-2">
                    <User className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">이력사항</p>
                      <p className="text-sm text-gray-900 line-clamp-2">{coach.careerHistory}</p>
                    </div>
                  </div>
                )}
                {coach.message && (
                  <div className="flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">하고 싶은 말</p>
                      <p className="text-sm text-gray-900 line-clamp-2">{coach.message}</p>
                    </div>
                  </div>
                )}
                {!coach.careerHistory && !coach.message && !coach.profileImage && (
                  <p className="text-xs text-gray-400 italic">프로필 정보를 추가해주세요</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 프로필 편집 다이얼로그 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-purple-600" />
              코치 프로필 편집
            </DialogTitle>
            <DialogDescription>
              {editingCoach?.name}님의 프로필 정보를 관리합니다
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* 프로필 사진 */}
            <div className="space-y-3">
              <Label>프로필 사진</Label>
              <div className="flex items-center gap-4">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profileImage} alt={editingCoach?.name} />
                  <AvatarFallback className="bg-purple-100 text-purple-600 text-2xl">
                    {editingCoach?.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploadingImage ? "업로드 중..." : "사진 업로드"}
                  </Button>
                  {profileImage && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleDeleteImage}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      사진 삭제
                    </Button>
                  )}
                  <p className="text-xs text-gray-500">JPG, PNG (최대 5MB)</p>
                </div>
              </div>
            </div>

            {/* 기본 정보 (읽기 전용) */}
            <div className="border-t pt-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">기본 정보</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">이메일</Label>
                  <p className="text-sm text-gray-900 mt-1">{editingCoach?.email}</p>
                </div>
                {editingCoach?.certification && (
                  <div>
                    <Label className="text-xs text-gray-500">자격증</Label>
                    <p className="text-sm text-gray-900 mt-1">{editingCoach.certification}</p>
                  </div>
                )}
                {editingCoach?.specialty && (
                  <div>
                    <Label className="text-xs text-gray-500">전문 분야</Label>
                    <p className="text-sm text-gray-900 mt-1">{editingCoach.specialty}</p>
                  </div>
                )}
              </div>
            </div>

            {/* 이력사항 */}
            <div className="space-y-2">
              <Label htmlFor="career-history">이력사항</Label>
              <Textarea
                id="career-history"
                placeholder="학력, 경력, 수상 경력 등을 입력하세요&#10;예:&#10;- 서울대학교 체육교육과 졸업&#10;- 국가대표 트레이너 5년&#10;- NSCA-CSCS 자격 보유"
                value={careerHistory}
                onChange={(e) => setCareerHistory(e.target.value)}
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-gray-500">
                회원들에게 보여질 코치님의 이력을 작성해주세요
              </p>
            </div>

            {/* 하고 싶은 말 */}
            <div className="space-y-2">
              <Label htmlFor="message">하고 싶은 말</Label>
              <Textarea
                id="message"
                placeholder="회원들에게 전하고 싶은 메시지를 입력하세요&#10;예:&#10;건강한 몸은 올바른 습관에서 시작됩니다. 함께 목표를 향해 나아가요!"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-gray-500">
                회원들에게 동기부여가 될 수 있는 메시지를 작성해주세요
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              취소
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {loading ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
