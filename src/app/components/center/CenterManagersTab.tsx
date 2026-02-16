import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Badge } from "@/app/components/ui/badge";
import { UserCog, Plus, Search, Edit, Trash2, Mail, Phone, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/app/components/ui/dialog";
import { toast } from "sonner";

interface CenterManagersTabProps {
  accessToken: string;
  supabaseUrl: string;
  publicAnonKey: string;
}

interface Manager {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  joinedAt: string;
  status: "active" | "inactive";
}

export function CenterManagersTab({ accessToken, supabaseUrl, publicAnonKey }: CenterManagersTabProps) {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newManager, setNewManager] = useState({
    name: "",
    email: "",
    phone: "",
    role: "매니저",
  });

  useEffect(() => {
    loadManagers();
  }, []);

  const loadManagers = () => {
    // 데모 데이터
    setManagers([
      {
        id: "1",
        name: "김매니저",
        email: "manager1@example.com",
        phone: "010-1234-5678",
        role: "센터장",
        joinedAt: "2024-01-15",
        status: "active",
      },
      {
        id: "2",
        name: "이부장",
        email: "manager2@example.com",
        phone: "010-2345-6789",
        role: "운영 매니저",
        joinedAt: "2024-02-20",
        status: "active",
      },
    ]);
  };

  const handleAddManager = () => {
    if (!newManager.name || !newManager.email || !newManager.phone) {
      toast.error("모든 필드를 입력해주세요.");
      return;
    }

    const manager: Manager = {
      id: Date.now().toString(),
      name: newManager.name,
      email: newManager.email,
      phone: newManager.phone,
      role: newManager.role,
      joinedAt: new Date().toISOString().split("T")[0],
      status: "active",
    };

    setManagers([...managers, manager]);
    setIsAddDialogOpen(false);
    setNewManager({ name: "", email: "", phone: "", role: "매니저" });
    toast.success("매니저가 추가되었습니다.");
  };

  const handleDeleteManager = (id: string) => {
    setManagers(managers.filter((m) => m.id !== id));
    toast.success("매니저가 삭제되었습니다.");
  };

  const filteredManagers = managers.filter(
    (m) =>
      m.name.includes(searchQuery) ||
      m.email.includes(searchQuery) ||
      m.phone.includes(searchQuery)
  );

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">매니저 관리</h1>
          <p className="text-gray-500 mt-1">센터 매니저 및 관리자 정보를 관리합니다</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              매니저 추가
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 매니저 추가</DialogTitle>
              <DialogDescription>새로운 센터 매니저 정보를 입력하세요.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>이름</Label>
                <Input
                  value={newManager.name}
                  onChange={(e) => setNewManager({ ...newManager, name: e.target.value })}
                  placeholder="이름을 입력하세요"
                />
              </div>
              <div>
                <Label>이메일</Label>
                <Input
                  type="email"
                  value={newManager.email}
                  onChange={(e) => setNewManager({ ...newManager, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <Label>전화번호</Label>
                <Input
                  value={newManager.phone}
                  onChange={(e) => setNewManager({ ...newManager, phone: e.target.value })}
                  placeholder="010-0000-0000"
                />
              </div>
              <div>
                <Label>역할</Label>
                <Input
                  value={newManager.role}
                  onChange={(e) => setNewManager({ ...newManager, role: e.target.value })}
                  placeholder="예: 센터장, 운영 매니저"
                />
              </div>
              <Button onClick={handleAddManager} className="w-full">
                추가하기
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 검색 */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="이름, 이메일, 전화번호로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* 매니저 목록 */}
      <div className="grid gap-4">
        {filteredManagers.map((manager) => (
          <Card key={manager.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {manager.name.charAt(0)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{manager.name}</CardTitle>
                    <CardDescription>{manager.role}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={manager.status === "active" ? "default" : "secondary"}>
                    {manager.status === "active" ? "활성" : "비활성"}
                  </Badge>
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteManager(manager.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>{manager.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{manager.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>입사일: {manager.joinedAt}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredManagers.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UserCog className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-500 text-center">
              {searchQuery ? "검색 결과가 없습니다." : "등록된 매니저가 없습니다."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
