import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Building2, Clock, MapPin, Phone, Save } from "lucide-react";

interface CenterSettingsTabProps {
  accessToken: string;
  supabaseUrl: string;
  publicAnonKey: string;
}

export function CenterSettingsTab({ accessToken, supabaseUrl, publicAnonKey }: CenterSettingsTabProps) {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">센터 설정</h2>
        <p className="text-gray-500 mt-2">센터 정보와 운영 설정을 관리합니다</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 기본 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              센터 기본 정보
            </CardTitle>
            <CardDescription>센터의 기본 정보를 설정합니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="center-name">센터명 *</Label>
              <Input
                id="center-name"
                defaultValue="피트니스 센터"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business-number">사업자 등록번호 *</Label>
              <Input
                id="business-number"
                defaultValue="123-45-67890"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="owner-name">센터장 이름 *</Label>
              <Input
                id="owner-name"
                defaultValue="홍길동"
              />
            </div>

            <Button className="w-full gap-2">
              <Save className="w-4 h-4" />
              저장
            </Button>
          </CardContent>
        </Card>

        {/* 연락처 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              연락처 정보
            </CardTitle>
            <CardDescription>센터의 연락처를 설정합니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">전화번호 *</Label>
              <Input
                id="phone"
                type="tel"
                defaultValue="02-1234-5678"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">이메일 *</Label>
              <Input
                id="email"
                type="email"
                defaultValue="center@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">웹사이트 (선택)</Label>
              <Input
                id="website"
                type="url"
                placeholder="https://example.com"
              />
            </div>

            <Button className="w-full gap-2">
              <Save className="w-4 h-4" />
              저장
            </Button>
          </CardContent>
        </Card>

        {/* 위치 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              위치 정보
            </CardTitle>
            <CardDescription>센터의 주소를 설정합니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">주소 *</Label>
              <Input
                id="address"
                defaultValue="서울시 강남구 테헤란로 123"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address-detail">상세 주소</Label>
              <Input
                id="address-detail"
                placeholder="건물명, 층수 등"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parking">주차 정보 (선택)</Label>
              <Input
                id="parking"
                placeholder="주차 가능 대수, 주차 요금 등"
              />
            </div>

            <Button className="w-full gap-2">
              <Save className="w-4 h-4" />
              저장
            </Button>
          </CardContent>
        </Card>

        {/* 운영 시간 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              운영 시간
            </CardTitle>
            <CardDescription>센터의 운영 시간을 설정합니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {[
                { day: "평일 (월-금)", id: "weekday" },
                { day: "토요일", id: "saturday" },
                { day: "일요일/공휴일", id: "sunday" },
              ].map((item) => (
                <div key={item.id} className="space-y-2">
                  <Label>{item.day}</Label>
                  <div className="flex gap-2">
                    <Input
                      type="time"
                      defaultValue={item.id === "weekday" ? "06:00" : "09:00"}
                      className="flex-1"
                    />
                    <span className="flex items-center">~</span>
                    <Input
                      type="time"
                      defaultValue={item.id === "sunday" ? "18:00" : "22:00"}
                      className="flex-1"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="holiday">정기 휴무일 (선택)</Label>
              <Input
                id="holiday"
                placeholder="예: 매주 일요일, 공휴일"
              />
            </div>

            <Button className="w-full gap-2">
              <Save className="w-4 h-4" />
              저장
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
