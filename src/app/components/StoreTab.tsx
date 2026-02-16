import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Separator } from "@/app/components/ui/separator";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/app/components/ui/dialog";
import { Textarea } from "@/app/components/ui/textarea";
import { ShoppingCart, Building2, Dumbbell, Crown, Check, MapPin, Search, Filter, User, Calendar, MessageSquare, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface StoreTabProps {
  accessToken: string;
  supabaseUrl: string;
  publicAnonKey: string;
}

interface CenterProduct {
  id: string;
  centerName: string;
  productName: string;
  price: number;
  duration: number;
  description: string;
}

interface CoachProduct {
  id: string;
  coachName: string;
  productName: string;
  price: number;
  sessions: number;
  description: string;
}

interface Center {
  id: string;
  name: string;
  email: string;
  businessNumber: string;
  ownerName: string;
  logo: string;
  introduction: string;
  address?: string;
  distance?: number;
}

interface Coach {
  id: string;
  name: string;
  email: string;
  certification: string;
  specialty: string;
  profileImage: string;
  careerHistory: string;
  message: string;
  gender?: string;
  location?: string;
}

interface PurchasedCenterMembership {
  id: string;
  centerName: string;
  membershipName: string;
  duration: number;
  startDate: string;
  endDate: string;
  price: number;
  note: string;
}

interface PurchasedPTMembership {
  id: string;
  coachId: string;
  coachName: string;
  productName: string;
  totalSessions: number;
  remainingSessions: number;
  price: number;
  note: string;
  purchaseDate: string;
}

interface PTFeedback {
  id: string;
  ptMembershipId: string;
  sessionNumber: number;
  feedback: string;
  createdAt: string;
  coachName: string;
}

interface GXMembershipProduct {
  id: string;
  centerName: string;
  name: string;
  type: "count" | "period" | "unlimited";
  count?: number;
  period?: number;
  price: number;
  description: string;
}

interface PurchasedGXMembership {
  id: string;
  centerName: string;
  name: string;
  type: "count" | "period" | "unlimited";
  count?: number; // 총 횟수
  remainingCount?: number; // 남은 횟수
  period?: number; // 총 기간
  startDate?: string;
  endDate?: string;
  price: number;
  purchaseDate: string;
}

export function StoreTab({ accessToken, supabaseUrl, publicAnonKey }: StoreTabProps) {
  const [selectedMembership, setSelectedMembership] = useState<string | null>(null);
  const [centerProducts, setCenterProducts] = useState<CenterProduct[]>([]);
  const [coachProducts, setCoachProducts] = useState<CoachProduct[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [filteredCoaches, setFilteredCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 구매한 멤버십 정보
  const [purchasedCenterMemberships, setPurchasedCenterMemberships] = useState<PurchasedCenterMembership[]>([]);
  const [purchasedPTMemberships, setPurchasedPTMemberships] = useState<PurchasedPTMembership[]>([]);
  const [ptFeedbacks, setPtFeedbacks] = useState<{ [key: string]: PTFeedback[] }>({});
  const [purchasedGXMemberships, setPurchasedGXMemberships] = useState<PurchasedGXMembership[]>([]);
  
  // 센터 찾기 상태
  const [showCenterSearch, setShowCenterSearch] = useState(false);
  const [userLocation, setUserLocation] = useState("");
  
  // 코치 찾기 상태
  const [showCoachSearch, setShowCoachSearch] = useState(false);
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("");

  // 피드백 보기 다이얼로그
  const [selectedPTForFeedback, setSelectedPTForFeedback] = useState<PurchasedPTMembership | null>(null);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);

  useEffect(() => {
    loadProducts();
    loadCenters();
    loadCoaches();
    loadPurchasedMemberships();
  }, []);

  useEffect(() => {
    filterCoaches();
  }, [genderFilter, locationFilter, coaches]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      
      const centerResponse = await fetch(
        `${supabaseUrl}/functions/v1/make-server-2c29cd73/center-products`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );
      
      if (centerResponse.ok) {
        const centerData = await centerResponse.json();
        setCenterProducts(centerData);
      }

      const coachResponse = await fetch(
        `${supabaseUrl}/functions/v1/make-server-2c29cd73/coach-products`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );
      
      if (coachResponse.ok) {
        const coachData = await coachResponse.json();
        setCoachProducts(coachData);
      }
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCenters = async () => {
    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/make-server-2c29cd73/centers`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setCenters(data.centers || []);
      }
    } catch (error) {
      console.error("Error loading centers:", error);
    }
  };

  const loadCoaches = async () => {
    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/make-server-2c29cd73/coaches`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setCoaches(data.coaches || []);
        setFilteredCoaches(data.coaches || []);
      }
    } catch (error) {
      console.error("Error loading coaches:", error);
    }
  };

  const loadPurchasedMemberships = async () => {
    try {
      // Load purchased center memberships
      const centerResponse = await fetch(
        `${supabaseUrl}/functions/v1/make-server-2c29cd73/my-center-memberships`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      
      if (centerResponse.ok) {
        const centerData = await centerResponse.json();
        setPurchasedCenterMemberships(centerData.memberships || []);
      }

      // Load purchased PT memberships
      const ptResponse = await fetch(
        `${supabaseUrl}/functions/v1/make-server-2c29cd73/my-pt-memberships`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      
      if (ptResponse.ok) {
        const ptData = await ptResponse.json();
        setPurchasedPTMemberships(ptData.memberships || []);

        // Load feedbacks for each PT membership
        const feedbacksMap: { [key: string]: PTFeedback[] } = {};
        for (const membership of ptData.memberships || []) {
          const feedbackResponse = await fetch(
            `${supabaseUrl}/functions/v1/make-server-2c29cd73/pt-feedbacks/${membership.id}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );
          
          if (feedbackResponse.ok) {
            const feedbackData = await feedbackResponse.json();
            feedbacksMap[membership.id] = feedbackData.feedbacks || [];
          }
        }
        setPtFeedbacks(feedbacksMap);
      }

      // Load purchased GX memberships
      const gxResponse = await fetch(
        `${supabaseUrl}/functions/v1/make-server-2c29cd73/my-gx-memberships`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      
      if (gxResponse.ok) {
        const gxData = await gxResponse.json();
        setPurchasedGXMemberships(gxData.memberships || []);
      }
    } catch (error) {
      console.error("Error loading purchased memberships:", error);
    }
  };

  const filterCoaches = () => {
    let filtered = [...coaches];

    if (genderFilter !== "all") {
      filtered = filtered.filter(coach => coach.gender === genderFilter);
    }

    if (locationFilter) {
      filtered = filtered.filter(coach => 
        coach.location?.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    setFilteredCoaches(filtered);
  };

  const handlePurchaseWhitbyMembership = async (plan: any) => {
    toast.success(`${plan.name} 구매가 완료되었습니다!`);
  };

  const handlePurchaseCenterMembership = async (product: CenterProduct) => {
    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/make-server-2c29cd73/purchase-center-membership`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            productId: product.id,
            centerName: product.centerName,
            membershipName: product.productName,
            duration: product.duration,
            price: product.price,
          }),
        }
      );

      if (response.ok) {
        toast.success(`${product.centerName} - ${product.productName} 구매가 완료되었습니다!`);
        loadPurchasedMemberships();
      } else {
        const error = await response.json();
        toast.error(error.error || "구매 실패");
      }
    } catch (error) {
      console.error("Error purchasing center membership:", error);
      toast.error("구매 중 오류가 발생했습니다.");
    }
  };

  const handlePurchasePTMembership = async (product: CoachProduct) => {
    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/make-server-2c29cd73/purchase-pt-membership`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            productId: product.id,
            coachId: product.id.split("_")[2], // Extract coach ID from product ID
            coachName: product.coachName,
            productName: product.productName,
            sessions: product.sessions,
            price: product.price,
          }),
        }
      );

      if (response.ok) {
        toast.success(`${product.coachName} - ${product.productName} 구매가 완료되었습니다!`);
        loadPurchasedMemberships();
      } else {
        const error = await response.json();
        toast.error(error.error || "구매 실패");
      }
    } catch (error) {
      console.error("Error purchasing PT membership:", error);
      toast.error("구매 중 오류가 발생했습니다.");
    }
  };

  const membershipPlans = [
    {
      id: "free",
      name: "무료 체험",
      price: 0,
      duration: "2주",
      popular: false,
    },
    {
      id: "monthly",
      name: "1개월 플랜",
      price: 9900,
      duration: "1개월",
      popular: false,
    },
    {
      id: "half-year",
      name: "6개월 플랜",
      price: 49900,
      duration: "6개월",
      popular: true,
      discount: "16% 할인",
    },
    {
      id: "yearly",
      name: "1년 플랜",
      price: 89900,
      duration: "1년",
      popular: false,
      discount: "24% 할인",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">스토어</h2>
        <p className="text-gray-500 mt-2">위트비의 다양한 멤버십과 서비스를 구매하세요</p>
      </div>

      {/* 위트비 멤버십 섹션 */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Crown className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">위트비 멤버십</h3>
            <p className="text-sm text-gray-500">프리미엄 운동 관리 서비스</p>
          </div>
        </div>

        <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900">주간 운동 계획</p>
                  <p className="text-xs text-gray-600">자동 생성</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900">영양 섭취량</p>
                  <p className="text-xs text-gray-600">맞춤 추천</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900">진행도 분석</p>
                  <p className="text-xs text-gray-600">상세 리포트</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900">AI 피드백</p>
                  <p className="text-xs text-gray-600">실시간 코칭</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {membershipPlans.map((plan) => (
            <Card 
              key={plan.id}
              className={`relative cursor-pointer transition-all hover:shadow-lg ${
                selectedMembership === plan.id ? 'ring-2 ring-blue-600' : ''
              } ${plan.popular ? 'border-blue-600' : ''}`}
              onClick={() => setSelectedMembership(plan.id)}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-blue-600">인기</Badge>
                </div>
              )}
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-gray-900">
                    {plan.price === 0 ? '무료' : `₩${plan.price.toLocaleString()}`}
                  </span>
                  <p className="text-sm text-gray-500 mt-1">{plan.duration}</p>
                  {plan.discount && (
                    <Badge variant="outline" className="mt-2 border-blue-600 text-blue-600">
                      {plan.discount}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePurchaseWhitbyMembership(plan);
                  }}
                >
                  선택하기
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      {/* 센터 멤버십 섹션 */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Building2 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">센터 멤버십</h3>
              <p className="text-sm text-gray-500">제휴 헬스장 이용권</p>
            </div>
          </div>
          <Button 
            onClick={() => setShowCenterSearch(!showCenterSearch)}
            className="bg-green-600 hover:bg-green-700"
          >
            <MapPin className="w-4 h-4 mr-2" />
            제일 가까운 센터 찾기
          </Button>
        </div>

        {/* 구매한 센터 멤버십 표시 */}
        {purchasedCenterMemberships.length > 0 && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">내 센터 멤버십</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {purchasedCenterMemberships.map((membership) => (
                <Card key={membership.id} className="border-green-200">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                          {membership.centerName}
                        </CardTitle>
                        <CardDescription className="mt-1">{membership.membershipName}</CardDescription>
                      </div>
                      <Badge className="bg-green-600">{membership.duration}개월</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">
                        {new Date(membership.startDate).toLocaleDateString()} ~ {new Date(membership.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    {membership.note && (
                      <p className="text-sm text-gray-600">
                        <strong>비고:</strong> {membership.note}
                      </p>
                    )}
                    <p className="text-lg font-bold text-gray-900">
                      ₩{membership.price.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {showCenterSearch && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">센터 검색</CardTitle>
              <CardDescription>내 위치에서 가까운 제휴 센터를 찾아보세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="location">내 위치</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="location"
                    placeholder="예: 강남구, 서울시 강남구 등"
                    value={userLocation}
                    onChange={(e) => setUserLocation(e.target.value)}
                  />
                  <Button variant="outline">
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {centers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {centers.map((center) => (
                    <Card key={center.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            {center.logo ? (
                              <img src={center.logo} alt={center.name} className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <Building2 className="w-8 h-8 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{center.name}</h4>
                            <p className="text-sm text-gray-500 mt-1">{center.introduction || "제휴 센터"}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">{center.address || "위치 정보 없음"}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">등록된 센터가 없습니다.</p>
              )}
            </CardContent>
          </Card>
        )}

        {loading ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              로딩 중...
            </CardContent>
          </Card>
        ) : centerProducts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              현재 등록된 센터 멤버십이 없습니다.
            </CardContent>
          </Card>
        ) : (
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">구매 가능한 센터 멤버십</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {centerProducts.map((product) => (
                <Card key={product.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{product.centerName}</CardTitle>
                        <CardDescription className="mt-1">{product.productName}</CardDescription>
                      </div>
                      <Badge variant="outline" className="border-green-600 text-green-600">
                        {product.duration}개월
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600">{product.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-gray-900">
                        ₩{product.price.toLocaleString()}
                      </span>
                    </div>
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => handlePurchaseCenterMembership(product)}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      구매하기
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </section>

      <Separator />

      {/* PT 멤버십 섹션 */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Dumbbell className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">PT 멤버십</h3>
              <p className="text-sm text-gray-500">전문 코치의 1:1 트레이닝</p>
            </div>
          </div>
          <Button 
            onClick={() => setShowCoachSearch(!showCoachSearch)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Search className="w-4 h-4 mr-2" />
            코치 찾기
          </Button>
        </div>

        {/* 구매한 PT 멤버십 표시 */}
        {purchasedPTMemberships.length > 0 && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">내 PT 멤버십</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {purchasedPTMemberships.map((membership) => (
                <Card key={membership.id} className="border-purple-200">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-purple-600" />
                          {membership.coachName}
                        </CardTitle>
                        <CardDescription className="mt-1">{membership.productName}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">총 횟수</p>
                        <p className="text-lg font-bold text-gray-900">{membership.totalSessions}회</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">남은 횟수</p>
                        <p className="text-lg font-bold text-purple-600">{membership.remainingSessions}회</p>
                      </div>
                    </div>
                    {membership.note && (
                      <p className="text-sm text-gray-600">
                        <strong>비고:</strong> {membership.note}
                      </p>
                    )}
                    <p className="text-lg font-bold text-gray-900">
                      ₩{membership.price.toLocaleString()}
                    </p>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        setSelectedPTForFeedback(membership);
                        setShowFeedbackDialog(true);
                      }}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      피드백 보기
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {showCoachSearch && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="w-5 h-5" />
                코치 필터
              </CardTitle>
              <CardDescription>원하는 조건으로 코치를 찾아보세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="gender">성별</Label>
                  <Select value={genderFilter} onValueChange={setGenderFilter}>
                    <SelectTrigger id="gender" className="mt-2">
                      <SelectValue placeholder="성별 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="male">남성</SelectItem>
                      <SelectItem value="female">여성</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="coach-location">위치</Label>
                  <Input
                    id="coach-location"
                    placeholder="예: 강남구, 서초구 등"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="mt-2"
                  />
                </div>
              </div>

              {filteredCoaches.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
                  {filteredCoaches.map((coach) => (
                    <Card key={coach.id} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="pt-6 text-center">
                        <Avatar className="w-20 h-20 mx-auto mb-3">
                          <AvatarImage src={coach.profileImage} alt={coach.name} />
                          <AvatarFallback className="bg-purple-100 text-purple-600">
                            <User className="w-10 h-10" />
                          </AvatarFallback>
                        </Avatar>
                        <h4 className="font-semibold text-gray-900">{coach.name}</h4>
                        <p className="text-sm text-gray-500 mt-1">{coach.specialty || "전문 코치"}</p>
                        {coach.certification && (
                          <Badge variant="outline" className="mt-2 text-xs">
                            {coach.certification}
                          </Badge>
                        )}
                        <Button 
                          size="sm" 
                          className="w-full mt-3 bg-purple-600 hover:bg-purple-700"
                          onClick={() => toast.success(`${coach.name} 코치 프로필 보기`)}
                        >
                          프로필 보기
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">조건에 맞는 코치가 없습니다.</p>
              )}
            </CardContent>
          </Card>
        )}

        {loading ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              로딩 중...
            </CardContent>
          </Card>
        ) : coachProducts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              현재 등록된 PT 상품이 없습니다.
            </CardContent>
          </Card>
        ) : (
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">구매 가능한 PT 멤버십</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {coachProducts.map((product) => (
                <Card key={product.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{product.coachName}</CardTitle>
                        <CardDescription className="mt-1">{product.productName}</CardDescription>
                      </div>
                      <Badge variant="outline" className="border-purple-600 text-purple-600">
                        {product.sessions}회
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600">{product.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-gray-900">
                        ₩{product.price.toLocaleString()}
                      </span>
                    </div>
                    <Button 
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      onClick={() => handlePurchasePTMembership(product)}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      구매하기
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* PT 피드백 다이얼로그 */}
      <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-600" />
              세션별 피드백
            </DialogTitle>
            <DialogDescription>
              {selectedPTForFeedback?.coachName} 코치님의 피드백
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {selectedPTForFeedback && ptFeedbacks[selectedPTForFeedback.id]?.length > 0 ? (
              ptFeedbacks[selectedPTForFeedback.id].map((feedback) => (
                <Card key={feedback.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        세션 {feedback.sessionNumber}
                      </CardTitle>
                      <Badge variant="outline">
                        {new Date(feedback.createdAt).toLocaleDateString()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 whitespace-pre-wrap">{feedback.feedback}</p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  아직 작성된 피드백이 없습니다.
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 추가 안내 */}
      <Card className="bg-gray-50 border-dashed">
        <CardContent className="pt-6">
          <div className="text-center text-sm text-gray-600">
            <p className="mb-2">💡 <strong>Tip:</strong> 위트비 멤버십과 센터 멤버십을 함께 구매하면 10% 할인!</p>
            <p>궁금한 점이 있으시면 <a href="#" className="text-blue-600 hover:underline">고객센터</a>로 문의해주세요.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}