import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Badge } from "@/app/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Label } from "@/app/components/ui/label";
import { Search, Plus, Edit, Trash2, ShoppingCart, Clock, CheckCircle, AlertCircle, Pause, Play, History } from "lucide-react";
import { toast } from "sonner";

interface ActiveMembersTabProps {
  accessToken: string;
  supabaseUrl: string;
  publicAnonKey: string;
}

interface Product {
  id: string;
  memberId: number;
  type: "membership" | "pt";
  name: string;
  status: "active" | "pending" | "expired";
  startDate: string;
  endDate?: string;
  totalSessions?: number;
  usedSessions?: number;
  remainingSessions?: number;
  purchaseDate: string;
  pausable: boolean; // 정지 가능 여부
  pauseHistory?: PauseRecord[]; // 정지 이력
}

interface PauseRecord {
  id: string;
  startDate: string;
  endDate: string;
  days: number;
  reason?: string;
}

export function ActiveMembersTab({ accessToken, supabaseUrl, publicAnonKey }: ActiveMembersTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([
    {
      id: "p1",
      memberId: 1,
      type: "membership",
      name: "6개월권",
      status: "active",
      startDate: "2026-01-15",
      endDate: "2026-07-15",
      purchaseDate: "2026-01-15",
      pausable: true,
      pauseHistory: [
        {
          id: "ph1",
          startDate: "2026-03-01",
          endDate: "2026-03-10",
          days: 10,
          reason: "휴가"
        }
      ]
    },
    {
      id: "p2",
      memberId: 2,
      type: "membership",
      name: "3개월권",
      status: "active",
      startDate: "2026-02-01",
      endDate: "2026-05-01",
      purchaseDate: "2026-02-01",
      pausable: true,
      pauseHistory: [
        {
          id: "ph2",
          startDate: "2026-04-01",
          endDate: "2026-04-05",
          days: 5,
          reason: "질병"
        }
      ]
    },
    {
      id: "p3",
      memberId: 3,
      type: "pt",
      name: "PT 10회권",
      status: "active",
      startDate: "2026-02-01",
      totalSessions: 10,
      usedSessions: 3,
      remainingSessions: 7,
      purchaseDate: "2026-02-01",
      pausable: true,
      pauseHistory: [
        {
          id: "ph3",
          startDate: "2026-02-05",
          endDate: "2026-02-07",
          days: 2,
          reason: "휴가"
        }
      ]
    },
  ]);

  // 상품 구매 관련
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);
  const [productType, setProductType] = useState<"membership" | "pt">("membership");
  const [productName, setProductName] = useState("");
  const [duration, setDuration] = useState("1");
  const [sessions, setSessions] = useState("10");

  // 정지 관련
  const [isPauseDialogOpen, setIsPauseDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [pauseStartDate, setPauseStartDate] = useState("");
  const [pauseEndDate, setPauseEndDate] = useState("");
  const [pauseReason, setPauseReason] = useState("");
  const [isPauseHistoryOpen, setIsPauseHistoryOpen] = useState(false);

  const mockMembers = [
    { 
      id: 1, 
      name: "김철수", 
      phone: "010-1234-5678", 
      membership: "6개월권", 
      startDate: "2026-01-15", 
      endDate: "2026-07-15", 
      remainingDays: 157,
      status: "활성" 
    },
    { 
      id: 2, 
      name: "이영희", 
      phone: "010-2345-6789", 
      membership: "3개월권", 
      startDate: "2026-02-01", 
      endDate: "2026-05-01", 
      remainingDays: 81,
      status: "활성" 
    },
    { 
      id: 3, 
      name: "박민수", 
      phone: "010-3456-7890", 
      membership: "1개월권", 
      startDate: "2026-02-05", 
      endDate: "2026-03-05", 
      remainingDays: 24,
      status: "활성" 
    },
    { 
      id: 4, 
      name: "최지은", 
      phone: "010-4567-8901", 
      membership: "1년권", 
      startDate: "2025-12-01", 
      endDate: "2026-12-01", 
      remainingDays: 295,
      status: "활성" 
    },
    { 
      id: 5, 
      name: "정호영", 
      phone: "010-5678-9012", 
      membership: "3개월권", 
      startDate: "2026-01-20", 
      endDate: "2026-04-20", 
      remainingDays: 70,
      status: "활성" 
    },
  ];

  const filteredMembers = mockMembers.filter(member => 
    member.name.includes(searchQuery) || member.phone.includes(searchQuery)
  );

  const getMemberProducts = (memberId: number) => {
    return products.filter(p => p.memberId === memberId);
  };

  const getActiveMembershipProduct = (memberId: number) => {
    return products.find(p => 
      p.memberId === memberId && 
      p.type === "membership" && 
      p.status === "active"
    );
  };

  const getActivePTProduct = (memberId: number) => {
    return products.find(p => 
      p.memberId === memberId && 
      p.type === "pt" && 
      p.status === "active"
    );
  };

  const handlePurchaseProduct = () => {
    if (!selectedMember) return;

    if (productType === "membership") {
      if (!productName || !duration) {
        toast.error("멤버십 이름과 기간을 입력해주세요.");
        return;
      }

      const activeMembership = getActiveMembershipProduct(selectedMember.id);
      const purchaseDate = new Date().toISOString().split("T")[0];
      let startDate = purchaseDate;
      let status: "active" | "pending" = "active";

      if (activeMembership && new Date(activeMembership.endDate!) > new Date()) {
        // 기존 멤버십이 아직 유효함 - 새 상품을 대기 상태로
        status = "pending";
        startDate = activeMembership.endDate!;
        
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + parseInt(duration));
        const endDateStr = endDate.toISOString().split("T")[0];

        const newProduct: Product = {
          id: `p-${Date.now()}`,
          memberId: selectedMember.id,
          type: "membership",
          name: productName,
          status: status,
          startDate: startDate,
          endDate: endDateStr,
          purchaseDate: purchaseDate,
          pausable: true,
          pauseHistory: []
        };

        setProducts([...products, newProduct]);
        toast.success(
          <div>
            <p className="font-semibold">{productName} 구매 완료!</p>
            <p className="text-sm">현재 멤버십({activeMembership.name})이 종료되는 {startDate}부터 시작됩니다.</p>
          </div>
        );
      } else {
        // 기존 멤버십이 없거나 만료됨 - 즉시 시작
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + parseInt(duration));
        const endDateStr = endDate.toISOString().split("T")[0];

        const newProduct: Product = {
          id: `p-${Date.now()}`,
          memberId: selectedMember.id,
          type: "membership",
          name: productName,
          status: "active",
          startDate: startDate,
          endDate: endDateStr,
          purchaseDate: purchaseDate,
          pausable: true,
          pauseHistory: []
        };

        setProducts([...products, newProduct]);
        toast.success(`${productName} 구매 완료! 즉시 시작됩니다.`);
      }
    } else {
      // PT 상품
      if (!productName || !sessions) {
        toast.error("PT 이름과 횟수를 입력해주세요.");
        return;
      }

      const activePT = getActivePTProduct(selectedMember.id);
      const purchaseDate = new Date().toISOString().split("T")[0];
      let startDate = purchaseDate;
      let status: "active" | "pending" = "active";

      if (activePT && activePT.remainingSessions! > 0) {
        // 기존 PT가 아직 남아있음 - 새 상품을 대기 상태로
        status = "pending";
        
        const newProduct: Product = {
          id: `p-${Date.now()}`,
          memberId: selectedMember.id,
          type: "pt",
          name: productName,
          status: status,
          startDate: "TBD", // 기존 PT가 모두 소진되면 시작
          totalSessions: parseInt(sessions),
          usedSessions: 0,
          remainingSessions: parseInt(sessions),
          purchaseDate: purchaseDate,
          pausable: true,
          pauseHistory: []
        };

        setProducts([...products, newProduct]);
        toast.success(
          <div>
            <p className="font-semibold">{productName} 구매 완료!</p>
            <p className="text-sm">현재 PT({activePT.name}, 잔여 {activePT.remainingSessions}회)가 모두 소진되면 자동으로 시작됩니다.</p>
          </div>
        );
      } else {
        // 기존 PT가 없거나 모두 소진됨 - 즉시 시작
        const newProduct: Product = {
          id: `p-${Date.now()}`,
          memberId: selectedMember.id,
          type: "pt",
          name: productName,
          status: "active",
          startDate: startDate,
          totalSessions: parseInt(sessions),
          usedSessions: 0,
          remainingSessions: parseInt(sessions),
          purchaseDate: purchaseDate,
          pausable: true,
          pauseHistory: []
        };

        setProducts([...products, newProduct]);
        toast.success(`${productName} 구매 완료! 즉시 시작됩니다.`);
      }
    }

    setIsPurchaseDialogOpen(false);
    setProductName("");
    setDuration("1");
    setSessions("10");
  };

  const handleOpenPurchase = (member: any) => {
    setSelectedMember(member);
    setIsPurchaseDialogOpen(true);
  };

  const handleOpenPauseDialog = (product: Product) => {
    setSelectedProduct(product);
    setPauseStartDate(new Date().toISOString().split("T")[0]);
    setPauseEndDate("");
    setPauseReason("");
    setIsPauseDialogOpen(true);
  };

  const handlePauseProduct = () => {
    if (!selectedProduct || !pauseStartDate || !pauseEndDate) {
      toast.error("정지 시작일과 종료일을 입력해주세요.");
      return;
    }

    const start = new Date(pauseStartDate);
    const end = new Date(pauseEndDate);
    const pauseDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (pauseDays <= 0) {
      toast.error("정지 종료일은 시작일 이후여야 합니다.");
      return;
    }

    // 새 정지 기록
    const newPauseRecord: PauseRecord = {
      id: `ph-${Date.now()}`,
      startDate: pauseStartDate,
      endDate: pauseEndDate,
      days: pauseDays,
      reason: pauseReason
    };

    // 회원의 모든 상품 업데이트
    setProducts(products.map(p => {
      if (p.memberId !== selectedProduct.memberId) return p;

      // 기간제 상품 (멤버십) - 종료일 연장
      if (p.type === "membership" && p.endDate) {
        const newEndDate = new Date(p.endDate);
        newEndDate.setDate(newEndDate.getDate() + pauseDays);

        return {
          ...p,
          endDate: newEndDate.toISOString().split("T")[0],
          pauseHistory: p.id === selectedProduct.id 
            ? [...(p.pauseHistory || []), newPauseRecord]
            : p.pauseHistory
        };
      }

      // PT 상품은 정지 이력만 기록 (횟수제라 기간 연장 불필요)
      if (p.type === "pt") {
        return {
          ...p,
          pauseHistory: p.id === selectedProduct.id
            ? [...(p.pauseHistory || []), newPauseRecord]
            : p.pauseHistory
        };
      }

      return p;
    }));

    setIsPauseDialogOpen(false);
    
    toast.success(
      <div>
        <p className="font-semibold">{selectedProduct.name} 정지 처리 완료</p>
        <p className="text-sm">
          {selectedProduct.type === "membership" 
            ? `모든 멤버십 종료일이 ${pauseDays}일 연장되었습니다.`
            : `정지 기록이 추가되었습니다. (${pauseDays}일)`
          }
        </p>
      </div>
    );
  };

  const handleViewPauseHistory = (product: Product) => {
    setSelectedProduct(product);
    setIsPauseHistoryOpen(true);
  };

  const handleViewProducts = (member: any) => {
    setSelectedMember(member);
    setIsProductDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    if (status === "active") {
      return (
        <Badge className="bg-green-100 text-green-800 gap-1">
          <CheckCircle className="w-3 h-3" />
          사용 중
        </Badge>
      );
    } else if (status === "pending") {
      return (
        <Badge className="bg-blue-100 text-blue-800 gap-1">
          <Clock className="w-3 h-3" />
          대기 중
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-gray-100 text-gray-800 gap-1">
          <AlertCircle className="w-3 h-3" />
          만료됨
        </Badge>
      );
    }
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">활성 회원 목록</h3>
          <p className="text-sm text-gray-500 mt-1">현재 이용 중인 회원 {mockMembers.length}명</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          회원 추가
        </Button>
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
                  <th className="text-left py-3 px-4 font-medium text-gray-700">남은 기간</th>
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
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        member.remainingDays <= 30 
                          ? "bg-orange-100 text-orange-800" 
                          : "bg-blue-100 text-blue-800"
                      }`}>
                        {member.remainingDays}일
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {member.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-1"
                          onClick={() => handleViewProducts(member)}
                        >
                          <ShoppingCart className="w-3 h-3" />
                          상품
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1">
                          <Edit className="w-3 h-3" />
                          수정
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

      {/* 상품 관리 다이얼로그 */}
      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>상품 관리</DialogTitle>
            <DialogDescription>
              {selectedMember && `${selectedMember.name} (${selectedMember.phone})`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* 상품 구매 버튼 */}
            <div className="flex justify-end">
              <Button 
                onClick={() => {
                  setIsProductDialogOpen(false);
                  handleOpenPurchase(selectedMember);
                }}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                새 상품 구매
              </Button>
            </div>

            {/* 멤버십 섹션 */}
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Badge className="bg-purple-100 text-purple-800">멤버십</Badge>
              </h3>
              <div className="space-y-3">
                {selectedMember && getMemberProducts(selectedMember.id)
                  .filter(p => p.type === "membership")
                  .sort((a, b) => {
                    if (a.status === "active") return -1;
                    if (b.status === "active") return 1;
                    if (a.status === "pending") return -1;
                    if (b.status === "pending") return 1;
                    return 0;
                  })
                  .map(product => (
                    <div 
                      key={product.id}
                      className="border rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{product.name}</h4>
                            {getStatusBadge(product.status)}
                            {product.pausable && (
                              <Badge variant="outline" className="text-xs">
                                정지 가능
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>구매일: {product.purchaseDate}</p>
                            <p>시작일: {product.startDate}</p>
                            <p>종료일: {product.endDate}</p>
                            {product.pauseHistory && product.pauseHistory.length > 0 && (
                              <p className="text-orange-600">
                                총 정지 일수: {product.pauseHistory.reduce((sum, r) => sum + r.days, 0)}일
                              </p>
                            )}
                            {product.status === "pending" && (
                              <div className="mt-2 bg-blue-50 border border-blue-200 rounded p-2">
                                <p className="text-blue-800 text-xs">
                                  💡 현재 멤버십이 종료되면 자동으로 시작됩니다
                                </p>
                              </div>
                            )}
                          </div>
                          {product.pausable && product.status === "active" && (
                            <div className="flex gap-2 mt-3">
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1"
                                onClick={() => handleOpenPauseDialog(product)}
                              >
                                <Pause className="w-3 h-3" />
                                정지
                              </Button>
                              {product.pauseHistory && product.pauseHistory.length > 0 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-1"
                                  onClick={() => handleViewPauseHistory(product)}
                                >
                                  <History className="w-3 h-3" />
                                  정지 이력
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                {selectedMember && getMemberProducts(selectedMember.id).filter(p => p.type === "membership").length === 0 && (
                  <div className="text-center py-8 text-gray-500 border rounded-lg bg-gray-50">
                    <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p>구매한 멤버십이 없습니다</p>
                  </div>
                )}
              </div>
            </div>

            {/* PT 섹션 */}
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Badge className="bg-orange-100 text-orange-800">PT</Badge>
              </h3>
              <div className="space-y-3">
                {selectedMember && getMemberProducts(selectedMember.id)
                  .filter(p => p.type === "pt")
                  .sort((a, b) => {
                    if (a.status === "active") return -1;
                    if (b.status === "active") return 1;
                    if (a.status === "pending") return -1;
                    if (b.status === "pending") return 1;
                    return 0;
                  })
                  .map(product => (
                    <div 
                      key={product.id}
                      className="border rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{product.name}</h4>
                            {getStatusBadge(product.status)}
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>구매일: {product.purchaseDate}</p>
                            <p>시작일: {product.startDate}</p>
                            <p>총 횟수: {product.totalSessions}회</p>
                            <p>사용 횟수: {product.usedSessions}회</p>
                            <p className="font-semibold text-blue-600">
                              잔여 횟수: {product.remainingSessions}회
                            </p>
                            {product.pauseHistory && product.pauseHistory.length > 0 && (
                              <p className="text-orange-600">
                                총 정지 일수: {product.pauseHistory.reduce((sum, r) => sum + r.days, 0)}일
                              </p>
                            )}
                            {product.status === "pending" && (
                              <div className="mt-2 bg-blue-50 border border-blue-200 rounded p-2">
                                <p className="text-blue-800 text-xs">
                                  💡 현재 PT가 모두 소진되면 자동으로 시작됩니다
                                </p>
                              </div>
                            )}
                          </div>
                          {product.pausable && product.status === "active" && (
                            <div className="flex gap-2 mt-3">
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1"
                                onClick={() => handleOpenPauseDialog(product)}
                              >
                                <Pause className="w-3 h-3" />
                                정지
                              </Button>
                              {product.pauseHistory && product.pauseHistory.length > 0 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-1"
                                  onClick={() => handleViewPauseHistory(product)}
                                >
                                  <History className="w-3 h-3" />
                                  정지 이력
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                {selectedMember && getMemberProducts(selectedMember.id).filter(p => p.type === "pt").length === 0 && (
                  <div className="text-center py-8 text-gray-500 border rounded-lg bg-gray-50">
                    <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p>구매한 PT가 없습니다</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 상품 구매 다이얼로그 */}
      <Dialog open={isPurchaseDialogOpen} onOpenChange={setIsPurchaseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 상품 구매</DialogTitle>
            <DialogDescription>
              {selectedMember && `${selectedMember.name} (${selectedMember.phone})`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 상품 타입 선택 */}
            <div>
              <Label>상품 타입</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button
                  variant={productType === "membership" ? "default" : "outline"}
                  onClick={() => setProductType("membership")}
                  className="w-full"
                >
                  멤버십
                </Button>
                <Button
                  variant={productType === "pt" ? "default" : "outline"}
                  onClick={() => setProductType("pt")}
                  className="w-full"
                >
                  PT
                </Button>
              </div>
            </div>

            {/* 상품명 */}
            <div>
              <Label>상품명</Label>
              <Input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder={productType === "membership" ? "예: 6개월권" : "예: PT 10회권"}
                className="mt-2"
              />
            </div>

            {/* 멤버십 기간 또는 PT 횟수 */}
            {productType === "membership" ? (
              <div>
                <Label>기간 (개월)</Label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md mt-2"
                >
                  <option value="1">1개월</option>
                  <option value="3">3개월</option>
                  <option value="6">6개월</option>
                  <option value="12">12개월</option>
                </select>
              </div>
            ) : (
              <div>
                <Label>횟수</Label>
                <select
                  value={sessions}
                  onChange={(e) => setSessions(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md mt-2"
                >
                  <option value="10">10회</option>
                  <option value="20">20회</option>
                  <option value="30">30회</option>
                  <option value="50">50회</option>
                </select>
              </div>
            )}

            {/* 기존 상품 안내 */}
            {selectedMember && productType === "membership" && getActiveMembershipProduct(selectedMember.id) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-900">기존 멤버십이 있습니다</p>
                    <p className="text-xs text-blue-700 mt-1">
                      새 상품은 현재 멤버십({getActiveMembershipProduct(selectedMember.id)!.name}, 종료일: {getActiveMembershipProduct(selectedMember.id)!.endDate})이 끝나는 다음날부터 시작됩니다.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {selectedMember && productType === "pt" && getActivePTProduct(selectedMember.id) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-900">기존 PT가 있습니다</p>
                    <p className="text-xs text-blue-700 mt-1">
                      새 상품은 현재 PT({getActivePTProduct(selectedMember.id)!.name}, 잔여: {getActivePTProduct(selectedMember.id)!.remainingSessions}회)가 모두 소진되면 자동으로 시작됩니다.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={handlePurchaseProduct} className="flex-1 gap-2">
                <ShoppingCart className="w-4 h-4" />
                구매하기
              </Button>
              <Button variant="outline" onClick={() => setIsPurchaseDialogOpen(false)} className="flex-1">
                취소
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 정지 다이얼로그 */}
      <Dialog open={isPauseDialogOpen} onOpenChange={setIsPauseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>상품 정지</DialogTitle>
            <DialogDescription>
              {selectedProduct && `${selectedProduct.name}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 정지 시작일 */}
            <div>
              <Label>정지 시작일</Label>
              <Input
                type="date"
                value={pauseStartDate}
                onChange={(e) => setPauseStartDate(e.target.value)}
                className="mt-2"
              />
            </div>

            {/* 정지 종료일 */}
            <div>
              <Label>정지 종료일</Label>
              <Input
                type="date"
                value={pauseEndDate}
                onChange={(e) => setPauseEndDate(e.target.value)}
                className="mt-2"
              />
            </div>

            {/* 정지 이유 */}
            <div>
              <Label>정지 이유</Label>
              <Input
                value={pauseReason}
                onChange={(e) => setPauseReason(e.target.value)}
                placeholder="예: 휴가, 질병 등"
                className="mt-2"
              />
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={handlePauseProduct} className="flex-1 gap-2">
                <Pause className="w-4 h-4" />
                정지하기
              </Button>
              <Button variant="outline" onClick={() => setIsPauseDialogOpen(false)} className="flex-1">
                취소
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 정지 이력 다이얼로그 */}
      <Dialog open={isPauseHistoryOpen} onOpenChange={setIsPauseHistoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>정지 이력</DialogTitle>
            <DialogDescription>
              {selectedProduct && `${selectedProduct.name}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 정지 이력 목록 */}
            {selectedProduct && selectedProduct.pauseHistory && selectedProduct.pauseHistory.length > 0 ? (
              <div className="space-y-3">
                {selectedProduct.pauseHistory.map((record, index) => (
                  <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">정지 {index + 1}</h4>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>시작일: {record.startDate}</p>
                          <p>종료일: {record.endDate}</p>
                          <p>정지 일수: {record.days}일</p>
                          <p>이유: {record.reason}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 border rounded-lg bg-gray-50">
                <Pause className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>정지 이력이 없습니다</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}