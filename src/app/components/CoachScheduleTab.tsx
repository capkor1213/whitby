import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Calendar, Clock, User, Check, X, AlertCircle, Bell, ChevronLeft, ChevronRight, CalendarDays, CalendarRange, Plus, Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { toast } from "sonner";

interface CoachScheduleTabProps {
  accessToken: string;
  supabaseUrl: string;
  publicAnonKey: string;
  coachId: string;
  coachName: string;
}

interface PTRequest {
  id: string;
  memberId: string;
  memberName: string;
  requestedDate: string;
  requestedTime: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  remainingSessions: number;
}

interface Schedule {
  id: string;
  memberId: string;
  memberName: string;
  date: string;
  time: string;
  status: "scheduled" | "completed" | "cancelled";
  remainingSessions: number;
}

interface Member {
  id: string;
  name: string;
  remainingSessions: number;
}

type ViewMode = "day" | "week" | "month";

export function CoachScheduleTab({ accessToken, supabaseUrl, publicAnonKey, coachId, coachName }: CoachScheduleTabProps) {
  const [ptRequests, setPtRequests] = useState<PTRequest[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<PTRequest | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  
  // 회원 추가 다이얼로그
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState<{date: string, time: string} | null>(null);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [availableMembers, setAvailableMembers] = useState<Member[]>([]);

  useEffect(() => {
    loadPTRequests();
    loadSchedules();
    loadAvailableMembers();
  }, []);

  const loadPTRequests = () => {
    // 데모 데이터
    setPtRequests([
      {
        id: "1",
        memberId: "m1",
        memberName: "김회원",
        requestedDate: "2025-02-20",
        requestedTime: "10:00",
        status: "pending",
        createdAt: "2025-02-15T09:00:00",
        remainingSessions: 10,
      },
      {
        id: "2",
        memberId: "m2",
        memberName: "이회원",
        requestedDate: "2025-02-21",
        requestedTime: "14:00",
        status: "pending",
        createdAt: "2025-02-15T10:30:00",
        remainingSessions: 8,
      },
      {
        id: "3",
        memberId: "m3",
        memberName: "박회원",
        requestedDate: "2025-02-22",
        requestedTime: "16:00",
        status: "pending",
        createdAt: "2025-02-15T11:00:00",
        remainingSessions: 12,
      },
    ]);
  };

  const loadSchedules = () => {
    // 데모 데이터
    setSchedules([
      {
        id: "s1",
        memberId: "m1",
        memberName: "김회원",
        date: "2025-02-18",
        time: "10:00",
        status: "scheduled",
        remainingSessions: 10,
      },
      {
        id: "s2",
        memberId: "m2",
        memberName: "이회원",
        date: "2025-02-19",
        time: "14:00",
        status: "scheduled",
        remainingSessions: 8,
      },
      {
        id: "s3",
        memberId: "m4",
        memberName: "최회원",
        date: "2025-02-17",
        time: "16:00",
        status: "completed",
        remainingSessions: 5,
      },
    ]);
  };

  const loadAvailableMembers = () => {
    // 데모 데이터 - 실제로는 서버에서 로드
    setAvailableMembers([
      { id: "m1", name: "김회원", remainingSessions: 10 },
      { id: "m2", name: "이회원", remainingSessions: 8 },
      { id: "m3", name: "박회원", remainingSessions: 12 },
      { id: "m4", name: "최회원", remainingSessions: 5 },
      { id: "m5", name: "정회원", remainingSessions: 15 },
      { id: "m6", name: "강회원", remainingSessions: 20 },
    ]);
  };

  const handleAddMemberClick = (date: string, time: string) => {
    setSelectedDateTime({ date, time });
    setMemberSearchQuery("");
    setIsAddMemberDialogOpen(true);
  };

  const handleAddMemberToSchedule = (member: Member) => {
    if (!selectedDateTime) return;

    const newSchedule: Schedule = {
      id: `s-${Date.now()}`,
      memberId: member.id,
      memberName: member.name,
      date: selectedDateTime.date,
      time: selectedDateTime.time,
      status: "scheduled",
      remainingSessions: member.remainingSessions,
    };

    setSchedules([...schedules, newSchedule]);
    setIsAddMemberDialogOpen(false);
    toast.success(`${member.name}님의 PT가 ${selectedDateTime.date} ${selectedDateTime.time}에 예약되었습니다`);
  };

  const filteredMembers = availableMembers.filter(member =>
    member.name.toLowerCase().includes(memberSearchQuery.toLowerCase())
  );

  const handleApproveRequest = async (request: PTRequest) => {
    // 예약 승인 처리
    const newSchedule: Schedule = {
      id: `s-${Date.now()}`,
      memberId: request.memberId,
      memberName: request.memberName,
      date: request.requestedDate,
      time: request.requestedTime,
      status: "scheduled",
      remainingSessions: request.remainingSessions,
    };

    setSchedules([...schedules, newSchedule]);
    setPtRequests(ptRequests.filter((r) => r.id !== request.id));
    
    toast.success(
      <div>
        <p className="font-semibold">PT 예약이 승인되었습니다</p>
        <p className="text-sm">{request.memberName}님에게 알림이 전송되었습니다</p>
      </div>
    );
    setIsDetailDialogOpen(false);
  };

  const handleRejectRequest = async (requestId: string) => {
    setPtRequests(ptRequests.filter((r) => r.id !== requestId));
    toast.info("PT 예약이 거절되었습니다");
    setIsDetailDialogOpen(false);
  };

  const handleCompleteSession = async (scheduleId: string) => {
    // 수업 완료 처리
    const schedule = schedules.find((s) => s.id === scheduleId);
    if (!schedule) return;

    // PT 잔여수 차감
    const updatedSchedules = schedules.map((s) =>
      s.id === scheduleId
        ? { ...s, status: "completed" as const, remainingSessions: s.remainingSessions - 1 }
        : s
    );

    setSchedules(updatedSchedules);
    toast.success(
      <div>
        <p className="font-semibold">수업이 완료되었습니다</p>
        <p className="text-sm">회원의 잔여 세션이 1회 차감되었습니다</p>
      </div>
    );
  };

  const pendingRequests = ptRequests.filter((r) => r.status === "pending");
  const upcomingSchedules = schedules.filter((s) => s.status === "scheduled");
  const completedSchedules = schedules.filter((s) => s.status === "completed");

  // 달력 관련 함수
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const getSchedulesForDate = (date: Date) => {
    const dateStr = formatDate(date);
    return schedules.filter((s) => s.date === dateStr);
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const previousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const nextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const previousDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const nextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const getWeekDays = (date: Date) => {
    const dayOfWeek = date.getDay();
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - dayOfWeek);

    const week = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      week.push(day);
    }
    return week;
  };

  const days = getDaysInMonth(currentDate);
  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];
  const week = getWeekDays(currentDate);

  const timeOptions = [];
  for (let hour = 6; hour <= 22; hour++) {
    for (let min = 0; min < 60; min += 30) {
      const time = `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
      timeOptions.push(time);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">스케줄 관리</h2>
        <p className="text-gray-500 mt-1">PT 예약 요청을 확인하고 일정을 관리하세요</p>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>대기 중인 예약 요청</CardDescription>
            <CardTitle className="text-3xl text-orange-600">{pendingRequests.length}건</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>예정된 수업</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{upcomingSchedules.length}회</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>완료된 수업</CardDescription>
            <CardTitle className="text-3xl text-green-600">{completedSchedules.length}회</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* PT 예약 요청 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>PT 예약 요청</CardTitle>
              <CardDescription>회원이 요청한 PT 예약을 확인하고 승인하세요</CardDescription>
            </div>
            {pendingRequests.length > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <Bell className="w-3 h-3" />
                {pendingRequests.length}건 대기 중
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {pendingRequests.length > 0 ? (
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-orange-50 border-orange-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="font-semibold">{request.memberName}</span>
                      <Badge variant="outline" className="text-xs">
                        잔여 {request.remainingSessions}회
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {request.requestedDate}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {request.requestedTime}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={() => {
                        setSelectedRequest(request);
                        setIsDetailDialogOpen(true);
                      }}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      승인
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleRejectRequest(request.id)}
                    >
                      <X className="w-4 h-4 mr-1" />
                      거절
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>대기 중인 예약 요청이 없습니다</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 달력 뷰 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {viewMode === "day" && currentDate.toLocaleDateString("ko-KR", { 
                  year: "numeric", 
                  month: "long", 
                  day: "numeric",
                  weekday: "long"
                })}
                {viewMode === "week" && `${week[0].toLocaleDateString("ko-KR", { month: "long", day: "numeric" })} ~ ${week[6].toLocaleDateString("ko-KR", { month: "long", day: "numeric" })}`}
                {viewMode === "month" && `${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월`}
              </CardTitle>
              
              {/* 뷰 모드 선택 */}
              <div className="flex gap-1 border rounded-md p-1">
                <Button
                  variant={viewMode === "day" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("day")}
                  className="gap-1"
                >
                  <CalendarDays className="w-4 h-4" />
                  일별
                </Button>
                <Button
                  variant={viewMode === "week" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("week")}
                  className="gap-1"
                >
                  <CalendarRange className="w-4 h-4" />
                  주별
                </Button>
                <Button
                  variant={viewMode === "month" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("month")}
                  className="gap-1"
                >
                  <Calendar className="w-4 h-4" />
                  월별
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  if (viewMode === "day") previousDay();
                  else if (viewMode === "week") previousWeek();
                  else previousMonth();
                }}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
              >
                오늘
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  if (viewMode === "day") nextDay();
                  else if (viewMode === "week") nextWeek();
                  else nextMonth();
                }}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* 일별 뷰 */}
          {viewMode === "day" && (
            <div className="space-y-2">
              <div className="grid grid-cols-[80px_1fr] gap-4">
                {timeOptions.map((time) => {
                  const schedulesAtTime = schedules.filter(
                    (s) => s.date === formatDate(currentDate) && s.time === time
                  );
                  
                  return (
                    <div key={time} className="contents">
                      <div className="text-sm text-gray-500 py-2">{time}</div>
                      <div 
                        className="min-h-[50px] border rounded-md p-2 cursor-pointer hover:bg-blue-50 transition-colors"
                        onClick={() => {
                          if (schedulesAtTime.length === 0) {
                            handleAddMemberClick(formatDate(currentDate), time);
                          }
                        }}
                      >
                        {schedulesAtTime.length === 0 && (
                          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                            <Plus className="w-4 h-4 mr-1" />
                            회원 추가
                          </div>
                        )}
                        {schedulesAtTime.map((schedule) => (
                          <div
                            key={schedule.id}
                            className={`p-2 rounded mb-2 ${
                              schedule.status === "scheduled" 
                                ? "bg-blue-50 border-l-4 border-blue-500" 
                                : "bg-green-50 border-l-4 border-green-500"
                            }`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-semibold text-gray-900">
                                  {schedule.memberName}
                                </div>
                                <div className="text-xs text-gray-600 flex items-center gap-2">
                                  <span>잔여 {schedule.remainingSessions}회</span>
                                  <Badge variant="outline" className="text-[10px] px-1 py-0">
                                    {schedule.status === "scheduled" ? "예정" : "완료"}
                                  </Badge>
                                </div>
                              </div>
                              {schedule.status === "scheduled" && (
                                <Button
                                  size="sm"
                                  onClick={() => handleCompleteSession(schedule.id)}
                                >
                                  <Check className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 주별 뷰 */}
          {viewMode === "week" && (
            <div className="space-y-2">
              {/* 요일 헤더 */}
              <div className="grid grid-cols-8 gap-2">
                <div className="text-sm text-gray-500 py-2">시간</div>
                {week.map((day, index) => (
                  <div
                    key={day.toISOString()}
                    className={`text-center font-semibold text-sm py-2 ${
                      index === 0 ? "text-red-600" : index === 6 ? "text-blue-600" : "text-gray-700"
                    }`}
                  >
                    <div>{weekDays[index]}</div>
                    <div className="text-xs text-gray-500">{day.getDate()}</div>
                  </div>
                ))}
              </div>
              
              {/* 시간별 그리드 */}
              <div className="grid grid-cols-8 gap-2">
                {timeOptions.map((time) => (
                  <div key={time} className="contents">
                    <div className="text-xs text-gray-500 py-1">{time}</div>
                    {week.map((day) => {
                      const schedulesAtTime = schedules.filter(
                        (s) => s.date === formatDate(day) && s.time === time
                      );
                      
                      return (
                        <div
                          key={`${formatDate(day)}-${time}`}
                          className="min-h-[40px] border rounded p-1 text-xs cursor-pointer hover:bg-blue-50 transition-colors"
                          onClick={() => {
                            if (schedulesAtTime.length === 0) {
                              handleAddMemberClick(formatDate(day), time);
                            }
                          }}
                        >
                          {schedulesAtTime.length === 0 && (
                            <div className="flex items-center justify-center h-full text-gray-400 text-[10px]">
                              <Plus className="w-3 h-3" />
                            </div>
                          )}
                          {schedulesAtTime.map((schedule) => (
                            <div
                              key={schedule.id}
                              className={`p-1 rounded mb-1 ${
                                schedule.status === "scheduled" 
                                  ? "bg-blue-100" 
                                  : "bg-green-100"
                              }`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="font-semibold truncate text-[10px]">
                                {schedule.memberName}
                              </div>
                              <div className="text-[9px] text-gray-600">
                                {schedule.remainingSessions}회
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 월별 뷰 */}
          {viewMode === "month" && (
            <>
              {/* 요일 헤더 */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {weekDays.map((day, index) => (
                  <div
                    key={day}
                    className={`text-center font-semibold text-sm py-2 ${
                      index === 0 ? "text-red-600" : index === 6 ? "text-blue-600" : "text-gray-700"
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* 날짜 그리드 */}
              <div className="grid grid-cols-7 gap-2">
                {days.map((day, index) => {
                  if (!day) {
                    return <div key={`empty-${index}`} className="aspect-square" />;
                  }

                  const dateStr = formatDate(day);
                  const schedulesForDay = getSchedulesForDate(day);
                  const isToday = formatDate(new Date()) === dateStr;

                  return (
                    <div
                      key={dateStr}
                      className={`aspect-square border rounded-lg p-2 transition-all ${
                        isToday ? "border-blue-500 bg-blue-50" : "border-gray-200"
                      }`}
                    >
                      <div
                        className={`text-sm font-semibold mb-1 ${
                          day.getDay() === 0
                            ? "text-red-600"
                            : day.getDay() === 6
                            ? "text-blue-600"
                            : "text-gray-700"
                        }`}
                      >
                        {day.getDate()}
                      </div>
                      <div className="space-y-1 overflow-y-auto max-h-20">
                        {schedulesForDay.map((schedule) => (
                          <div
                            key={schedule.id}
                            className={`text-xs p-1 rounded ${
                              schedule.status === "scheduled" 
                                ? "bg-blue-100 text-blue-800" 
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            <div className="font-semibold truncate">{schedule.memberName}</div>
                            <div className="flex items-center justify-between text-[10px]">
                              <span>{schedule.time}</span>
                              <span>{schedule.remainingSessions}회</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 승인 확인 다이얼로그 */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>PT 예약 승인</DialogTitle>
            <DialogDescription>
              예약을 승인하시겠습니까? 회원에게 알림이 전송됩니다.
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">회원:</span>
                  <span className="font-semibold">{selectedRequest.memberName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">날짜:</span>
                  <span className="font-semibold">{selectedRequest.requestedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">시간:</span>
                  <span className="font-semibold">{selectedRequest.requestedTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">잔여 세션:</span>
                  <span className="font-semibold">{selectedRequest.remainingSessions}회</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => handleApproveRequest(selectedRequest)}
                >
                  <Check className="w-4 h-4 mr-2" />
                  승인
                </Button>
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={() => setIsDetailDialogOpen(false)}
                >
                  취소
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 회원 추가 다이얼로그 */}
      <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>회원 추가</DialogTitle>
            <DialogDescription>
              PT 예약을 추가할 회원을 선택하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="memberSearch">회원 검색:</Label>
              <Input
                id="memberSearch"
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                placeholder="회원 이름을 입력하세요"
              />
            </div>
            <div className="space-y-2">
              {filteredMembers.map(member => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-2 border rounded-lg bg-gray-50 border-gray-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="font-semibold">{member.name}</span>
                      <Badge variant="outline" className="text-xs">
                        잔여 {member.remainingSessions}회
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={() => handleAddMemberToSchedule(member)}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      추가
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}