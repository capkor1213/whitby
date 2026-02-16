import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Calendar, ChevronLeft, ChevronRight, Plus, Users, Clock, X, CalendarDays, CalendarRange, Search, UserPlus, Trash2, Ban, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Label } from "@/app/components/ui/label";
import { toast } from "sonner";

interface CenterGXScheduleTabProps {
  accessToken: string;
  supabaseUrl: string;
  publicAnonKey: string;
}

interface GXClass {
  id: string;
  name: string;
  maxCapacity: number;
  duration: number;
  color: string;
}

interface ScheduledClass {
  id: string;
  classId: string;
  className: string;
  date: string;
  time: string;
  maxCapacity: number;
  currentBookings: number;
  color: string;
  status: "scheduled" | "cancelled";
}

interface Member {
  id: string;
  name: string;
  phone: string;
  membershipType: string;
  remainingSessions?: number;
  expiryDate?: string;
}

interface ClassBooking {
  id: string;
  scheduledClassId: string;
  memberId: string;
  memberName: string;
  memberPhone: string;
  bookedAt: string;
}

type ViewMode = "day" | "week" | "month";

export function CenterGXScheduleTab({ accessToken, supabaseUrl, publicAnonKey }: CenterGXScheduleTabProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isAddScheduleOpen, setIsAddScheduleOpen] = useState(false);
  const [gxClasses, setGxClasses] = useState<GXClass[]>([]);
  const [scheduledClasses, setScheduledClasses] = useState<ScheduledClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedTime, setSelectedTime] = useState("10:00");
  
  // 예약자 명단 관련
  const [selectedScheduledClass, setSelectedScheduledClass] = useState<ScheduledClass | null>(null);
  const [isBookingListOpen, setIsBookingListOpen] = useState(false);
  const [classBookings, setClassBookings] = useState<ClassBooking[]>([]);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [availableMembers, setAvailableMembers] = useState<Member[]>([]);

  useEffect(() => {
    loadGXClasses();
    loadScheduledClasses();
    loadAvailableMembers();
    loadClassBookings();
  }, []);

  const loadGXClasses = () => {
    // 데모 데이터
    setGxClasses([
      { id: "1", name: "요가", maxCapacity: 15, duration: 60, color: "#10B981" },
      { id: "2", name: "필라테스", maxCapacity: 12, duration: 60, color: "#8B5CF6" },
      { id: "3", name: "스피닝", maxCapacity: 20, duration: 45, color: "#EF4444" },
      { id: "4", name: "줌바", maxCapacity: 25, duration: 50, color: "#F59E0B" },
    ]);
  };

  const loadScheduledClasses = () => {
    // 데모 데이터
    setScheduledClasses([
      {
        id: "s1",
        classId: "1",
        className: "요가",
        date: "2025-02-17",
        time: "10:00",
        maxCapacity: 15,
        currentBookings: 12,
        color: "#10B981",
        status: "scheduled",
      },
      {
        id: "s2",
        classId: "2",
        className: "필라테스",
        date: "2025-02-17",
        time: "14:00",
        maxCapacity: 12,
        currentBookings: 8,
        color: "#8B5CF6",
        status: "scheduled",
      },
      {
        id: "s3",
        classId: "3",
        className: "스피닝",
        date: "2025-02-18",
        time: "09:00",
        maxCapacity: 20,
        currentBookings: 18,
        color: "#EF4444",
        status: "scheduled",
      },
      {
        id: "s4",
        classId: "1",
        className: "요가",
        date: "2025-02-18",
        time: "11:00",
        maxCapacity: 15,
        currentBookings: 10,
        color: "#10B981",
        status: "scheduled",
      },
      {
        id: "s5",
        classId: "4",
        className: "줌바",
        date: "2025-02-19",
        time: "18:00",
        maxCapacity: 25,
        currentBookings: 22,
        color: "#F59E0B",
        status: "scheduled",
      },
    ]);
  };

  const loadAvailableMembers = () => {
    // 데모 데이터
    setAvailableMembers([
      { id: "m1", name: "김회원", phone: "010-1234-5678", membershipType: "무제한권", expiryDate: "2026-03-15" },
      { id: "m2", name: "이회원", phone: "010-2345-6789", membershipType: "횟수권", remainingSessions: 8 },
      { id: "m3", name: "박회원", phone: "010-3456-7890", membershipType: "기간권", expiryDate: "2026-04-20" },
      { id: "m4", name: "최회원", phone: "010-4567-8901", membershipType: "무제한권", expiryDate: "2026-02-28" },
      { id: "m5", name: "정회원", phone: "010-5678-9012", membershipType: "횟수권", remainingSessions: 15 },
      { id: "m6", name: "강회원", phone: "010-6789-0123", membershipType: "기간권", expiryDate: "2026-05-10" },
    ]);
  };

  const loadClassBookings = () => {
    // 데모 데이터
    setClassBookings([
      { id: "b1", scheduledClassId: "s1", memberId: "m1", memberName: "김회원", memberPhone: "010-1234-5678", bookedAt: "2025-02-10T10:00:00" },
      { id: "b2", scheduledClassId: "s1", memberId: "m2", memberName: "이회원", memberPhone: "010-2345-6789", bookedAt: "2025-02-10T11:30:00" },
      { id: "b3", scheduledClassId: "s1", memberId: "m3", memberName: "박회원", memberPhone: "010-3456-7890", bookedAt: "2025-02-11T09:15:00" },
      { id: "b4", scheduledClassId: "s2", memberId: "m4", memberName: "최회원", memberPhone: "010-4567-8901", bookedAt: "2025-02-10T14:20:00" },
      { id: "b5", scheduledClassId: "s2", memberId: "m5", memberName: "정회원", memberPhone: "010-5678-9012", bookedAt: "2025-02-11T16:00:00" },
    ]);
  };

  const handleViewBookings = (scheduledClass: ScheduledClass) => {
    setSelectedScheduledClass(scheduledClass);
    setIsBookingListOpen(true);
    setMemberSearchQuery("");
  };

  const handleAddMemberToClass = (member: Member) => {
    if (!selectedScheduledClass) return;

    // 이미 예약되어 있는지 확인
    const alreadyBooked = classBookings.some(
      b => b.scheduledClassId === selectedScheduledClass.id && b.memberId === member.id
    );

    if (alreadyBooked) {
      toast.error("이미 예약된 회원입니다.");
      return;
    }

    // 정원 확인
    if (selectedScheduledClass.currentBookings >= selectedScheduledClass.maxCapacity) {
      toast.error("클래스가 만석입니다.");
      return;
    }

    const newBooking: ClassBooking = {
      id: `b-${Date.now()}`,
      scheduledClassId: selectedScheduledClass.id,
      memberId: member.id,
      memberName: member.name,
      memberPhone: member.phone,
      bookedAt: new Date().toISOString(),
    };

    setClassBookings([...classBookings, newBooking]);
    
    // 예약 인원 업데이트
    setScheduledClasses(scheduledClasses.map(sc =>
      sc.id === selectedScheduledClass.id
        ? { ...sc, currentBookings: sc.currentBookings + 1 }
        : sc
    ));

    setIsAddMemberOpen(false);
    toast.success(`${member.name}님이 ${selectedScheduledClass.className} 클래스에 예약되었습니다.`);
  };

  const handleRemoveBooking = (bookingId: string) => {
    const booking = classBookings.find(b => b.id === bookingId);
    if (!booking) return;

    setClassBookings(classBookings.filter(b => b.id !== bookingId));
    
    // 예약 인원 업데이트
    setScheduledClasses(scheduledClasses.map(sc =>
      sc.id === booking.scheduledClassId
        ? { ...sc, currentBookings: Math.max(0, sc.currentBookings - 1) }
        : sc
    ));

    toast.info(`${booking.memberName}님의 예약이 취소되었습니다.`);
  };

  const getBookingsForClass = (scheduledClassId: string) => {
    return classBookings.filter(b => b.scheduledClassId === scheduledClassId);
  };

  const filteredMembers = availableMembers.filter(member =>
    member.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
    member.phone.includes(memberSearchQuery)
  );

  const handleAddSchedule = () => {
    if (!selectedDate || !selectedClassId) {
      toast.error("날짜와 클래스를 선택해주세요.");
      return;
    }

    const selectedClass = gxClasses.find((c) => c.id === selectedClassId);
    if (!selectedClass) return;

    const newSchedule: ScheduledClass = {
      id: `s-${Date.now()}`,
      classId: selectedClassId,
      className: selectedClass.name,
      date: selectedDate,
      time: selectedTime,
      maxCapacity: selectedClass.maxCapacity,
      currentBookings: 0,
      color: selectedClass.color,
      status: "scheduled",
    };

    setScheduledClasses([...scheduledClasses, newSchedule]);
    setIsAddScheduleOpen(false);
    setSelectedClassId("");
    toast.success("스케줄이 추가되었습니다.");
  };

  const handleDeleteSchedule = (id: string) => {
    setScheduledClasses(scheduledClasses.filter((s) => s.id !== id));
    toast.success("스케줄이 삭제되었습니다.");
  };

  const handleCancelClass = (id: string) => {
    const scheduledClass = scheduledClasses.find(s => s.id === id);
    if (!scheduledClass) return;

    const bookings = getBookingsForClass(id);
    
    setScheduledClasses(scheduledClasses.map(sc =>
      sc.id === id
        ? { ...sc, status: "cancelled" }
        : sc
    ));
    
    toast.success(
      <div>
        <p className="font-semibold">{scheduledClass.className} 클래스가 폐강되었습니다</p>
        <p className="text-sm">예약자 {bookings.length}명의 명단이 유지되며, 횟수권 회원의 횟수는 차감되지 않습니다</p>
      </div>
    );
  };

  const handleReopenClass = (id: string) => {
    const scheduledClass = scheduledClasses.find(s => s.id === id);
    if (!scheduledClass) return;
    
    setScheduledClasses(scheduledClasses.map(sc =>
      sc.id === id
        ? { ...sc, status: "scheduled" }
        : sc
    ));
    
    toast.success(`${scheduledClass.className} 클래스가 재개강되었습니다`);
  };

  // 달력 생성
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    // 이전 달 빈 칸
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // 현재 달
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const getClassesForDate = (date: Date) => {
    const dateStr = formatDate(date);
    return scheduledClasses.filter((s) => s.date === dateStr);
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

  // 주간 뷰를 위한 날짜 배열
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

  // 시간 옵션
  const timeOptions = [];
  for (let hour = 6; hour <= 22; hour++) {
    for (let min = 0; min < 60; min += 30) {
      const time = `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
      timeOptions.push(time);
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">GX 스케줄 관리</h1>
          <p className="text-gray-500 mt-1">그룹 운동 클래스 일정을 관리합니다</p>
        </div>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>이번 달 총 클래스</CardDescription>
            <CardTitle className="text-3xl">{scheduledClasses.length}개</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>총 예약 인원</CardDescription>
            <CardTitle className="text-3xl">
              {scheduledClasses.reduce((sum, s) => sum + s.currentBookings, 0)}명
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>평균 예약률</CardDescription>
            <CardTitle className="text-3xl">
              {scheduledClasses.length > 0
                ? Math.round(
                    (scheduledClasses.reduce((sum, s) => sum + s.currentBookings, 0) /
                      scheduledClasses.reduce((sum, s) => sum + s.maxCapacity, 0)) *
                      100
                  )
                : 0}
              %
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>만석 클래스</CardDescription>
            <CardTitle className="text-3xl text-red-600">
              {scheduledClasses.filter((s) => s.currentBookings >= s.maxCapacity).length}개
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* 달력 */}
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
                  const classesAtTime = scheduledClasses.filter(
                    (s) => s.date === formatDate(currentDate) && s.time === time
                  );
                  
                  return (
                    <div key={time} className="contents">
                      <div className="text-sm text-gray-500 py-2">{time}</div>
                      <div 
                        className="min-h-[50px] border rounded-md p-2 cursor-pointer hover:bg-gray-50"
                        onClick={() => {
                          setSelectedDate(formatDate(currentDate));
                          setSelectedTime(time);
                          setIsAddScheduleOpen(true);
                        }}
                      >
                        {classesAtTime.map((scheduledClass) => (
                          <div
                            key={scheduledClass.id}
                            className="p-2 rounded mb-2 relative group cursor-pointer"
                            style={{ backgroundColor: scheduledClass.color + "20", borderLeft: `4px solid ${scheduledClass.color}` }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewBookings(scheduledClass);
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-semibold" style={{ color: scheduledClass.color }}>
                                  {scheduledClass.className}
                                </div>
                                <div className="text-xs text-gray-600 flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {scheduledClass.currentBookings}/{scheduledClass.maxCapacity}명
                                </div>
                              </div>
                              <button
                                className="p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSchedule(scheduledClass.id);
                                }}
                              >
                                <X className="w-3 h-3" />
                              </button>
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
                      const classesAtTime = scheduledClasses.filter(
                        (s) => s.date === formatDate(day) && s.time === time
                      );
                      
                      return (
                        <div
                          key={`${formatDate(day)}-${time}`}
                          className="min-h-[40px] border rounded p-1 cursor-pointer hover:bg-gray-50 text-xs"
                          onClick={() => {
                            setSelectedDate(formatDate(day));
                            setSelectedTime(time);
                            setIsAddScheduleOpen(true);
                          }}
                        >
                          {classesAtTime.map((scheduledClass) => (
                            <div
                              key={scheduledClass.id}
                              className="p-1 rounded mb-1 relative group cursor-pointer"
                              style={{ backgroundColor: scheduledClass.color + "20" }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewBookings(scheduledClass);
                              }}
                            >
                              <div className="font-semibold truncate text-[10px]" style={{ color: scheduledClass.color }}>
                                {scheduledClass.className}
                              </div>
                              <div className="text-[9px] text-gray-600 flex items-center gap-0.5">
                                <Users className="w-2 h-2" />
                                {scheduledClass.currentBookings}/{scheduledClass.maxCapacity}
                              </div>
                              <button
                                className="absolute top-0 right-0 p-0.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSchedule(scheduledClass.id);
                                }}
                              >
                                <X className="w-2 h-2" />
                              </button>
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
                  const classesForDay = getClassesForDate(day);
                  const isToday = formatDate(new Date()) === dateStr;

                  return (
                    <div
                      key={dateStr}
                      className={`aspect-square border rounded-lg p-2 cursor-pointer transition-all hover:shadow-md ${
                        isToday ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"
                      }`}
                      onClick={() => {
                        setSelectedDate(dateStr);
                        setIsAddScheduleOpen(true);
                      }}
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
                        {classesForDay.map((scheduledClass) => (
                          <div
                            key={scheduledClass.id}
                            className="text-xs p-1 rounded cursor-pointer hover:opacity-80 relative group"
                            style={{ backgroundColor: scheduledClass.color + "20", color: scheduledClass.color }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewBookings(scheduledClass);
                            }}
                          >
                            <div className="font-semibold truncate">{scheduledClass.className}</div>
                            <div className="flex items-center justify-between text-[10px]">
                              <span>{scheduledClass.time}</span>
                              <div className="flex items-center gap-0.5">
                                <Users className="w-2 h-2" />
                                <span>{scheduledClass.currentBookings}/{scheduledClass.maxCapacity}</span>
                              </div>
                            </div>
                            <button
                              className="absolute top-0 right-0 p-0.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSchedule(scheduledClass.id);
                              }}
                            >
                              <X className="w-3 h-3" />
                            </button>
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

      {/* 스케줄 추가 다이얼로그 */}
      <Dialog open={isAddScheduleOpen} onOpenChange={setIsAddScheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>스케줄 추가</DialogTitle>
            <DialogDescription>
              {selectedDate && new Date(selectedDate).toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "long",
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>클래스 선택</Label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">클래스를 선택하세요</option>
                {gxClasses.map((gxClass) => (
                  <option key={gxClass.id} value={gxClass.id}>
                    {gxClass.name} (최대 {gxClass.maxCapacity}명, {gxClass.duration}분)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>시간</Label>
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                {timeOptions.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddSchedule} className="flex-1">
                <Plus className="w-4 h-4 mr-2" />
                추가하기
              </Button>
              <Button variant="outline" onClick={() => setIsAddScheduleOpen(false)} className="flex-1">
                취소
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 예약자 명단 다이얼로그 */}
      <Dialog open={isBookingListOpen} onOpenChange={setIsBookingListOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  예약자 명단
                  {selectedScheduledClass?.status === "cancelled" && (
                    <Badge variant="destructive" className="gap-1">
                      <Ban className="w-3 h-3" />
                      폐강됨
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription>
                  {selectedScheduledClass && `${selectedScheduledClass.className} (${selectedScheduledClass.date} ${selectedScheduledClass.time})`}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          {selectedScheduledClass?.status === "cancelled" && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Ban className="w-5 h-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-red-900">이 클래스는 폐강되었습니다</p>
                  <p className="text-sm text-red-700 mt-1">
                    예약자 명단은 유지되며, 횟수권 회원의 횟수는 차감되지 않습니다. 
                    재개강 시 기존 예약이 그대로 복구됩니다.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            {/* 현재 예약자 명단 */}
            <div>
              <Label className="text-base font-semibold">예약자 명단 ({selectedScheduledClass && getBookingsForClass(selectedScheduledClass.id).length}명)</Label>
              <div className="space-y-2 mt-3">
                {selectedScheduledClass && getBookingsForClass(selectedScheduledClass.id).length > 0 ? (
                  getBookingsForClass(selectedScheduledClass.id).map(booking => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: selectedScheduledClass?.color }}
                        />
                        <div>
                          <div className="font-semibold">{booking.memberName}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-2">
                            <Users className="w-3 h-3" />
                            {booking.memberPhone}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveBooking(booking.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-500 border rounded-md bg-gray-50">
                    <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p>예약된 회원이 없습니다</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="border-t pt-4">
              <Label className="text-base font-semibold">회원 검색 & 추가</Label>
              <Input
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                placeholder="이름 또는 전화번호 입력"
                className="w-full px-3 py-2 border rounded-md mt-3"
              />
              <div className="space-y-2 mt-3 max-h-48 overflow-y-auto">
                {filteredMembers.map(member => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-2 border rounded-md cursor-pointer hover:bg-gray-50"
                    onClick={() => handleAddMemberToClass(member)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: selectedScheduledClass?.color }}
                      />
                      <div>
                        <div className="font-semibold">{member.name}</div>
                        <div className="text-sm text-gray-500">{member.phone}</div>
                      </div>
                    </div>
                    <Badge variant={member.membershipType === "무제한권" ? "default" : member.membershipType === "기간권" ? "secondary" : "outline"}>
                      {member.membershipType}
                      {member.expiryDate && ` (${new Date(member.expiryDate).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })})`}
                      {member.remainingSessions && ` (${member.remainingSessions}회)`}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex gap-2 pt-4 border-t">
              {selectedScheduledClass?.status === "scheduled" ? (
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleCancelClass(selectedScheduledClass.id);
                    setSelectedScheduledClass({...selectedScheduledClass, status: "cancelled"});
                  }}
                  className="flex-1 gap-2"
                >
                  <Ban className="w-4 h-4" />
                  클래스 폐강
                </Button>
              ) : (
                <Button
                  variant="default"
                  onClick={() => {
                    if (selectedScheduledClass) {
                      handleReopenClass(selectedScheduledClass.id);
                      setSelectedScheduledClass({...selectedScheduledClass, status: "scheduled"});
                    }
                  }}
                  className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                >
                  <RefreshCw className="w-4 h-4" />
                  클래스 재개강
                </Button>
              )}
              <Button variant="outline" onClick={() => setIsBookingListOpen(false)} className="flex-1">
                닫기
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 회원 추가 다이얼로그 */}
      <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>회원 추가</DialogTitle>
            <DialogDescription>
              {selectedScheduledClass && `${selectedScheduledClass.className} (${selectedScheduledClass.date} ${selectedScheduledClass.time})`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>회원 검색</Label>
              <Input
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                placeholder="이름 또는 전화번호 입력"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div className="space-y-2">
              {filteredMembers.map(member => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-2 border rounded-md cursor-pointer hover:bg-gray-50"
                  onClick={() => handleAddMemberToClass(member)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: selectedScheduledClass?.color }}
                    />
                    <div>
                      <div className="font-semibold">{member.name}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-2">
                        <Users className="w-3 h-3" />
                        {member.phone}
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant={
                      member.membershipType === "무제한권"
                        ? "success"
                        : member.membershipType === "기간권"
                        ? "warning"
                        : "default"
                    }
                  >
                    {member.membershipType}
                    {member.expiryDate && ` (만료일: ${new Date(member.expiryDate).toLocaleDateString("ko-KR")})`}
                    {member.remainingSessions && ` (남은 세션: ${member.remainingSessions})`}
                  </Badge>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setIsAddMemberOpen(false)} className="flex-1">
                닫기
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 오늘의 클래스 */}
      <Card>
        <CardHeader>
          <CardTitle>오늘의 클래스</CardTitle>
          <CardDescription>{new Date().toLocaleDateString("ko-KR")}</CardDescription>
        </CardHeader>
        <CardContent>
          {getClassesForDate(new Date()).length > 0 ? (
            <div className="space-y-3">
              {getClassesForDate(new Date())
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((scheduledClass) => (
                  <div
                    key={scheduledClass.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                    style={{ borderColor: scheduledClass.color }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: scheduledClass.color }}
                      />
                      <div>
                        <div className="font-semibold">{scheduledClass.className}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          {scheduledClass.time}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          scheduledClass.currentBookings >= scheduledClass.maxCapacity
                            ? "destructive"
                            : "default"
                        }
                      >
                        <Users className="w-3 h-3 mr-1" />
                        {scheduledClass.currentBookings}/{scheduledClass.maxCapacity}
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>오늘 예정된 클래스가 없습니다.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}