import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Plus, Edit, Trash2 } from "lucide-react";

interface CenterProductsTabProps {
  accessToken: string;
  supabaseUrl: string;
  publicAnonKey: string;
}

export function CenterProductsTab({ accessToken, supabaseUrl, publicAnonKey }: CenterProductsTabProps) {
  const products = [
    { id: 1, name: "1개월 회원권", price: 120000, duration: "1개월", type: "회원권" },
    { id: 2, name: "3개월 회원권", price: 330000, duration: "3개월", type: "회원권" },
    { id: 3, name: "6개월 회원권", price: 600000, duration: "6개월", type: "회원권" },
    { id: 4, name: "PT 10회권", price: 500000, duration: "3개월", type: "PT" },
    { id: 5, name: "PT 20회권", price: 950000, duration: "6개월", type: "PT" },
  ];

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">상품 관리</h2>
          <p className="text-gray-500 mt-2">회원권 및 PT 상품을 관리합니다</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          상품 추가
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 상품 목록 */}
        <Card>
          <CardHeader>
            <CardTitle>등록된 상품</CardTitle>
            <CardDescription>현재 판매 중인 상품 목록</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {products.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-500">
                      {product.type} · {product.duration} · ₩{product.price.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 새 상품 추가 */}
        <Card>
          <CardHeader>
            <CardTitle>새 상품 추가</CardTitle>
            <CardDescription>새로운 상품을 등록합니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product-name">상품명 *</Label>
              <Input
                id="product-name"
                placeholder="예: 1개월 회원권"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-type">상품 유형 *</Label>
              <select
                id="product-type"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="membership">회원권</option>
                <option value="pt">PT</option>
                <option value="locker">락커</option>
                <option value="other">기타</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-price">가격 (원) *</Label>
              <Input
                id="product-price"
                type="number"
                placeholder="120000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-duration">유효 기간 *</Label>
              <select
                id="product-duration"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="1month">1개월</option>
                <option value="3months">3개월</option>
                <option value="6months">6개월</option>
                <option value="12months">12개월</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-description">설명 (선택)</Label>
              <Input
                id="product-description"
                placeholder="상품에 대한 간단한 설명"
              />
            </div>

            <Button className="w-full gap-2">
              <Plus className="w-4 h-4" />
              상품 등록
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
