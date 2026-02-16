import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Search, Calendar, CheckCircle } from "lucide-react";

interface AttendanceTabProps {
  accessToken: string;
  supabaseUrl: string;
  publicAnonKey: string;
}

export function AttendanceTab({ accessToken, supabaseUrl, publicAnonKey }: AttendanceTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("2026-02-09");

  const mockAttendance = [
    { 
      id: 1, 
      name: "김철수", 
      phone: "010-1234-5678", 
      checkInTime: "06:30",
      checkOutTime: "08:00",
      duration: "1시간 30분",
      status: "퇴실완료" 
    },
    { 
      id: 2, 
      name: "이영희", 
      phone: "010-2345-6789", 
      checkInTime: "07:15",
      checkOutTime: "08:45",
      duration: "1시간 30분",
      status: "퇴실완료" 
    },
    { 
      id: 3, 
      name: "박민수", 
      phone: "010-3456-7890", 
      checkInTime: "09:00",
      checkOutTime: "-",
      duration: "-",
      status: "운동중" 
    },
    { 
      id: 4, 
      name: "최지은", 
      phone: "010-4567-8901", 
      checkInTime: "10:20",
      checkOutTime: "12:00",
      duration: "1시간 40분",
      status: "퇴실완료" 
    },
    { 
      id: 5, 
      name: "정호영", 
      phone: "010-5678-9012", 
      checkInTime: "14:30",
      checkOutTime: "-",
      duration: "-",
      status: "운동중" 
    },
    { 
      id: 6, 
      name: "강민지", 
      phone: "010-6789-0123", 
      checkInTime: "17:00",
      checkOutTime: "18:20",
      duration: "1시간 20분",
      status: "퇴실완료" 
    },
    { 
      id: 7, 
      name: "윤서준", 
      phone: "010-7890-1234", 
      checkInTime: "18:45",
      checkOutTime: "-",
      duration: "-",
      status: "운동중" 
    },
  ];

  const filteredAttendance = mockAttendance.filter(record => 
    record.name.includes(searchQuery) || record.phone.includes(searchQuery)
  );

  const totalCheckIns = mockAttendance.length;
  const currentlyInside = mockAttendance.filter(a => a.status === "운동중").length;

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">출석부</h3>
          <p className="text-sm text-gray-500 mt-1">일일 회원 출입 기록</p>
        </div>
        <div className="flex items-center gap-4">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
          />
        </div>
      </div>

      {/* 오늘 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-3 px-4">
            <div className="text-xs font-medium text-gray-600">오늘 총 출석</div>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-2xl font-bold text-blue-600">{totalCheckIns}명</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-3 px-4">
            <div className="text-xs font-medium text-gray-600">현재 센터 내</div>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-2xl font-bold text-green-600">{currentlyInside}명</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-3 px-4">
            <div className="text-xs font-medium text-gray-600">퇴실 완료</div>
            <CheckCircle className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="text-2xl font-bold text-gray-600">{totalCheckIns - currentlyInside}명</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="회원 이름 또는 전화번호로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">이름</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">연락처</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">입실 시간</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">퇴실 시간</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">운동 시간</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">상태</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttendance.map((record) => (
                  <tr key={record.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{record.name}</td>
                    <td className="py-3 px-4 text-gray-600">{record.phone}</td>
                    <td className="py-3 px-4 text-gray-600">{record.checkInTime}</td>
                    <td className="py-3 px-4 text-gray-600">{record.checkOutTime}</td>
                    <td className="py-3 px-4 text-gray-600">{record.duration}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        record.status === "운동중" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
