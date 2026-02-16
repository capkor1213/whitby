import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Share2, Download, MessageCircle, ChevronDown } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/app/components/ui/dropdown-menu";
import html2canvas from "html2canvas";
import { toast } from "sonner";

interface WorkoutLogShareButtonProps {
  elementId: string; // 캡처할 요소의 ID
  userName?: string;
  selectedDate: string;
}

export function WorkoutLogShareButton({ elementId, userName = "회원", selectedDate }: WorkoutLogShareButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateImage = async () => {
    setIsGenerating(true);
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        toast.error("운동일지를 찾을 수 없습니다.");
        return;
      }

      // html2canvas로 이미지 생성
      const canvas = await html2canvas(element, {
        backgroundColor: "#ffffff",
        scale: 2, // 고해상도
        logging: false,
        useCORS: true,
      });

      const imageUrl = canvas.toDataURL("image/png");
      
      return imageUrl;
    } catch (error) {
      console.error("이미지 생성 오류:", error);
      toast.error("이미지 생성에 실패했습니다.");
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    const imageUrl = await generateImage();
    if (!imageUrl) return;

    // 다운로드
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `운동일지_${userName}_${selectedDate}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("운동일지를 다운로드했습니다.");
  };

  const handleShare = async () => {
    const imageUrl = await generateImage();
    if (!imageUrl) return;

    // 이미지를 Blob으로 변환
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const file = new File([blob], `운동일지_${userName}_${selectedDate}.png`, { type: "image/png" });

    // 웹 공유 API 사용 (모바일 및 일부 데스크톱 브라우저 지원)
    if (navigator.share && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: `${userName}님의 운동일지`,
          text: `${selectedDate} 운동 기록`,
          files: [file],
        });
        toast.success("공유했습니다!");
      } catch (error: any) {
        if (error.name !== "AbortError") {
          console.error("공유 오류:", error);
          toast.error("공유에 실패했습니다.");
        }
      }
    } else {
      // 웹 공유 API 미지원시 다운로드
      toast.info("이 브라우저는 직접 공유를 지원하지 않습니다. 이미지를 다운로드하여 카카오톡으로 전송하세요.");
      const link = document.createElement("a");
      link.href = imageUrl;
      link.download = `운동일지_${userName}_${selectedDate}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleKakaoShare = async () => {
    const imageUrl = await generateImage();
    if (!imageUrl) return;

    // 카카오톡 공유를 위한 가이드 표시
    toast.info(
      <div>
        <p className="font-semibold mb-1">카카오톡 공유 방법:</p>
        <ol className="text-xs space-y-1">
          <li>1. 이미지가 다운로드됩니다</li>
          <li>2. 카카오톡을 열어주세요</li>
          <li>3. 대화방에서 이미지를 첨부하여 전송하세요</li>
        </ol>
      </div>,
      { duration: 5000 }
    );

    // 이미지 다운로드
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `운동일지_${userName}_${selectedDate}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          disabled={isGenerating}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Share2 className="w-4 h-4" />
          {isGenerating ? "생성 중..." : "공유하기"}
          <ChevronDown className="w-3 h-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={handleShare} className="cursor-pointer">
          <Share2 className="w-4 h-4 mr-2" />
          직접 공유
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleKakaoShare} className="cursor-pointer">
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3z"/>
          </svg>
          카카오톡으로 공유
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDownload} className="cursor-pointer">
          <Download className="w-4 h-4 mr-2" />
          이미지 다운로드
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}