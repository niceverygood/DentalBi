/**
 * QR 코드 인쇄 페이지
 * 치과 데스크에 비치할 QR 코드 출력용
 * /download/qr 접속 → 인쇄 버튼 → 출력
 */
"use client";

import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Printer, Phone } from "lucide-react";

const DOWNLOAD_PAGE_URL = "https://dentalbi.kr/download";

export default function QRPrintPage() {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 인쇄 버튼 (인쇄 시 숨김) */}
      <div className="print:hidden flex items-center justify-center gap-4 py-6">
        <button
          onClick={handlePrint}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg"
        >
          <Printer size={20} />
          <span className="font-semibold">QR 코드 인쇄</span>
        </button>
        <p className="text-sm text-gray-500">데스크에 비치할 QR 코드를 인쇄합니다</p>
      </div>

      {/* 인쇄 영역 */}
      <div ref={printRef} className="flex items-center justify-center print:mt-0">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-sm w-full mx-4 print:shadow-none print:rounded-none print:max-w-none print:p-16">
          {/* 로고 */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Phone className="text-white" size={28} />
            </div>
            <h1 className="text-xl font-bold text-gray-900">덴비 녹음 앱</h1>
            <p className="text-sm text-gray-500 mt-1">통화 녹음 자동 업로드</p>
          </div>

          {/* QR 코드 */}
          <div className="flex justify-center mb-6">
            <div className="bg-white p-4 rounded-2xl border-2 border-gray-100">
              <QRCodeSVG
                value={DOWNLOAD_PAGE_URL}
                size={200}
                level="H"
                includeMargin={false}
                fgColor="#1A56DB"
              />
            </div>
          </div>

          {/* 안내 */}
          <div className="text-center space-y-2">
            <p className="text-sm font-semibold text-gray-800">
              QR 코드를 스캔하여 앱을 설치하세요
            </p>
            <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                자동 녹음 감지
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                AI 통화 요약
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                CRM 자동 기록
              </span>
            </div>
          </div>

          {/* 하단 URL */}
          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <p className="text-[11px] text-gray-400">dentalbi.kr/download</p>
          </div>
        </div>
      </div>

      {/* 인쇄 전용 스타일 */}
      <style jsx global>{`
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:rounded-none { border-radius: 0 !important; }
          .print\\:mt-0 { margin-top: 0 !important; }
          .print\\:max-w-none { max-width: none !important; }
          .print\\:p-16 { padding: 4rem !important; }
          @page { margin: 2cm; }
        }
      `}</style>
    </div>
  );
}
