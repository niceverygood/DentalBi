/**
 * 페이지 콘텐츠 래퍼
 * 스크롤 + 패딩을 담당하는 main 영역
 */
interface PageContainerProps {
  children: React.ReactNode;
}

export default function PageContainer({ children }: PageContainerProps) {
  return (
    <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
      {children}
    </main>
  );
}
