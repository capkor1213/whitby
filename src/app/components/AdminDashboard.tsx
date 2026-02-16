import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { 
  Users, 
  Shield, 
  FileText, 
  Trash2, 
  Search, 
  Download,
  Lock,
  Database,
  ExternalLink,
  LogOut,
  Eye,
  Edit,
  AlertTriangle
} from "lucide-react";
import whitbyLogo from "figma:asset/e51e097fc8aad7c73b8d6f36e3388a97303b1760.png";
import { getSupabaseClient } from "@/utils/supabase/client";
import { toast } from "sonner";

interface AdminDashboardProps {
  accessToken: string;
  onLogout: () => void;
}

interface UserData {
  id: string;
  email: string;
  name: string;
  phone: string;
  createdAt: string;
  lastLoginAt: string;
  status: "active" | "suspended" | "deleted";
  userType: string;
}

interface ConsentLog {
  userId: string;
  type: "terms" | "privacy" | "health" | "marketing_email" | "marketing_sms" | "marketing_push" | "age";
  agreed: boolean;
  agreedAt: string;
  version: string;
  ipAddress: string;
}

interface AdminLog {
  id: string;
  adminId: string;
  adminName: string;
  action: "view" | "edit" | "delete";
  targetUserId: string;
  targetUserEmail: string;
  details: string;
  timestamp: string;
}

interface DeletionSchedule {
  userId: string;
  userName: string;
  userEmail: string;
  scheduledDate: string;
  status: "pending" | "completed";
}

interface ThirdPartyService {
  id: string;
  name: string;
  category: "sms" | "email" | "push" | "cloud" | "payment";
  purpose: string;
  contractSigned: boolean;
  contractDate: string;
  status: "active" | "inactive";
}

export function AdminDashboard({ accessToken, onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState<UserData[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [consentLogs, setConsentLogs] = useState<ConsentLog[]>([]);
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>([]);
  const [deletionSchedules, setDeletionSchedules] = useState<DeletionSchedule[]>([]);
  const [thirdPartyServices, setThirdPartyServices] = useState<ThirdPartyService[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [adminName, setAdminName] = useState("");

  const supabase = getSupabaseClient();

  useEffect(() => {
    loadAdminInfo();
    loadUsers();
    loadAdminLogs();
    loadDeletionSchedules();
    loadThirdPartyServices();
  }, []);

  const loadAdminInfo = async () => {
    try {
      const { data } = await supabase.auth.getUser(accessToken);
      if (data.user?.user_metadata) {
        setAdminName(data.user.user_metadata.name || "관리자");
      }
    } catch (error) {
      console.error("Error loading admin info:", error);
    }
  };

  const loadUsers = async () => {
    try {
      // LocalStorage에서 모든 사용자 정보 로드
      const allUsers: UserData[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("user_")) {
          const userData = localStorage.getItem(key);
          if (userData) {
            const user = JSON.parse(userData);
            allUsers.push(user);
          }
        }
      }

      setUsers(allUsers);
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const loadConsentLogs = async (userId: string) => {
    try {
      const key = `consent_logs_${userId}`;
      const logs = localStorage.getItem(key);
      if (logs) {
        setConsentLogs(JSON.parse(logs));
      } else {
        setConsentLogs([]);
      }
    } catch (error) {
      console.error("Error loading consent logs:", error);
    }
  };

  const loadAdminLogs = async () => {
    try {
      const logs = localStorage.getItem("admin_logs");
      if (logs) {
        setAdminLogs(JSON.parse(logs));
      } else {
        setAdminLogs([]);
      }
    } catch (error) {
      console.error("Error loading admin logs:", error);
    }
  };

  const loadDeletionSchedules = async () => {
    try {
      const schedules = localStorage.getItem("deletion_schedules");
      if (schedules) {
        setDeletionSchedules(JSON.parse(schedules));
      } else {
        setDeletionSchedules([]);
      }
    } catch (error) {
      console.error("Error loading deletion schedules:", error);
    }
  };

  const loadThirdPartyServices = async () => {
    // 기본 외부 서비스 목록
    const defaultServices: ThirdPartyService[] = [
      {
        id: "1",
        name: "Supabase",
        category: "cloud",
        purpose: "데이터베이스 및 인증 서비스",
        contractSigned: true,
        contractDate: "2024-01-01",
        status: "active",
      },
      {
        id: "2",
        name: "Vercel",
        category: "cloud",
        purpose: "웹 호스팅",
        contractSigned: true,
        contractDate: "2024-01-01",
        status: "active",
      },
    ];

    try {
      const services = localStorage.getItem("third_party_services");
      if (services) {
        setThirdPartyServices(JSON.parse(services));
      } else {
        setThirdPartyServices(defaultServices);
        localStorage.setItem("third_party_services", JSON.stringify(defaultServices));
      }
    } catch (error) {
      console.error("Error loading third party services:", error);
    }
  };

  const recordAdminLog = async (action: "view" | "edit" | "delete", targetUser: UserData, details: string) => {
    try {
      const { data } = await supabase.auth.getUser(accessToken);
      if (!data.user) return;

      const newLog: AdminLog = {
        id: `log_${Date.now()}`,
        adminId: data.user.id,
        adminName: adminName,
        action,
        targetUserId: targetUser.id,
        targetUserEmail: targetUser.email,
        details,
        timestamp: new Date().toISOString(),
      };

      const logs = [...adminLogs, newLog];
      setAdminLogs(logs);
      localStorage.setItem("admin_logs", JSON.stringify(logs));
    } catch (error) {
      console.error("Error recording admin log:", error);
    }
  };

  const handleViewUser = async (user: UserData) => {
    setSelectedUser(user);
    await loadConsentLogs(user.id);
    await recordAdminLog("view", user, "회원 정보 조회");
  };

  const handleUpdateUserStatus = async (userId: string, newStatus: "active" | "suspended" | "deleted") => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      const updatedUser = { ...user, status: newStatus };
      const updatedUsers = users.map(u => u.id === userId ? updatedUser : u);
      setUsers(updatedUsers);

      localStorage.setItem(`user_${userId}`, JSON.stringify(updatedUser));
      await recordAdminLog("edit", user, `회원 상태 변경: ${newStatus}`);
      
      toast.success("회원 상태가 변경되었습니다.");
    } catch (error) {
      console.error("Error updating user status:", error);
      toast.error("상태 변경 중 오류가 발생했습니다.");
    }
  };

  const handleImmediateDeletion = async (user: UserData) => {
    if (!confirm(`${user.name}(${user.email}) 회원의 개인정보를 즉시 삭제하시겠습니까?`)) {
      return;
    }

    try {
      // 개인정보 즉시 파기
      localStorage.removeItem(`user_${user.id}`);
      localStorage.removeItem(`profile_${user.id}`);
      localStorage.removeItem(`consent_logs_${user.id}`);
      localStorage.removeItem(`terms_${user.id}`);

      // 파기 로그 기록
      await recordAdminLog("delete", user, "즉시 탈퇴 처리 - 개인정보 파기 완료");

      const updatedUsers = users.filter(u => u.id !== user.id);
      setUsers(updatedUsers);
      setSelectedUser(null);

      toast.success("회원 정보가 즉시 삭제되었습니다.");
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("삭제 중 오류가 발생했습니다.");
    }
  };

  const handleScheduledDeletion = async (user: UserData, days: number) => {
    try {
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + days);

      const newSchedule: DeletionSchedule = {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        scheduledDate: scheduledDate.toISOString(),
        status: "pending",
      };

      const schedules = [...deletionSchedules, newSchedule];
      setDeletionSchedules(schedules);
      localStorage.setItem("deletion_schedules", JSON.stringify(schedules));

      await recordAdminLog("edit", user, `탈퇴 예약: ${days}일 후 삭제 예정`);

      toast.success(`${days}일 후 삭제가 예약되었습니다.`);
    } catch (error) {
      console.error("Error scheduling deletion:", error);
      toast.error("예약 중 오류가 발생했습니다.");
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={whitbyLogo} alt="Whitby" className="h-8" />
              <Badge variant="destructive" className="text-xs">
                <Shield className="w-3 h-3 mr-1" />
                관리자 모드
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{adminName}</span>
              <Button variant="outline" size="sm" onClick={onLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                로그아웃
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              회원 관리
            </TabsTrigger>
            <TabsTrigger value="consent">
              <FileText className="w-4 h-4 mr-2" />
              동의 내역
            </TabsTrigger>
            <TabsTrigger value="logs">
              <Eye className="w-4 h-4 mr-2" />
              접근 로그
            </TabsTrigger>
            <TabsTrigger value="deletion">
              <Trash2 className="w-4 h-4 mr-2" />
              개인정보 파기
            </TabsTrigger>
            <TabsTrigger value="thirdparty">
              <ExternalLink className="w-4 h-4 mr-2" />
              외부 위탁
            </TabsTrigger>
          </TabsList>

          {/* 회원 관리 탭 */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>회원 개인정보 관리</CardTitle>
                <CardDescription>
                  회원의 기본 정보를 조회하고 상태를 관리합니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="이름 또는 이메일로 검색"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-sm"
                  />
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">이름</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">이메일</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">가입일</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">액션</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredUsers.map((user) => (
                        <tr key={user.id}>
                          <td className="px-4 py-3 text-sm">{user.name}</td>
                          <td className="px-4 py-3 text-sm">{user.email}</td>
                          <td className="px-4 py-3 text-sm">
                            {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <Badge variant={
                              user.status === "active" ? "default" :
                              user.status === "suspended" ? "secondary" : "destructive"
                            }>
                              {user.status === "active" ? "정상" :
                               user.status === "suspended" ? "이용정지" : "탈퇴"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewUser(user)}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              상세보기
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {selectedUser && (
              <Card>
                <CardHeader>
                  <CardTitle>회원 상세 정보</CardTitle>
                  <CardDescription>
                    {selectedUser.name} ({selectedUser.email})
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-500">이름</Label>
                      <p className="text-sm font-medium">{selectedUser.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">이메일</Label>
                      <p className="text-sm font-medium">{selectedUser.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">휴대전화번호</Label>
                      <p className="text-sm font-medium">{selectedUser.phone || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">가입일</Label>
                      <p className="text-sm font-medium">
                        {new Date(selectedUser.createdAt).toLocaleString('ko-KR')}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">최근 로그인</Label>
                      <p className="text-sm font-medium">
                        {selectedUser.lastLoginAt 
                          ? new Date(selectedUser.lastLoginAt).toLocaleString('ko-KR')
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">회원 유형</Label>
                      <p className="text-sm font-medium">{selectedUser.userType}</p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <Label className="text-sm font-medium mb-2 block">회원 상태 관리</Label>
                    <div className="flex gap-2">
                      <Button
                        variant={selectedUser.status === "active" ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleUpdateUserStatus(selectedUser.id, "active")}
                      >
                        정상
                      </Button>
                      <Button
                        variant={selectedUser.status === "suspended" ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleUpdateUserStatus(selectedUser.id, "suspended")}
                      >
                        이용정지
                      </Button>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <Label className="text-sm font-medium mb-2 block text-red-600">
                      <AlertTriangle className="w-4 h-4 inline mr-1" />
                      회원 탈퇴 처리
                    </Label>
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleImmediateDeletion(selectedUser)}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        즉시 탈퇴
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleScheduledDeletion(selectedUser, 7)}
                      >
                        7일 유예 탈퇴
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* 동의 내역 탭 */}
          <TabsContent value="consent" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>동의 내역 관리</CardTitle>
                <CardDescription>
                  회원별 약관 동의 내역을 확인합니다. 언제, 어떤 내용에 동의했는지 로그로 관리됩니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedUser ? (
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium mb-2">
                        {selectedUser.name} ({selectedUser.email})
                      </h3>
                    </div>

                    {consentLogs.length > 0 ? (
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">동의 항목</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">동의 여부</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">동의 일시</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">약관 버전</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP 주소</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {consentLogs.map((log, index) => (
                              <tr key={index}>
                                <td className="px-4 py-3 text-sm">
                                  {log.type === "terms" ? "서비스 이용약관" :
                                   log.type === "privacy" ? "개인정보 수집·이용" :
                                   log.type === "health" ? "건강정보(민감정보)" :
                                   log.type === "marketing_email" ? "마케팅 수신 - 이메일" :
                                   log.type === "marketing_sms" ? "마케팅 수신 - SMS" :
                                   log.type === "marketing_push" ? "마케팅 수신 - 푸시" :
                                   log.type === "age" ? "만 14세 이상" : log.type}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <Badge variant={log.agreed ? "default" : "secondary"}>
                                    {log.agreed ? "Y" : "N"}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  {new Date(log.agreedAt).toLocaleString('ko-KR')}
                                </td>
                                <td className="px-4 py-3 text-sm">{log.version}</td>
                                <td className="px-4 py-3 text-sm">{log.ipAddress}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        동의 내역이 없습니다.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    회원 관리 탭에서 회원을 선택하면 동의 내역을 확인할 수 있습니다.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 접근 로그 탭 */}
          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>개인정보 접근 로그</CardTitle>
                <CardDescription>
                  관리자의 개인정보 열람·수정·삭제 이력이 기록됩니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {adminLogs.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">일시</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">관리자</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">작업</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">대상 회원</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">상세 내용</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {adminLogs.map((log) => (
                          <tr key={log.id}>
                            <td className="px-4 py-3 text-sm">
                              {new Date(log.timestamp).toLocaleString('ko-KR')}
                            </td>
                            <td className="px-4 py-3 text-sm">{log.adminName}</td>
                            <td className="px-4 py-3 text-sm">
                              <Badge variant={
                                log.action === "view" ? "secondary" :
                                log.action === "edit" ? "default" : "destructive"
                              }>
                                {log.action === "view" ? "조회" :
                                 log.action === "edit" ? "수정" : "삭제"}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-sm">{log.targetUserEmail}</td>
                            <td className="px-4 py-3 text-sm">{log.details}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    접근 로그가 없습니다.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  <Lock className="w-5 h-5 inline mr-2" />
                  민감정보(건강정보) 관리
                </CardTitle>
                <CardDescription>
                  건강정보는 일반 개인정보와 분리 저장되며, 접근 권한이 최소화됩니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      <AlertTriangle className="w-4 h-4 inline mr-1" />
                      건강정보는 엑셀 다운로드가 불가능합니다.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" disabled>
                      <Download className="w-4 h-4 mr-2" />
                      엑셀 다운로드 (비활성화)
                    </Button>
                    <Button variant="outline">
                      <Database className="w-4 h-4 mr-2" />
                      통계용 익명 데이터 추출
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 개인정보 파기 탭 */}
          <TabsContent value="deletion" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>개인정보 파기 관리</CardTitle>
                <CardDescription>
                  탈퇴 회원 데이터 자동 파기 및 파기 예정 목록을 관리합니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {deletionSchedules.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">회원명</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">이메일</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">파기 예정일</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {deletionSchedules.map((schedule, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3 text-sm">{schedule.userName}</td>
                            <td className="px-4 py-3 text-sm">{schedule.userEmail}</td>
                            <td className="px-4 py-3 text-sm">
                              {new Date(schedule.scheduledDate).toLocaleDateString('ko-KR')}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <Badge variant={schedule.status === "pending" ? "secondary" : "default"}>
                                {schedule.status === "pending" ? "대기" : "완료"}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    파기 예정 데이터가 없습니다.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>파기 정책</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">즉시 파기 항목</h4>
                    <ul className="text-sm space-y-1 text-gray-600">
                      <li>• 회원 기본정보</li>
                      <li>• 로그인 정보</li>
                      <li>• 마케팅 수신 동의 내역</li>
                      <li>• 건강정보 (운동 기록, 신체 정보)</li>
                    </ul>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">보관 후 파기 항목</h4>
                    <ul className="text-sm space-y-1 text-gray-600">
                      <li>• 계약/결제 기록: 5년</li>
                      <li>• 소비자 불만 기록: 3년</li>
                      <li>• 로그인 기록(IP): 3개월</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 외부 위탁 탭 */}
          <TabsContent value="thirdparty" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>위탁·외부 연동 관리</CardTitle>
                <CardDescription>
                  개인정보를 위탁하는 외부 업체 및 서비스를 관리합니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">서비스명</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">분류</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">위탁 목적</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">계약 체결</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {thirdPartyServices.map((service) => (
                        <tr key={service.id}>
                          <td className="px-4 py-3 text-sm font-medium">{service.name}</td>
                          <td className="px-4 py-3 text-sm">
                            <Badge variant="outline">
                              {service.category === "sms" ? "SMS" :
                               service.category === "email" ? "이메일" :
                               service.category === "push" ? "푸시" :
                               service.category === "cloud" ? "클라우드" :
                               service.category === "payment" ? "결제" : service.category}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm">{service.purpose}</td>
                          <td className="px-4 py-3 text-sm">
                            {service.contractSigned ? (
                              <span className="text-green-600">
                                ✓ {new Date(service.contractDate).toLocaleDateString('ko-KR')}
                              </span>
                            ) : (
                              <span className="text-red-600">✗ 미체결</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <Badge variant={service.status === "active" ? "default" : "secondary"}>
                              {service.status === "active" ? "활성" : "비활성"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}