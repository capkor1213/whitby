import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Badge } from "@/app/components/ui/badge";
import { MessageSquare, Gift, Send, Settings, CheckCircle2, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/app/components/ui/dialog";
import { toast } from "sonner";

interface CenterMessagesTabProps {
  accessToken: string;
  supabaseUrl: string;
  publicAnonKey: string;
}

interface PlatformConnection {
  id: string;
  name: string;
  icon: string;
  color: string;
  connected: boolean;
  apiKey?: string;
}

export function CenterMessagesTab({ accessToken, supabaseUrl, publicAnonKey }: CenterMessagesTabProps) {
  const [messageType, setMessageType] = useState<"all" | "individual">("all");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["sms"]);
  const [platforms, setPlatforms] = useState<PlatformConnection[]>([
    { id: "sms", name: "SMS (문자)", icon: "📱", color: "bg-gray-500", connected: true },
    { id: "kakao", name: "카카오톡", icon: "💬", color: "bg-yellow-500", connected: false },
    { id: "instagram", name: "Instagram", icon: "📷", color: "bg-pink-500", connected: false },
    { id: "facebook", name: "Facebook", icon: "👍", color: "bg-blue-600", connected: false },
    { id: "whatsapp", name: "WhatsApp", icon: "📞", color: "bg-green-500", connected: false },
    { id: "line", name: "LINE", icon: "💚", color: "bg-green-600", connected: false },
  ]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedPlatformForSetup, setSelectedPlatformForSetup] = useState<PlatformConnection | null>(null);

  const togglePlatform = (platformId: string) => {
    const platform = platforms.find(p => p.id === platformId);
    if (!platform?.connected) {
      toast.error("먼저 플랫폼을 연동해주세요");
      return;
    }
    
    setSelectedPlatforms(prev => 
      prev.includes(platformId)
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };

  const handleConnectPlatform = (platformId: string, apiKey: string) => {
    setPlatforms(prev => prev.map(p => 
      p.id === platformId 
        ? { ...p, connected: true, apiKey }
        : p
    ));
    setIsSettingsOpen(false);
    toast.success(`${platforms.find(p => p.id === platformId)?.name} 연동이 완료되었습니다!`);
  };

  const handleDisconnectPlatform = (platformId: string) => {
    setPlatforms(prev => prev.map(p => 
      p.id === platformId 
        ? { ...p, connected: false, apiKey: undefined }
        : p
    ));
    setSelectedPlatforms(prev => prev.filter(id => id !== platformId));
    toast.info(`${platforms.find(p => p.id === platformId)?.name} 연동이 해제되었습니다`);
  };

  const handleSendMessage = () => {
    const connectedPlatformNames = platforms
      .filter(p => selectedPlatforms.includes(p.id))
      .map(p => p.name)
      .join(", ");
    
    toast.success(
      <div>
        <p className="font-semibold">메시지가 발송되었습니다</p>
        <p className="text-sm">발송 채널: {connectedPlatformNames}</p>
      </div>
    );
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">메시지 & 쿠폰</h2>
          <p className="text-gray-500 mt-2">회원에게 메시지와 쿠폰을 발송합니다</p>
        </div>
        
        {/* 플랫폼 연동 현황 */}
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Settings className="w-4 h-4" />
              플랫폼 설정
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>메시징 플랫폼 연동</DialogTitle>
              <DialogDescription>
                소셜 미디어 플랫폼을 연동하여 다양한 채널로 메시지를 발송할 수 있습니다.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {platforms.map(platform => (
                <div key={platform.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{platform.icon}</div>
                    <div>
                      <p className="font-semibold">{platform.name}</p>
                      {platform.connected ? (
                        <div className="flex items-center gap-1 text-sm text-green-600">
                          <CheckCircle2 className="w-3 h-3" />
                          연동됨
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <XCircle className="w-3 h-3" />
                          연동 안됨
                        </div>
                      )}
                    </div>
                  </div>
                  {platform.connected ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDisconnectPlatform(platform.id)}
                    >
                      연동 해제
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className={platform.color}
                      onClick={() => {
                        if (platform.id === "kakao") {
                          window.open("https://developers.kakao.com/", "_blank");
                        } else if (platform.id === "instagram") {
                          window.open("https://developers.facebook.com/docs/instagram-api", "_blank");
                        } else if (platform.id === "facebook") {
                          window.open("https://developers.facebook.com/", "_blank");
                        } else if (platform.id === "whatsapp") {
                          window.open("https://developers.facebook.com/docs/whatsapp", "_blank");
                        } else if (platform.id === "line") {
                          window.open("https://developers.line.biz/", "_blank");
                        }
                        // 데모용으로 자동 연동
                        setTimeout(() => {
                          handleConnectPlatform(platform.id, "demo-api-key");
                        }, 1000);
                      }}
                    >
                      연동하기
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <div className="bg-blue-50 p-4 rounded-lg text-sm">
              <p className="font-semibold text-blue-900 mb-2">📘 연동 안내</p>
              <ul className="text-blue-800 space-y-1 text-xs">
                <li>• 카카오톡: 카카오 비즈니스 계정이 필요합니다</li>
                <li>• Instagram/Facebook/WhatsApp: Meta Business Suite 계정 필요</li>
                <li>• LINE: LINE Official Account 필요</li>
              </ul>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 연동된 플랫폼 현황 카드 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">연동된 플랫폼</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {platforms.filter(p => p.connected).map(platform => (
              <Badge key={platform.id} className={`${platform.color} flex items-center gap-2 px-3 py-1`}>
                <span className="text-lg">{platform.icon}</span>
                <span>{platform.name}</span>
                <CheckCircle2 className="w-4 h-4" />
              </Badge>
            ))}
            {platforms.filter(p => p.connected).length === 0 && (
              <p className="text-sm text-gray-500">연동된 플랫폼이 없습니다. 플랫폼 설정에서 연동해주세요.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 메시지 발송 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              메시지 발송
            </CardTitle>
            <CardDescription>회원에게 문자 메시지를 발송합니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>발송 대상</Label>
              <div className="flex gap-4">
                <Button
                  variant={messageType === "all" ? "default" : "outline"}
                  onClick={() => setMessageType("all")}
                  className="flex-1"
                >
                  전체 회원
                </Button>
                <Button
                  variant={messageType === "individual" ? "default" : "outline"}
                  onClick={() => setMessageType("individual")}
                  className="flex-1"
                >
                  개별 발송
                </Button>
              </div>
            </div>

            {messageType === "individual" && (
              <div className="space-y-2">
                <Label htmlFor="phone">휴대폰 번호</Label>
                <Input
                  id="phone"
                  placeholder="010-1234-5678"
                  type="tel"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="message">메시지 내용</Label>
              <Textarea
                id="message"
                placeholder="회원님께 전달할 메시지를 입력하세요..."
                rows={5}
              />
              <p className="text-xs text-gray-500">0 / 2,000자</p>
            </div>

            <div className="space-y-2">
              <Label>발송 채널</Label>
              <div className="flex flex-wrap gap-2">
                {platforms.map(platform => (
                  <Badge
                    key={platform.id}
                    className={`flex items-center gap-2 ${platform.color} ${selectedPlatforms.includes(platform.id) ? 'bg-opacity-100' : 'bg-opacity-50'}`}
                    onClick={() => togglePlatform(platform.id)}
                  >
                    {platform.icon}
                    {platform.connected ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    {platform.name}
                  </Badge>
                ))}
              </div>
            </div>

            <Button className="w-full gap-2" onClick={handleSendMessage}>
              <Send className="w-4 h-4" />
              메시지 발송
            </Button>
          </CardContent>
        </Card>

        {/* 쿠폰 발급 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5" />
              쿠폰 발급
            </CardTitle>
            <CardDescription>회원에게 할인 쿠폰을 발급합니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="coupon-name">쿠폰 이름</Label>
              <Input
                id="coupon-name"
                placeholder="예: 신규 가입 축하 쿠폰"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount-type">할인 유형</Label>
              <select
                id="discount-type"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="percent">퍼센트 할인</option>
                <option value="amount">금액 할인</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount-value">할인율/금액</Label>
              <Input
                id="discount-value"
                placeholder="예: 10 (10% 또는 10,000원)"
                type="number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiry-date">만료일</Label>
              <Input
                id="expiry-date"
                type="date"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="target-members">발급 대상</Label>
              <select
                id="target-members"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">전체 회원</option>
                <option value="new">신규 회원</option>
                <option value="expiring">만료 예정 회원</option>
              </select>
            </div>

            <Button className="w-full gap-2 bg-purple-600 hover:bg-purple-700">
              <Gift className="w-4 h-4" />
              쿠폰 발급
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 발송 내역 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>최근 발송 내역</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { 
                type: "메시지", 
                content: "이번 주 운영 시간 변경 안내", 
                date: "2026-02-09 14:30", 
                count: 234,
                platforms: ["sms", "kakao", "line"]
              },
              { 
                type: "쿠폰", 
                content: "신규 가입 축하 쿠폰 (10% 할인)", 
                date: "2026-02-08 10:00", 
                count: 12,
                platforms: ["kakao", "instagram"]
              },
              { 
                type: "메시지", 
                content: "회원권 만료 안내", 
                date: "2026-02-07 09:00", 
                count: 23,
                platforms: ["sms", "whatsapp"]
              },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3 flex-1">
                  {item.type === "메시지" ? (
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Gift className="w-5 h-5 text-purple-600" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{item.content}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm text-gray-500">{item.date}</p>
                      <div className="flex gap-1">
                        {item.platforms.map(platformId => {
                          const platform = platforms.find(p => p.id === platformId);
                          return platform ? (
                            <span key={platformId} className="text-sm" title={platform.name}>
                              {platform.icon}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-600 font-semibold">
                  {item.count}명
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}