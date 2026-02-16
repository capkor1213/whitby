import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Badge } from "@/app/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/app/components/ui/dialog";
import { Plus, Edit2, Trash2, Image as ImageIcon, DollarSign, Dumbbell } from "lucide-react";
import { toast } from "sonner";

interface CoachPTProductsTabProps {
  accessToken: string;
  supabaseUrl: string;
  publicAnonKey: string;
  coachId: string;
  coachName: string;
}

interface PTProduct {
  id: string;
  coachId: string;
  coachName: string;
  productName: string;
  price: number;
  sessions: number;
  description: string;
  imageUrl?: string;
  createdAt: string;
}

export function CoachPTProductsTab({ 
  accessToken, 
  supabaseUrl, 
  publicAnonKey,
  coachId,
  coachName
}: CoachPTProductsTabProps) {
  const [products, setProducts] = useState<PTProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  // Form state
  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState("");
  const [sessions, setSessions] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${supabaseUrl}/functions/v1/make-server-2c29cd73/my-coach-products`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async () => {
    if (!productName || !price || !sessions) {
      toast.error("상품명, 가격, 세션 수는 필수입니다.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/make-server-2c29cd73/coach-products`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            productName,
            price: parseFloat(price),
            sessions: parseInt(sessions),
            description,
            imageUrl: imageUrl || undefined,
          }),
        }
      );

      if (response.ok) {
        toast.success("PT 상품이 등록되었습니다!");
        setShowCreateDialog(false);
        resetForm();
        loadProducts();
      } else {
        const error = await response.json();
        toast.error(error.error || "상품 등록에 실패했습니다.");
      }
    } catch (error) {
      console.error("Error creating product:", error);
      toast.error("상품 등록 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("정말로 이 상품을 삭제하시겠습니까?")) {
      return;
    }

    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/make-server-2c29cd73/coach-products/${productId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        toast.success("상품이 삭제되었습니다.");
        loadProducts();
      } else {
        toast.error("상품 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("상품 삭제 중 오류가 발생했습니다.");
    }
  };

  const resetForm = () => {
    setProductName("");
    setPrice("");
    setSessions("");
    setDescription("");
    setImageUrl("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">PT 상품 관리</h2>
          <p className="text-gray-500 mt-1">PT 상품을 등록하고 관리하세요</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              새 상품 등록
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>새 PT 상품 등록</DialogTitle>
              <DialogDescription>
                회원들이 구매할 수 있는 PT 상품을 등록하세요
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="product-name">상품명 *</Label>
                <Input
                  id="product-name"
                  placeholder="예: 10회 PT 패키지"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">가격 (원) *</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="500000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sessions">세션 수 *</Label>
                  <Input
                    id="sessions"
                    type="number"
                    placeholder="10"
                    value={sessions}
                    onChange={(e) => setSessions(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="image-url">상품 이미지 URL</Label>
                <Input
                  id="image-url"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">상품 소개</Label>
                <Textarea
                  id="description"
                  placeholder="이 PT 상품의 특징과 장점을 설명해주세요..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false);
                  resetForm();
                }}
              >
                취소
              </Button>
              <Button onClick={handleCreateProduct} disabled={isSaving}>
                {isSaving ? "등록 중..." : "상품 등록"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            로딩 중...
          </CardContent>
        </Card>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Dumbbell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">등록된 PT 상품이 없습니다.</p>
            <p className="text-sm text-gray-400 mb-4">첫 번째 PT 상품을 등록해보세요!</p>
            <Button onClick={() => setShowCreateDialog(true)} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              상품 등록하기
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              {product.imageUrl && (
                <div className="h-48 bg-gray-100 overflow-hidden">
                  <img
                    src={product.imageUrl}
                    alt={product.productName}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{product.productName}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="border-purple-600 text-purple-600">
                        {product.sessions}회
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toast.info("수정 기능은 준비 중입니다.")}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteProduct(product.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {product.description && (
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {product.description}
                  </p>
                )}
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-xs text-gray-500">가격</span>
                  <span className="text-xl font-bold text-purple-600">
                    ₩{product.price.toLocaleString()}
                  </span>
                </div>
                <div className="text-xs text-gray-400">
                  등록일: {new Date(product.createdAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
