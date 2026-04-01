/**
 * 설정 페이지
 * DB 연결 설정 폼 + 연결 테스트 + SQL 가이드
 */
"use client";

import { useState } from "react";
import {
  Database, Shield, RefreshCw, Bell, Server,
  CheckCircle, XCircle, Loader2,
} from "lucide-react";

export default function SettingsPage() {
  // DB 연결 설정 상태
  const [dbConfig, setDbConfig] = useState({
    host: "",
    port: "1433",
    database: "",
    user: "dentalbi_reader",
    password: "",
    chartType: "hanaro",
  });

  const [testResult, setTestResult] = useState<"idle" | "testing" | "success" | "fail">("idle");

  /** 연결 테스트 핸들러 */
  const handleTest = async () => {
    setTestResult("testing");
    // 실제로는 API 호출: POST /api/connection/test
    setTimeout(() => {
      if (dbConfig.host && dbConfig.database) {
        setTestResult("success");
      } else {
        setTestResult("fail");
      }
    }, 2000);
  };

  /** 설정 카드 컴포넌트 */
  const SettingCard = ({ icon: Icon, title, desc, children }: {
    icon: React.ComponentType<{ size?: number; className?: string }>;
    title: string;
    desc: string;
    children: React.ReactNode;
  }) => (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
          <Icon size={20} className="text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-400">{desc}</p>
        </div>
      </div>
      {children}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* 슬로건 */}
      <div className="text-sm font-medium italic" style={{ color: "#64748B" }}>
        SQL 몰라도 됩니다. 덴비가 다 봅니다.
      </div>
      {/* DB 연결 설정 */}
      <SettingCard icon={Database} title="전자차트 DB 연동" desc="MSSQL 데이터베이스 연결 정보">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">서버 IP</label>
            <input
              type="text"
              value={dbConfig.host}
              onChange={(e) => setDbConfig({ ...dbConfig, host: e.target.value })}
              placeholder="192.168.0.100"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">포트</label>
            <input
              type="text"
              value={dbConfig.port}
              onChange={(e) => setDbConfig({ ...dbConfig, port: e.target.value })}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">데이터베이스명</label>
            <input
              type="text"
              value={dbConfig.database}
              onChange={(e) => setDbConfig({ ...dbConfig, database: e.target.value })}
              placeholder="hanaro"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">전자차트 종류</label>
            <select
              value={dbConfig.chartType}
              onChange={(e) => setDbConfig({ ...dbConfig, chartType: e.target.value })}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="hanaro">하나로 3.0</option>
              <option value="dentweb">덴트웹</option>
              <option value="oneclick">원클릭</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">사용자명 (읽기전용)</label>
            <input
              type="text"
              value={dbConfig.user}
              onChange={(e) => setDbConfig({ ...dbConfig, user: e.target.value })}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
            <input
              type="password"
              value={dbConfig.password}
              onChange={(e) => setDbConfig({ ...dbConfig, password: e.target.value })}
              placeholder="••••••••"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleTest}
            disabled={testResult === "testing"}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {testResult === "testing" ? <Loader2 size={14} className="animate-spin" /> : <Server size={14} />}
            연결 테스트
          </button>
          <button className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
            설정 저장
          </button>
          {testResult === "success" && (
            <span className="text-sm text-emerald-600 flex items-center gap-1"><CheckCircle size={14} />연결 성공!</span>
          )}
          {testResult === "fail" && (
            <span className="text-sm text-red-500 flex items-center gap-1"><XCircle size={14} />연결 실패</span>
          )}
        </div>
      </SettingCard>

      {/* 보안 설정 */}
      <SettingCard icon={Shield} title="보안 설정" desc="환자 데이터 보호 및 접근 권한">
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span>환자 PII 해시 처리</span>
            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">활성화됨</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span>DB 읽기 전용 모드</span>
            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">활성화됨</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span>HTTPS 데이터 전송</span>
            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">활성화됨</span>
          </div>
        </div>
      </SettingCard>

      {/* 동기화 설정 */}
      <SettingCard icon={RefreshCw} title="데이터 동기화" desc="전자차트 DB에서 데이터 수집 스케줄">
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span>동기화 주기</span>
            <select className="text-xs border border-gray-200 rounded px-2 py-1">
              <option>매일 오전 2시</option>
              <option>매일 오전 6시</option>
              <option>6시간마다</option>
              <option>1시간마다</option>
            </select>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span>마지막 동기화</span>
            <span className="text-xs text-gray-500">2026-03-29 02:00:15 KST</span>
          </div>
        </div>
      </SettingCard>

      {/* 알림 설정 */}
      <SettingCard icon={Bell} title="알림 설정" desc="경영 알림 및 AI 인사이트 통지">
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span>긴급 알림 (Lost Patient)</span>
            <input type="checkbox" defaultChecked className="rounded" />
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span>일일 경영 리포트</span>
            <input type="checkbox" defaultChecked className="rounded" />
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span>체어 가동률 저조 알림</span>
            <input type="checkbox" className="rounded" />
          </div>
        </div>
      </SettingCard>

      {/* SQL 가이드 */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-3">📋 SQL 읽기전용 계정 생성 가이드</h3>
        <pre className="bg-gray-900 text-green-400 rounded-lg p-4 text-xs overflow-x-auto">
{`-- 전자차트 서버에서 실행 (MSSQL Management Studio)
CREATE LOGIN dentalbi_reader WITH PASSWORD = 'your_secure_password';
USE [your_database_name];
CREATE USER dentalbi_reader FOR LOGIN dentalbi_reader;
GRANT SELECT ON SCHEMA::dbo TO dentalbi_reader;

-- 주의: INSERT, UPDATE, DELETE 권한은 절대 부여하지 마세요.`}
        </pre>
      </div>
    </div>
  );
}
