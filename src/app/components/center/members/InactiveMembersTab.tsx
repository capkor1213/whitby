import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Search, RefreshCw, Trash2 } from "lucide-react";

interface InactiveMembersTabProps {
  accessToken: string;
  supabaseUrl: string;
  publicAnonKey: string;
}

export function InactiveMembersTab({ accessToken, supabaseUrl, publicAnonKey }: InactiveMembersTabProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const mockInactiveMembers = [
    { 
      id: 1, 
      name: "홍길동", 
      phone: "010-9876-5432", 
      membership: "3개월권", 
      startDate: "2025-09-01", 
      endDate: "2025-12-01",
      expiredDays: 70,
      status: "만료" 
    },
    { 
      id: 2, 
      name: "강감찬", 
      phone: "010-8765-4321", 
      membership: "6개월권", 
      startDate: "2025-06-15", 
      endDate: "2025-12-15",
      expiredDays: 56,
      status: "만료" 
    },
    { 
      id: 3, 
      name: "세종대왕", 
      phone: "010-7654-3210", 
      membership: "1개월권", 
      startDate: "2025-12-10", 
      endDate: "2026-01-10",
      expiredDays: 30,
      status: "만료" 
    },
    { 
      id: 4, 
      name: "이순신", 
      phone: "010-6543-2109", 
      membership: "3개월권", 
      startDate: "2025-08-20", 
      endDate: "2025-11-20",
      expiredDays: 81,
      status: "만료" 
    },
  ];

  const filteredMembers = mockInactiveMembers.filter(member => 
    member.name.includes(searchQuery) || member.phone.includes(searchQuery)
  );

  return (
    <div className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">종료 회원 목록</h3>
        <p className="text-sm text-gray-500 mt-1">회원권이 만료된 회원 {mockInactiveMembers.length}명</p>
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
                  <th className="text-left py-3 px-4 font-medium text-gray-700">회원권</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">시작일</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">종료일</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">만료 기간</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">상태</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">관리</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{member.name}</td>
                    <td className="py-3 px-4 text-gray-600">{member.phone}</td>
                    <td className="py-3 px-4 text-gray-600">{member.membership}</td>
                    <td className="py-3 px-4 text-gray-600">{member.startDate}</td>
                    <td className="py-3 px-4 text-gray-600">{member.endDate}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {member.expiredDays}일 전
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {member.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="gap-1 text-green-600 hover:text-green-700">
                          <RefreshCw className="w-3 h-3" />
                          재등록
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1 text-red-600 hover:text-red-700">
                          <Trash2 className="w-3 h-3" />
                          삭제
                        </Button>
                      </div>
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
