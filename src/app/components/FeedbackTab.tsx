import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { toast } from "sonner";
import { MessageSquare, Send, User, Edit2, Save, X, Sparkles } from "lucide-react";

interface FeedbackTabProps {
  accessToken: string;
  supabaseUrl: string;
  publicAnonKey: string;
}

export function FeedbackTab({ accessToken, supabaseUrl, publicAnonKey }: FeedbackTabProps) {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [weekId, setWeekId] = useState("");
  const [feedbackText, setFeedbackText] = useState("");
  const [coachName, setCoachName] = useState("");
  const [weekData, setWeekData] = useState<any>(null);
  const [editingFeedbackId, setEditingFeedbackId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  useEffect(() => {
    loadFeedbacks();
    
    // Set current week as default
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    setWeekId(startOfWeek.toISOString().split("T")[0]);
  }, []);

  const loadFeedbacks = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/make-server-2c29cd73/feedback`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.feedbacks) {
          const sorted = data.feedbacks
            .map((f: any) => f.value)
            .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setFeedbacks(sorted);
        }
      }
    } catch (error) {
      console.error("Error loading feedbacks:", error);
      toast.error("피드백 로딩 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!weekId || !feedbackText) {
      toast.error("주차와 피드백 내용을 입력해주세요.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/make-server-2c29cd73/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          weekId,
          feedback: feedbackText,
          coachName: coachName || "코치",
        }),
      });

      if (response.ok) {
        toast.success("피드백이 저장되었습니다!");
        setFeedbackText("");
        setCoachName("");
        loadFeedbacks();
      } else {
        toast.error("피드백 저장에 실패했습니다.");
      }
    } catch (error) {
      console.error("Error saving feedback:", error);
      toast.error("피드백 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateFeedback = async () => {
    if (!weekId) {
      toast.error("주차를 선택해주세요.");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/make-server-2c29cd73/generate-feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          weekId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setFeedbackText(data.feedback);
      } else {
        toast.error("피드백 생성에 실패했습니다.");
      }
    } catch (error) {
      console.error("Error generating feedback:", error);
      toast.error("피드백 생성 중 오류가 발생했습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditFeedback = (feedbackId: string, feedback: string) => {
    setEditingFeedbackId(feedbackId);
    setEditingText(feedback);
  };

  const handleUpdateFeedback = async () => {
    if (!editingFeedbackId || !editingText) {
      toast.error("피드백 내용을 입력해주세요.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/make-server-2c29cd73/feedback`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          feedbackId: editingFeedbackId,
          feedback: editingText,
        }),
      });

      if (response.ok) {
        toast.success("피드백이 업데이트되었습니다!");
        setEditingFeedbackId(null);
        setEditingText("");
        loadFeedbacks();
      } else {
        toast.error("피드백 업데이트에 실패했습니다.");
      }
    } catch (error) {
      console.error("Error updating feedback:", error);
      toast.error("피드백 업데이트 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-indigo-600" />
            <CardTitle>새 피드백 작성</CardTitle>
          </div>
          <CardDescription>주간 운동 및 식단에 대한 코치의 피드백을 남기세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="week-id">피드백 주차 (주 시작일)</Label>
              <Input
                id="week-id"
                type="date"
                value={weekId}
                onChange={(e) => setWeekId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coach-name">코치 이름 (선택사항)</Label>
              <Input
                id="coach-name"
                placeholder="예: 김코치"
                value={coachName}
                onChange={(e) => setCoachName(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="feedback-text">피드백 내용</Label>
            <Textarea
              id="feedback-text"
              placeholder="이번 주 운동 및 식단에 대한 피드백을 작성하세요..."
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              rows={5}
            />
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleGenerateFeedback} 
              variant="outline" 
              className="w-full bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200 hover:from-purple-100 hover:to-indigo-100" 
              disabled={isGenerating}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {isGenerating ? "AI 생성 중..." : "AI 피드백 생성"}
            </Button>
            <Button onClick={handleSave} className="w-full" disabled={isSaving}>
              <Send className="w-4 h-4 mr-2" />
              {isSaving ? "저장 중..." : "피드백 저장"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <CardTitle>받은 피드백</CardTitle>
          </div>
          <CardDescription>코치로부터 받은 주간 피드백 목록</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-500">피드백 로딩 중...</p>
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">아직 받은 피드백이 없습니다.</p>
              <p className="text-sm text-gray-400 mt-2">코치가 피드백을 남기면 여기에 표시됩니다.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {feedbacks.map((feedback, index) => {
                const feedbackId = feedback.weekId + "_" + feedback.createdAt;
                const isEditing = editingFeedbackId === feedbackId;
                
                return (
                <Card key={index} className="bg-gradient-to-br from-blue-50 to-indigo-50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="bg-indigo-600 p-2 rounded-full">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{feedback.coachName}</CardTitle>
                          <CardDescription className="text-xs">
                            {new Date(feedback.createdAt).toLocaleDateString("ko-KR", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm text-indigo-600 font-medium">
                          Week of {new Date(feedback.weekId).toLocaleDateString("ko-KR")}
                        </div>
                        {!isEditing && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditFeedback(feedbackId, feedback.feedback)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
                      <div className="space-y-3">
                        <Textarea
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          rows={5}
                          className="bg-white"
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={handleUpdateFeedback}
                            size="sm"
                            disabled={isSaving}
                          >
                            <Save className="w-4 h-4 mr-1" />
                            {isSaving ? "저장 중..." : "저장"}
                          </Button>
                          <Button
                            onClick={() => {
                              setEditingFeedbackId(null);
                              setEditingText("");
                            }}
                            variant="outline"
                            size="sm"
                          >
                            <X className="w-4 h-4 mr-1" />
                            취소
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{feedback.feedback}</p>
                    )}
                  </CardContent>
                </Card>
              )})}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}