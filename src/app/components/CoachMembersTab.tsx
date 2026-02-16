import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Badge } from "@/app/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Users, FileText, MessageSquare, Dumbbell, TrendingUp, Calendar, Send } from "lucide-react";
import { toast } from "sonner";

interface CoachMembersTabProps {
  accessToken: string;
  supabaseUrl: string;
  publicAnonKey: string;
  coachId: string;
}

interface Member {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  totalSessions: number;
  remainingSessions: number;
  purchaseDate: string;
}

export function CoachMembersTab({ 
  accessToken, 
  supabaseUrl, 
  publicAnonKey,
  coachId
}: CoachMembersTabProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showMemberDialog, setShowMemberDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Feedback state
  const [feedbackText, setFeedbackText] = useState("");
  const [sessionNumber, setSessionNumber] = useState("");
  const [isSavingFeedback, setIsSavingFeedback] = useState(false);
  
  // Program state
  const [programText, setProgramText] = useState("");
  const [programWeek, setProgramWeek] = useState("");
  const [isSavingProgram, setIsSavingProgram] = useState(false);
  
  // PT Journal state
  const [journalText, setJournalText] = useState("");
  const [journalDate, setJournalDate] = useState(new Date().toISOString().split("T")[0]);
  const [isSavingJournal, setIsSavingJournal] = useState(false);
  
  // Member data
  const [memberInbodyData, setMemberInbodyData] = useState<any[]>([]);
  const [memberFeedbacks, setMemberFeedbacks] = useState<any[]>([]);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${supabaseUrl}/functions/v1/make-server-2c29cd73/coach-members`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMembers(data.members || []);
      }
    } catch (error) {
      console.error("Error loading members:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMemberData = async (userId: string) => {
    try {
      // Load member's inbody data
      const inbodyResponse = await fetch(
        `${supabaseUrl}/functions/v1/make-server-2c29cd73/member-inbody/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (inbodyResponse.ok) {
        const inbodyData = await inbodyResponse.json();
        setMemberInbodyData(inbodyData.measurements || []);
      }

      // Load member's feedbacks
      const feedbackResponse = await fetch(
        `${supabaseUrl}/functions/v1/make-server-2c29cd73/member-feedbacks/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (feedbackResponse.ok) {
        const feedbackData = await feedbackResponse.json();
        setMemberFeedbacks(feedbackData.feedbacks || []);
      }
    } catch (error) {
      console.error("Error loading member data:", error);
    }
  };

  const handleViewMember = (member: Member) => {
    setSelectedMember(member);
    setShowMemberDialog(true);
    loadMemberData(member.userId);
  };

  const handleSaveFeedback = async () => {
    if (!selectedMember || !feedbackText || !sessionNumber) {
      toast.error("모든 항목을 입력해주세요.");
      return;
    }

    setIsSavingFeedback(true);
    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/make-server-2c29cd73/coach-feedback`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            userId: selectedMember.userId,
            sessionNumber: parseInt(sessionNumber),
            feedback: feedbackText,
            weekId: new Date().toISOString().split("T")[0],
          }),
        }
      );

      if (response.ok) {
        toast.success("피드백이 저장되었습니다!");
        setFeedbackText("");
        setSessionNumber("");
        loadMemberData(selectedMember.userId);
      } else {
        toast.error("피드백 저장에 실패했습니다.");
      }
    } catch (error) {
      console.error("Error saving feedback:", error);
      toast.error("피드백 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSavingFeedback(false);
    }
  };

  const handleSaveProgram = async () => {
    if (!selectedMember || !programText || !programWeek) {
      toast.error("모든 항목을 입력해주세요.");
      return;
    }

    setIsSavingProgram(true);
    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/make-server-2c29cd73/coach-program`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            userId: selectedMember.userId,
            weekId: programWeek,
            program: programText,
          }),
        }
      );

      if (response.ok) {
        toast.success("운동 프로그램이 전송되었습니다!");
        setProgramText("");
        setProgramWeek("");
      } else {
        toast.error("프로그램 저장에 실패했습니다.");
      }
    } catch (error) {
      console.error("Error saving program:", error);
      toast.error("프로그램 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSavingProgram(false);
    }
  };

  const handleSaveJournal = async () => {
    if (!selectedMember || !journalText || !journalDate) {
      toast.error("모든 항목을 입력해주세요.");
      return;
    }

    setIsSavingJournal(true);
    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/make-server-2c29cd73/pt-journal`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            userId: selectedMember.userId,
            date: journalDate,
            journal: journalText,
          }),
        }
      );

      if (response.ok) {
        toast.success("PT 일지가 저장되었습니다!");
        setJournalText("");
        setJournalDate(new Date().toISOString().split("T")[0]);
      } else {
        toast.error("일지 저장에 실패했습니다.");
      }
    } catch (error) {
      console.error("Error saving journal:", error);
      toast.error("일지 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSavingJournal(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">회원 관리</h2>
        <p className="text-gray-500 mt-1">PT를 구매한 회원들을 관리하세요</p>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            로딩 중...
          </CardContent>
        </Card>
      ) : members.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">아직 등록된 회원이 없습니다.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => (
            <Card key={member.id} className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-purple-100 text-purple-600">
                      {member.userName?.[0] || member.userEmail[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-base">{member.userName || member.userEmail}</CardTitle>
                    <p className="text-sm text-gray-500">{member.userEmail}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-500">총 횟수</p>
                    <p className="font-semibold">{member.totalSessions}회</p>
                  </div>
                  <div>
                    <p className="text-gray-500">남은 횟수</p>
                    <p className="font-semibold text-purple-600">{member.remainingSessions}회</p>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  구매일: {new Date(member.purchaseDate).toLocaleDateString()}
                </div>
                <Button
                  className="w-full"
                  size="sm"
                  onClick={() => handleViewMember(member)}
                >
                  회원 상세보기
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Member Detail Dialog */}
      <Dialog open={showMemberDialog} onOpenChange={setShowMemberDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              {selectedMember?.userName || selectedMember?.userEmail} 회원 관리
            </DialogTitle>
            <DialogDescription>
              회원의 기록을 확인하고 피드백과 프로그램을 제공하세요
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="records" className="mt-4">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="records">기록 보기</TabsTrigger>
              <TabsTrigger value="feedback">피드백</TabsTrigger>
              <TabsTrigger value="program">운동 프로그램</TabsTrigger>
              <TabsTrigger value="journal">PT 일지</TabsTrigger>
            </TabsList>

            <TabsContent value="records" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">인바디 기록</CardTitle>
                </CardHeader>
                <CardContent>
                  {memberInbodyData.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">인바디 기록이 없습니다.</p>
                  ) : (
                    <div className="space-y-2">
                      {memberInbodyData.slice(-5).reverse().map((record: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div>
                            <p className="text-sm font-medium">{record.date}</p>
                            <p className="text-xs text-gray-500">
                              체중: {record.weight}kg | 골격근: {record.muscleMass}kg | 체지방: {record.bodyFat}kg
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="feedback" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">주간 피드백 작성</CardTitle>
                  <CardDescription>회원의 주간 분석에 피드백을 남겨주세요</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="session-number">세션 번호</Label>
                    <Input
                      id="session-number"
                      type="number"
                      placeholder="1"
                      value={sessionNumber}
                      onChange={(e) => setSessionNumber(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="feedback">피드백 내용</Label>
                    <Textarea
                      id="feedback"
                      placeholder="이번 주 운동과 식단에 대한 피드백을 작성해주세요..."
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      rows={6}
                    />
                  </div>
                  <Button 
                    onClick={handleSaveFeedback} 
                    className="w-full"
                    disabled={isSavingFeedback}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {isSavingFeedback ? "전송 중..." : "피드백 전송"}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">작성한 피드백</CardTitle>
                </CardHeader>
                <CardContent>
                  {memberFeedbacks.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">작성한 피드백이 없습니다.</p>
                  ) : (
                    <div className="space-y-3">
                      {memberFeedbacks.map((fb: any) => (
                        <div key={fb.id} className="p-3 bg-gray-50 rounded">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline">세션 {fb.sessionNumber}</Badge>
                            <span className="text-xs text-gray-500">{fb.weekId}</span>
                          </div>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{fb.feedback}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="program" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">운동 프로그램 작성</CardTitle>
                  <CardDescription>회원에게 주간 운동 프로그램을 보내주세요</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="program-week">주차 (시작일)</Label>
                    <Input
                      id="program-week"
                      type="date"
                      value={programWeek}
                      onChange={(e) => setProgramWeek(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="program">운동 프로그램</Label>
                    <Textarea
                      id="program"
                      placeholder="주간 운동 프로그램을 작성해주세요...&#10;&#10;월요일:&#10;- 스쿼트 4세트 x 10회&#10;- 벤치프레스 3세트 x 12회&#10;..."
                      value={programText}
                      onChange={(e) => setProgramText(e.target.value)}
                      rows={10}
                    />
                  </div>
                  <Button 
                    onClick={handleSaveProgram} 
                    className="w-full"
                    disabled={isSavingProgram}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {isSavingProgram ? "전송 중..." : "프로그램 전송"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="journal" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">PT 일지 작성</CardTitle>
                  <CardDescription>오늘 진행한 PT 내용을 기록하세요</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="journal-date">일지 날짜</Label>
                    <Input
                      id="journal-date"
                      type="date"
                      value={journalDate}
                      onChange={(e) => setJournalDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="journal">PT 일지</Label>
                    <Textarea
                      id="journal"
                      placeholder="오늘 PT 내용을 기록해주세요...&#10;&#10;운동 내용:&#10;- 진행한 운동과 세트/반복 수&#10;&#10;특이사항:&#10;- 회원의 컨디션이나 주의사항&#10;&#10;다음 PT 계획:&#10;- 다음 세션 계획"
                      value={journalText}
                      onChange={(e) => setJournalText(e.target.value)}
                      rows={10}
                    />
                  </div>
                  <Button 
                    onClick={handleSaveJournal} 
                    className="w-full"
                    disabled={isSavingJournal}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    {isSavingJournal ? "저장 중..." : "일지 저장 및 전송"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
