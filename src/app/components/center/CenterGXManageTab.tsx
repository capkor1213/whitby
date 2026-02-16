import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Badge } from "@/app/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Plus, Edit, Trash2, Users, Clock, Info, Package, Calendar, Infinity } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/app/components/ui/dialog";
import { toast } from "sonner";

interface CenterGXManageTabProps {
  accessToken: string;
  supabaseUrl: string;
  publicAnonKey: string;
}

interface GXClass {
  id: string;
  name: string;
  description: string;
  maxCapacity: number;
  duration: number; // 분 단위
  instructor: string;
  difficulty: "초급" | "중급" | "고급";
  color: string; // 스케줄 표시용
}

interface GXMembership {
  id: string;
  name: string;
  type: "count" | "period" | "unlimited"; // 횟수제, 기간권, 무제한권
  count?: number; // 횟수제인 경우
  period?: number; // 기간 (일 단위)
  price: number;
  description: string;
}

export function CenterGXManageTab({ accessToken, supabaseUrl, publicAnonKey }: CenterGXManageTabProps) {
  const [gxClasses, setGxClasses] = useState<GXClass[]>([]);
  const [gxMemberships, setGxMemberships] = useState<GXMembership[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddMembershipOpen, setIsAddMembershipOpen] = useState(false);
  const [isEditMembershipOpen, setIsEditMembershipOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<GXClass | null>(null);
  const [editingMembership, setEditingMembership] = useState<GXMembership | null>(null);
  const [newClass, setNewClass] = useState({
    name: "",
    description: "",
    maxCapacity: 20,
    duration: 60,
    instructor: "",
    difficulty: "중급" as const,
    color: "#3B82F6",
  });
  const [newMembership, setNewMembership] = useState({
    name: "",
    type: "count" as const,
    count: 10,
    period: 30,
    price: 100000,
    description: "",
  });

  useEffect(() => {
    loadGXClasses();
    loadGXMemberships();
  }, []);

  const loadGXClasses = () => {
    // 데모 데이터
    setGxClasses([
      {
        id: "1",
        name: "요가",
        description: "기초부터 심화까지 다양한 요가 동작을 배우는 클래스입니다.",
        maxCapacity: 15,
        duration: 60,
        instructor: "김요가",
        difficulty: "초급",
        color: "#10B981",
      },
      {
        id: "2",
        name: "필라테스",
        description: "코어 강화와 유연성 향상을 위한 필라테스 수업입니다.",
        maxCapacity: 12,
        duration: 60,
        instructor: "이필라",
        difficulty: "중급",
        color: "#8B5CF6",
      },
      {
        id: "3",
        name: "스피닝",
        description: "고강도 실내 사이클 운동으로 체지방 감소에 효과적입니다.",
        maxCapacity: 20,
        duration: 45,
        instructor: "박사이클",
        difficulty: "고급",
        color: "#EF4444",
      },
      {
        id: "4",
        name: "줌바",
        description: "신나는 라틴 음악에 맞춰 춤추는 유산소 운동입니다.",
        maxCapacity: 25,
        duration: 50,
        instructor: "최줌바",
        difficulty: "초급",
        color: "#F59E0B",
      },
    ]);
  };

  const loadGXMemberships = () => {
    // 데모 데이터
    setGxMemberships([
      {
        id: "m1",
        name: "GX 10회권",
        type: "count",
        count: 10,
        price: 100000,
        description: "GX 클래스 10회 이용 가능",
      },
      {
        id: "m2",
        name: "GX 20회권",
        type: "count",
        count: 20,
        price: 180000,
        description: "GX 클래스 20회 이용 가능",
      },
      {
        id: "m3",
        name: "GX 1개월 무제한",
        type: "unlimited",
        period: 30,
        price: 150000,
        description: "1개월 동안 모든 GX 클래스 무제한 이용",
      },
      {
        id: "m4",
        name: "GX 3개월 기간권",
        type: "period",
        period: 90,
        price: 300000,
        description: "3개월 동안 GX 클래스 이용 가능",
      },
    ]);
  };

  const handleAddClass = () => {
    if (!newClass.name || !newClass.description) {
      toast.error("클래스 이름과 설명을 입력해주세요.");
      return;
    }

    const gxClass: GXClass = {
      id: Date.now().toString(),
      ...newClass,
    };

    setGxClasses([...gxClasses, gxClass]);
    setIsAddDialogOpen(false);
    setNewClass({
      name: "",
      description: "",
      maxCapacity: 20,
      duration: 60,
      instructor: "",
      difficulty: "중급",
      color: "#3B82F6",
    });
    toast.success("GX 클래스가 추가되었습니다.");
  };

  const handleEditClass = () => {
    if (!editingClass) return;

    setGxClasses(gxClasses.map((c) => (c.id === editingClass.id ? editingClass : c)));
    setIsEditDialogOpen(false);
    setEditingClass(null);
    toast.success("GX 클래스가 수정되었습니다.");
  };

  const handleDeleteClass = (id: string) => {
    setGxClasses(gxClasses.filter((c) => c.id !== id));
    toast.success("GX 클래스가 삭제되었습니다.");
  };

  const handleAddMembership = () => {
    if (!newMembership.name || !newMembership.description) {
      toast.error("회원권 이름과 설명을 입력해주세요.");
      return;
    }

    const gxMembership: GXMembership = {
      id: Date.now().toString(),
      ...newMembership,
    };

    setGxMemberships([...gxMemberships, gxMembership]);
    setIsAddMembershipOpen(false);
    setNewMembership({
      name: "",
      type: "count" as const,
      count: 10,
      period: 30,
      price: 100000,
      description: "",
    });
    toast.success("GX 회원권이 추가되었습니다.");
  };

  const handleEditMembership = () => {
    if (!editingMembership) return;

    setGxMemberships(gxMemberships.map((m) => (m.id === editingMembership.id ? editingMembership : m)));
    setIsEditMembershipOpen(false);
    setEditingMembership(null);
    toast.success("GX 회원권이 수정되었습니다.");
  };

  const handleDeleteMembership = (id: string) => {
    setGxMemberships(gxMemberships.filter((m) => m.id !== id));
    toast.success("GX 회원권이 삭제되었습니다.");
  };

  const difficultyColors = {
    초급: "bg-green-100 text-green-800",
    중급: "bg-yellow-100 text-yellow-800",
    고급: "bg-red-100 text-red-800",
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">GX 클래스 관리</h1>
          <p className="text-gray-500 mt-1">그룹 운동 클래스를 생성하고 관리합니다</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              클래스 추가
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>새 GX 클래스 추가</DialogTitle>
              <DialogDescription>새로운 그룹 운동 클래스 정보를 입력하세요.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>클래스 이름 *</Label>
                  <Input
                    value={newClass.name}
                    onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                    placeholder="요가, 필라테스, 스피닝 등"
                  />
                </div>
                <div>
                  <Label>강사 이름</Label>
                  <Input
                    value={newClass.instructor}
                    onChange={(e) => setNewClass({ ...newClass, instructor: e.target.value })}
                    placeholder="담당 강사 이름"
                  />
                </div>
              </div>
              <div>
                <Label>클래스 설명 *</Label>
                <Textarea
                  value={newClass.description}
                  onChange={(e) => setNewClass({ ...newClass, description: e.target.value })}
                  placeholder="클래스에 대한 설명을 입력하세요"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>최대 인원</Label>
                  <Input
                    type="number"
                    value={newClass.maxCapacity}
                    onChange={(e) => setNewClass({ ...newClass, maxCapacity: Number(e.target.value) })}
                    min="1"
                  />
                </div>
                <div>
                  <Label>수업 시간 (분)</Label>
                  <Input
                    type="number"
                    value={newClass.duration}
                    onChange={(e) => setNewClass({ ...newClass, duration: Number(e.target.value) })}
                    min="15"
                    step="15"
                  />
                </div>
                <div>
                  <Label>난이도</Label>
                  <select
                    value={newClass.difficulty}
                    onChange={(e) => setNewClass({ ...newClass, difficulty: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="초급">초급</option>
                    <option value="중급">중급</option>
                    <option value="고급">고급</option>
                  </select>
                </div>
              </div>
              <div>
                <Label>스케줄 색상</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={newClass.color}
                    onChange={(e) => setNewClass({ ...newClass, color: e.target.value })}
                    className="w-20 h-10"
                  />
                  <span className="text-sm text-gray-500">스케줄에 표시될 색상을 선택하세요</span>
                </div>
              </div>
              <Button onClick={handleAddClass} className="w-full">
                추가하기
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>총 클래스 수</CardDescription>
            <CardTitle className="text-3xl">{gxClasses.length}개</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>총 수용 인원</CardDescription>
            <CardTitle className="text-3xl">
              {gxClasses.reduce((sum, c) => sum + c.maxCapacity, 0)}명
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>평균 수업 시간</CardDescription>
            <CardTitle className="text-3xl">
              {gxClasses.length > 0
                ? Math.round(gxClasses.reduce((sum, c) => sum + c.duration, 0) / gxClasses.length)
                : 0}
              분
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>활성 강사</CardDescription>
            <CardTitle className="text-3xl">
              {new Set(gxClasses.map((c) => c.instructor).filter(Boolean)).size}명
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* 클래스 목록 */}
      <div className="grid gap-4">
        {gxClasses.map((gxClass) => (
          <Card key={gxClass.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: gxClass.color }}
                  >
                    {gxClass.name.charAt(0)}
                  </div>
                  <div>
                    <CardTitle className="text-xl">{gxClass.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      {gxClass.instructor && <span>강사: {gxClass.instructor}</span>}
                      <Badge className={difficultyColors[gxClass.difficulty]}>
                        {gxClass.difficulty}
                      </Badge>
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingClass(gxClass);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteClass(gxClass.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>{gxClass.description}</p>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>최대 {gxClass.maxCapacity}명</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{gxClass.duration}분</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {gxClasses.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-500 text-center">등록된 GX 클래스가 없습니다.</p>
            <p className="text-sm text-gray-400 text-center mt-1">
              "클래스 추가" 버튼을 눌러 새로운 클래스를 생성하세요.
            </p>
          </CardContent>
        </Card>
      )}

      {/* 수정 다이얼로그 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>GX 클래스 수정</DialogTitle>
            <DialogDescription>클래스 정보를 수정합니다.</DialogDescription>
          </DialogHeader>
          {editingClass && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>클래스 이름</Label>
                  <Input
                    value={editingClass.name}
                    onChange={(e) => setEditingClass({ ...editingClass, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>강사 이름</Label>
                  <Input
                    value={editingClass.instructor}
                    onChange={(e) => setEditingClass({ ...editingClass, instructor: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>클래스 설명</Label>
                <Textarea
                  value={editingClass.description}
                  onChange={(e) => setEditingClass({ ...editingClass, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>최대 인원</Label>
                  <Input
                    type="number"
                    value={editingClass.maxCapacity}
                    onChange={(e) =>
                      setEditingClass({ ...editingClass, maxCapacity: Number(e.target.value) })
                    }
                    min="1"
                  />
                </div>
                <div>
                  <Label>수업 시간 (분)</Label>
                  <Input
                    type="number"
                    value={editingClass.duration}
                    onChange={(e) =>
                      setEditingClass({ ...editingClass, duration: Number(e.target.value) })
                    }
                    min="15"
                    step="15"
                  />
                </div>
                <div>
                  <Label>난이도</Label>
                  <select
                    value={editingClass.difficulty}
                    onChange={(e) =>
                      setEditingClass({ ...editingClass, difficulty: e.target.value as any })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="초급">초급</option>
                    <option value="중급">중급</option>
                    <option value="고급">고급</option>
                  </select>
                </div>
              </div>
              <div>
                <Label>스케줄 색상</Label>
                <Input
                  type="color"
                  value={editingClass.color}
                  onChange={(e) => setEditingClass({ ...editingClass, color: e.target.value })}
                  className="w-20 h-10"
                />
              </div>
              <Button onClick={handleEditClass} className="w-full">
                수정하기
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 회원권 관리 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">GX 회원권 관리</h1>
          <p className="text-gray-500 mt-1">GX 클래스 이용을 위한 회원권을 생성하고 관리합니다</p>
        </div>
        <Dialog open={isAddMembershipOpen} onOpenChange={setIsAddMembershipOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              회원권 추가
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>새 GX 회원권 추가</DialogTitle>
              <DialogDescription>새로운 GX 클래스 이용 회원권 정보를 입력하세요.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>회원권 이름 *</Label>
                  <Input
                    value={newMembership.name}
                    onChange={(e) => setNewMembership({ ...newMembership, name: e.target.value })}
                    placeholder="GX 10회권, GX 1개월 무제한 등"
                  />
                </div>
                <div>
                  <Label>회원권 유형 *</Label>
                  <select
                    value={newMembership.type}
                    onChange={(e) => setNewMembership({ ...newMembership, type: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="count">횟수제</option>
                    <option value="period">기간권</option>
                    <option value="unlimited">무제한권</option>
                  </select>
                </div>
              </div>
              <div>
                <Label>회원권 설명 *</Label>
                <Textarea
                  value={newMembership.description}
                  onChange={(e) => setNewMembership({ ...newMembership, description: e.target.value })}
                  placeholder="회원권에 대한 설명을 입력하세요"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>회원권 가격 *</Label>
                  <Input
                    type="number"
                    value={newMembership.price}
                    onChange={(e) => setNewMembership({ ...newMembership, price: Number(e.target.value) })}
                    min="0"
                  />
                </div>
                {newMembership.type === "count" && (
                  <div>
                    <Label>이용 횟수 *</Label>
                    <Input
                      type="number"
                      value={newMembership.count}
                      onChange={(e) => setNewMembership({ ...newMembership, count: Number(e.target.value) })}
                      min="1"
                    />
                  </div>
                )}
                {newMembership.type === "period" && (
                  <div>
                    <Label>이용 기간 *</Label>
                    <Input
                      type="number"
                      value={newMembership.period}
                      onChange={(e) => setNewMembership({ ...newMembership, period: Number(e.target.value) })}
                      min="1"
                    />
                  </div>
                )}
              </div>
              <Button onClick={handleAddMembership} className="w-full">
                추가하기
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 회원권 목록 */}
      <div className="grid gap-4">
        {gxMemberships.map((gxMembership) => (
          <Card key={gxMembership.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: "#3B82F6" }}
                  >
                    {gxMembership.name.charAt(0)}
                  </div>
                  <div>
                    <CardTitle className="text-xl">{gxMembership.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Badge className="bg-gray-100 text-gray-800">
                        {gxMembership.type === "count"
                          ? `${gxMembership.count}회`
                          : gxMembership.type === "period"
                          ? `${gxMembership.period}일`
                          : "무제한"}
                      </Badge>
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingMembership(gxMembership);
                      setIsEditMembershipOpen(true);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteMembership(gxMembership.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>{gxMembership.description}</p>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Package className="w-4 h-4" />
                    <span>가격: {gxMembership.price.toLocaleString()}원</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {gxMemberships.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-500 text-center">등록된 GX 회원권이 없습니다.</p>
            <p className="text-sm text-gray-400 text-center mt-1">
              "회원권 추가" 버튼을 눌러 새로운 회원권을 생성하세요.
            </p>
          </CardContent>
        </Card>
      )}

      {/* 회원권 수정 다이얼로그 */}
      <Dialog open={isEditMembershipOpen} onOpenChange={setIsEditMembershipOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>GX 회원권 수정</DialogTitle>
            <DialogDescription>회원권 정보를 수정합니다.</DialogDescription>
          </DialogHeader>
          {editingMembership && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>회원권 이름</Label>
                  <Input
                    value={editingMembership.name}
                    onChange={(e) => setEditingMembership({ ...editingMembership, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>회원권 유형</Label>
                  <select
                    value={editingMembership.type}
                    onChange={(e) =>
                      setEditingMembership({ ...editingMembership, type: e.target.value as any })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="count">횟수제</option>
                    <option value="period">기간권</option>
                    <option value="unlimited">무제한권</option>
                  </select>
                </div>
              </div>
              <div>
                <Label>회원권 설명</Label>
                <Textarea
                  value={editingMembership.description}
                  onChange={(e) =>
                    setEditingMembership({ ...editingMembership, description: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>회원권 가격</Label>
                  <Input
                    type="number"
                    value={editingMembership.price}
                    onChange={(e) =>
                      setEditingMembership({ ...editingMembership, price: Number(e.target.value) })
                    }
                    min="0"
                  />
                </div>
                {editingMembership.type === "count" && (
                  <div>
                    <Label>이용 횟수</Label>
                    <Input
                      type="number"
                      value={editingMembership.count}
                      onChange={(e) =>
                        setEditingMembership({ ...editingMembership, count: Number(e.target.value) })
                      }
                      min="1"
                    />
                  </div>
                )}
                {editingMembership.type === "period" && (
                  <div>
                    <Label>이용 기간</Label>
                    <Input
                      type="number"
                      value={editingMembership.period}
                      onChange={(e) =>
                        setEditingMembership({ ...editingMembership, period: Number(e.target.value) })
                      }
                      min="1"
                    />
                  </div>
                )}
              </div>
              <Button onClick={handleEditMembership} className="w-full">
                수정하기
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}