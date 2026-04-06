/**
 * 앱 다운로드 랜딩 페이지
 * QR 코드 스캔 후 이 페이지로 이동 → APK 다운로드
 * 인증 불필요 (공개 페이지)
 */
"use client";

import { useState } from "react";
import { Download, Smartphone, Shield, CheckCircle, Phone, Brain, Upload } from "lucide-react";

const DOWNLOAD_URL = "https://github.com/niceverygood/DentalBi/releases/latest/download/dentalbi-recorder.apk";

export default function DownloadPage() {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = () => {
    setDownloading(true);
    window.location.href = DOWNLOAD_URL;
    setTimeout(() => setDownloading(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-lg mx-auto px-6 py-12">
        {/* 헤더 */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
            <Phone className="text-white" size={36} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">덴비 녹음</h1>
          <p className="text-gray-500 text-sm">통화 녹음 자동 업로드 앱</p>
        </div>

        {/* 다운로드 버튼 */}
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-2xl p-5 flex items-center justify-center gap-3 shadow-lg shadow-blue-200 transition-all active:scale-[0.98] mb-8"
        >
          {downloading ? (
            <>
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span className="text-lg font-semibold">다운로드 중...</span>
            </>
          ) : (
            <>
              <Download size={24} />
              <span className="text-lg font-semibold">APK 다운로드</span>
            </>
          )}
        </button>

        {/* 기능 소개 */}
        <div className="space-y-4 mb-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">주요 기능</h2>

          <div className="bg-white rounded-xl p-4 border border-gray-100 flex items-start gap-4">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Phone size={18} className="text-green-600" />
            </div>
            <div>
              <div className="font-semibold text-gray-900 text-sm">통화 자동 감지</div>
              <div className="text-xs text-gray-500 mt-0.5">환자와 통화가 끝나면 녹음 파일을 자동으로 감지합니다</div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100 flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Upload size={18} className="text-blue-600" />
            </div>
            <div>
              <div className="font-semibold text-gray-900 text-sm">자동 업로드</div>
              <div className="text-xs text-gray-500 mt-0.5">녹음 파일이 서버로 자동 업로드되어 별도 작업이 필요 없습니다</div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100 flex items-start gap-4">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Brain size={18} className="text-purple-600" />
            </div>
            <div>
              <div className="font-semibold text-gray-900 text-sm">AI 통화 요약</div>
              <div className="text-xs text-gray-500 mt-0.5">AI가 통화 내용을 자동으로 텍스트 변환 + 요약하여 CRM에 기록합니다</div>
            </div>
          </div>
        </div>

        {/* 설치 가이드 */}
        <div className="bg-amber-50 rounded-xl p-5 border border-amber-100 mb-8">
          <h3 className="font-semibold text-amber-900 text-sm mb-3 flex items-center gap-2">
            <Smartphone size={16} />
            설치 방법
          </h3>
          <ol className="space-y-2 text-xs text-amber-800">
            <li className="flex gap-2">
              <span className="bg-amber-200 text-amber-900 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold">1</span>
              <span>위 버튼을 눌러 APK 파일을 다운로드합니다</span>
            </li>
            <li className="flex gap-2">
              <span className="bg-amber-200 text-amber-900 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold">2</span>
              <span><strong>알 수 없는 출처 허용</strong>: 설정 → 보안 → &quot;출처를 알 수 없는 앱 설치&quot; 허용</span>
            </li>
            <li className="flex gap-2">
              <span className="bg-amber-200 text-amber-900 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold">3</span>
              <span>다운로드된 APK 파일을 열어 설치합니다</span>
            </li>
            <li className="flex gap-2">
              <span className="bg-amber-200 text-amber-900 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold">4</span>
              <span>앱 실행 후 <strong>전화, 저장소, 알림</strong> 권한을 허용합니다</span>
            </li>
            <li className="flex gap-2">
              <span className="bg-amber-200 text-amber-900 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold">5</span>
              <span>덴비 계정으로 로그인하면 자동 업로드가 시작됩니다</span>
            </li>
          </ol>
        </div>

        {/* 보안 안내 */}
        <div className="flex items-start gap-3 text-xs text-gray-400">
          <Shield size={14} className="flex-shrink-0 mt-0.5" />
          <p>녹음 파일은 암호화되어 전송되며, 소속 병원 계정으로만 접근할 수 있습니다. 개인정보는 마스킹 처리됩니다.</p>
        </div>
      </div>
    </div>
  );
}
