import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Key, Lock, Unlock } from "lucide-react";

interface CenterLockersTabProps {
  accessToken: string;
  supabaseUrl: string;
  publicAnonKey: string;
}

export function CenterLockersTab({ accessToken, supabaseUrl, publicAnonKey }: CenterLockersTabProps) {
  const lockers = Array.from({ length: 40 }, (_, i) => ({
    number: i + 1,
    status: i % 3 === 0 ? "사용중" : "비어있음",
    member: i % 3 === 0 ? `회원 ${Math.floor(i / 3) + 1}` : null,
    expiry: i % 3 === 0 ? "2026-03-15" : null,
  }));

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">락커 관리</h2>
        <p className="text-gray-500 mt-2">락커 사용 현황을 관리합니다</p>
      </div>

      <div className="mb-6 flex gap-4">
        <Card className="flex-1">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">전체 락커</p>
                <p className="text-2xl font-bold">40개</p>
              </div>
              <Key className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">사용중</p>
                <p className="text-2xl font-bold text-blue-600">14개</p>
              </div>
              <Lock className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">비어있음</p>
                <p className="text-2xl font-bold text-green-600">26개</p>
              </div>
              <Unlock className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>락커 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-3">
            {lockers.map((locker) => (
              <button
                key={locker.number}
                className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center p-2 transition-colors ${
                  locker.status === "사용중"
                    ? "border-blue-500 bg-blue-50 hover:bg-blue-100"
                    : "border-gray-200 bg-white hover:bg-gray-50"
                }`}
              >
                <div className="text-lg font-bold text-gray-900">{locker.number}</div>
                {locker.status === "사용중" && (
                  <Lock className="w-3 h-3 text-blue-600 mt-1" />
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
