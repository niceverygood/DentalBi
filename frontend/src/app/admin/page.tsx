/**
 * 관리자 페이지 — 팀 계정 관리 (Google Workspace 스타일)
 * 
 * 구독 결제 계정 = 병원 Owner (총괄 관리자)
 * Owner가 티어별 한도 내에서 의사/스태프 계정 생성·관리
 * 
 * 동시 로그인 방지:
 * - 1계정 1세션 (새 로그인 시 이전 세션 강제 만료)
 * - 마지막 접속 IP/기기 추적
 * - 비정상 접근 시 알림
 */
"use client";

import { useState, useMemo } from "react";
import {
  ShieldCheck, UserPlus, Users, Building2, Stethoscope,
  MoreVertical, Mail, Phone, Key, UserX, UserCheck,
  Pencil, X, Check, Search, Crown, AlertTriangle,
  Monitor, Smartphone, Globe, Copy, Eye, EyeOff,
  Shield, Lock, Zap,
} from "lucide-react";
import KPICard from "@/components/ui/KPICard";
import { SUBSCRIPTION_PLANS } from "@/lib/plans";
import type { StaffMember } from "@/types";

// ═══════════════════════════════════════
// 현재 병원 데모 데이터
// ═══════════════════════════════════════
const CURRENT_PLAN = SUBSCRIPTION_PLANS.find(p => p.id === "professional")!;

const DEMO_CLINIC = {
  id: 1,
  name: "아나플란트치과",
  ehrType: "hanaro",
  address: "서울시 강남구 역삼동 123-45",
  phone: "02-1234-5678",
  chairCount: 5,
  plan: "professional" as const,
  planExpires: "2026-06-01",
};

const DEMO_STAFF: StaffMember[] = [
  { id: 1, email: "kim@clinic.com", name: "김원장", role: "owner", position: "대표원장", specialty: "보철과", phone: "010-1234-5678", isDoctor: true, isActive: true, licenseNumber: "12345", clinicId: 1, createdAt: "2025-01-15", lastLogin: "2026-03-29 09:30" },
  { id: 2, email: "lee@clinic.com", name: "이원장", role: "admin", position: "부원장", specialty: "교정과", phone: "010-2345-6789", isDoctor: true, isActive: true, licenseNumber: "23456", clinicId: 1, createdAt: "2025-03-01", lastLogin: "2026-03-28 18:00" },
  { id: 3, email: "park@clinic.com", name: "박원장", role: "viewer", position: "진료원장", specialty: "구강외과", phone: "010-3456-7890", isDoctor: true, isActive: true, licenseNumber: "34567", clinicId: 1, createdAt: "2025-06-15", lastLogin: "2026-03-29 08:15" },
  { id: 4, email: "choi@clinic.com", name: "최원장", role: "viewer", position: "진료원장", specialty: "보존과", phone: "010-4567-8901", isDoctor: true, isActive: true, licenseNumber: "45678", clinicId: 1, createdAt: "2025-09-01", lastLogin: "2026-03-27 17:45" },
  { id: 5, email: "jung@clinic.com", name: "정원장", role: "viewer", position: "봉직의", specialty: "보철과", phone: "010-5678-9012", isDoctor: true, isActive: true, clinicId: 1, createdAt: "2026-01-10", lastLogin: "2026-03-29 10:00" },
  { id: 6, email: "yoon@clinic.com", name: "윤실장", role: "viewer", position: "스태프", phone: "010-6789-0123", isDoctor: false, isActive: true, clinicId: 1, createdAt: "2025-04-20", lastLogin: "2026-03-29 08:55" },
  { id: 7, email: "han@clinic.com", name: "한위생사", role: "viewer", position: "스태프", phone: "010-7890-1234", isDoctor: false, isActive: false, clinicId: 1, createdAt: "2025-02-01", lastLogin: "2026-02-15 16:30" },
];

// 세션 추적 데모 데이터
interface SessionInfo {
  userId: number;
  device: string;
  browser: string;
  ip: string;
  lastActivity: string;
  isCurrentSession: boolean;
}

const DEMO_SESSIONS: SessionInfo[] = [
  { userId: 1, device: "MacBook Pro", browser: "Chrome 120", ip: "211.104.xxx.xxx", lastActivity: "방금 전", isCurrentSession: true },
  { userId: 2, device: "Windows PC", browser: "Edge 120", ip: "175.213.xxx.xxx", lastActivity: "2시간 전", isCurrentSession: false },
  { userId: 3, device: "iPad Pro", browser: "Safari 17", ip: "211.104.xxx.xxx", lastActivity: "30분 전", isCurrentSession: false },
  { userId: 5, device: "iPhone 15", browser: "Safari 17", ip: "223.38.xxx.xxx", lastActivity: "5분 전", isCurrentSession: false },
];

// ═══════════════════════════════════════
// 상수
// ═══════════════════════════════════════
const POSITION_OPTIONS = ["대표원장", "부원장", "진료원장", "봉직의", "스태프"];
const ROLE_OPTIONS = [
  { value: "owner", label: "Owner", desc: "병원 총괄 관리 (구독 관리자)" },
  { value: "admin", label: "Admin", desc: "직원 관리 + 데이터 접근" },
  { value: "viewer", label: "Viewer", desc: "대시보드 열람만" },
];
const SPECIALTY_OPTIONS = ["보철과", "교정과", "구강외과", "보존과", "치주과", "소아치과", "예방치과", "영상치의학과"];

const ROLE_BADGE: Record<string, string> = {
  superadmin: "bg-red-100 text-red-700 border-red-200",
  owner: "bg-amber-100 text-amber-700 border-amber-200",
  admin: "bg-blue-100 text-blue-700 border-blue-200",
  viewer: "bg-gray-100 text-gray-600 border-gray-200",
};
const ROLE_LABEL: Record<string, string> = {
  superadmin: "SuperAdmin", owner: "Owner", admin: "Admin", viewer: "Viewer",
};

type TabId = "team" | "sessions" | "security";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabId>("team");
  const [staffList, setStaffList] = useState<StaffMember[]>(DEMO_STAFF);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [actionMenuId, setActionMenuId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");
  const [filterType, setFilterType] = useState<"all" | "doctor" | "staff">("all");
  const [showPassword, setShowPassword] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // 신규 직원 폼 상태
  const [newStaff, setNewStaff] = useState({
    name: "", email: "", password: "", role: "viewer",
    position: "진료원장", specialty: "", phone: "", isDoctor: true,
    licenseNumber: "",
  });

  // 수정 폼 상태
  const [editForm, setEditForm] = useState<Partial<StaffMember>>({});

  // ─── 집계 ───
  const activeStaffCount = staffList.filter(s => s.isActive).length;
  const activeDoctors = staffList.filter(s => s.isDoctor && s.isActive).length;
  const activeStaffOnly = staffList.filter(s => !s.isDoctor && s.isActive).length;
  const inactiveCount = staffList.filter(s => !s.isActive).length;

  // 한도 계산
  const staffLimit = CURRENT_PLAN.maxStaff;
  const doctorLimit = CURRENT_PLAN.maxDoctors;
  const canAddMore = activeStaffCount < staffLimit;
  const usagePercent = Math.round((activeStaffCount / staffLimit) * 100);

  // ─── 필터링 ───
  const filteredStaff = useMemo(() => {
    return staffList.filter(s => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!s.name.toLowerCase().includes(q) && !s.email.toLowerCase().includes(q) &&
            !s.position.toLowerCase().includes(q)) return false;
      }
      if (filterActive === "active" && !s.isActive) return false;
      if (filterActive === "inactive" && s.isActive) return false;
      if (filterType === "doctor" && !s.isDoctor) return false;
      if (filterType === "staff" && s.isDoctor) return false;
      return true;
    });
  }, [staffList, searchQuery, filterActive, filterType]);

  // ─── 비밀번호 자동 생성 ───
  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#";
    let pw = "";
    for (let i = 0; i < 10; i++) pw += chars[Math.floor(Math.random() * chars.length)];
    setNewStaff({ ...newStaff, password: pw });
  };

  // ─── 핸들러 ───
  const handleAddStaff = () => {
    if (!newStaff.name || !newStaff.email || !newStaff.password) return;
    if (!canAddMore) return;
    const newId = Math.max(...staffList.map(s => s.id), 0) + 1;
    const member: StaffMember = {
      id: newId,
      email: newStaff.email,
      name: newStaff.name,
      role: newStaff.role as "owner" | "admin" | "viewer",
      position: newStaff.position,
      specialty: newStaff.specialty || undefined,
      phone: newStaff.phone || undefined,
      isDoctor: newStaff.isDoctor,
      isActive: true,
      licenseNumber: newStaff.licenseNumber || undefined,
      clinicId: 1,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setStaffList([...staffList, member]);
    setShowAddForm(false);
    setNewStaff({ name: "", email: "", password: "", role: "viewer", position: "진료원장", specialty: "", phone: "", isDoctor: true, licenseNumber: "" });
  };

  const startEdit = (staff: StaffMember) => {
    setEditingId(staff.id);
    setEditForm({ name: staff.name, role: staff.role, position: staff.position, specialty: staff.specialty, phone: staff.phone });
    setActionMenuId(null);
  };

  const saveEdit = (staffId: number) => {
    setStaffList(prev => prev.map(s => s.id === staffId ? { ...s, ...editForm } as StaffMember : s));
    setEditingId(null);
    setEditForm({});
  };

  const deactivateStaff = (staffId: number) => {
    setStaffList(prev => prev.map(s => s.id === staffId ? { ...s, isActive: false } : s));
    setActionMenuId(null);
  };

  const reactivateStaff = (staffId: number) => {
    if (!canAddMore) return;
    setStaffList(prev => prev.map(s => s.id === staffId ? { ...s, isActive: true } : s));
    setActionMenuId(null);
  };

  const copyCredentials = (email: string, id: number) => {
    navigator.clipboard.writeText(email);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const TABS: { id: TabId; label: string; icon: typeof Shield }[] = [
    { id: "team",     label: "팀 계정 관리", icon: Users },
    { id: "sessions", label: "접속 현황",    icon: Monitor },
    { id: "security", label: "보안 정책",    icon: Shield },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 구독 한도 배너 */}
      <div className={`rounded-2xl p-5 ${usagePercent >= 90
        ? "bg-gradient-to-r from-red-500 to-rose-500"
        : "bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700"
      } text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Crown size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">{DEMO_CLINIC.name}</h2>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                  {CURRENT_PLAN.name}
                </span>
              </div>
              <p className="text-sm opacity-80">
                팀 계정 {activeStaffCount}/{staffLimit}명 사용 중 · 의사 {activeDoctors}/{doctorLimit}명
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-2xl font-bold">{activeStaffCount}/{staffLimit}</div>
                <div className="text-xs opacity-70">계정 사용량</div>
              </div>
              {/* 사용량 게이지 */}
              <div className="w-16 h-16 relative">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="5" />
                  <circle cx="32" cy="32" r="28" fill="none" stroke="white" strokeWidth="5"
                    strokeDasharray={`${usagePercent * 1.76} 176`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold">{usagePercent}%</div>
              </div>
            </div>
          </div>
        </div>
        {usagePercent >= 80 && (
          <div className="mt-3 bg-white/10 rounded-lg px-4 py-2 text-sm flex items-center gap-2">
            <AlertTriangle size={14} />
            {usagePercent >= 100
              ? "계정 한도에 도달했습니다. 플랜을 업그레이드하세요."
              : `계정 ${staffLimit - activeStaffCount}개 남았습니다. 더 많은 계정이 필요하면 플랜을 업그레이드하세요.`}
          </div>
        )}
      </div>

      {/* 탭 */}
      <div className="flex bg-white rounded-xl border border-gray-100 p-1 gap-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === tab.id ? "bg-gray-900 text-white shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <tab.icon size={15} />{tab.label}
          </button>
        ))}
      </div>

      {/* ════════════════════ 팀 계정 관리 탭 ════════════════════ */}
      {activeTab === "team" && (
        <>
          {/* KPI 카드 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard label="전체 계정" value={staffList.length + "명"} sub={`한도 ${staffLimit}명`} icon={Users} color="blue" />
            <KPICard label="활성 의사" value={activeDoctors + "명"} sub={`한도 ${doctorLimit}명`} icon={Stethoscope} color="green" />
            <KPICard label="활성 스태프" value={activeStaffOnly + "명"} icon={Building2} color="purple" />
            <KPICard label="비활성 계정" value={inactiveCount + "명"} sub="퇴사/휴직" icon={UserX} color="red" />
          </div>

          {/* 직원 테이블 */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-blue-600" />
                  <h3 className="font-semibold text-gray-900">팀 계정 관리</h3>
                  <span className="text-xs text-gray-400">({filteredStaff.length}명)</span>
                </div>
                <button
                  onClick={() => { if (canAddMore) { setShowAddForm(!showAddForm); generatePassword(); } }}
                  disabled={!canAddMore}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <UserPlus size={14} />
                  {canAddMore ? "계정 생성" : "한도 초과"}
                </button>
              </div>

              {/* 필터 */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-xs">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="이름, 이메일, 직급 검색..." className="w-full text-sm border border-gray-200 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex bg-gray-100 rounded-lg p-0.5">
                  {([["all", "전체"], ["active", "활성"], ["inactive", "비활성"]] as const).map(([key, label]) => (
                    <button key={key} onClick={() => setFilterActive(key)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filterActive === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
                    >{label}</button>
                  ))}
                </div>
                <div className="flex bg-gray-100 rounded-lg p-0.5">
                  {([["all", "모두"], ["doctor", "의사"], ["staff", "스태프"]] as const).map(([key, label]) => (
                    <button key={key} onClick={() => setFilterType(key)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filterType === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
                    >{label}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* 계정 생성 폼 */}
            {showAddForm && (
              <div className="px-5 py-4 bg-blue-50/50 border-b border-blue-100">
                <div className="flex items-center gap-2 mb-3">
                  <UserPlus size={16} className="text-blue-600" />
                  <h4 className="text-sm font-semibold text-gray-900">새 계정 생성</h4>
                  <span className="text-xs text-gray-400">(잔여 {staffLimit - activeStaffCount}개)</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <input type="text" value={newStaff.name} onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                    placeholder="이름 *" className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input type="email" value={newStaff.email} onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                    placeholder="이메일(로그인 ID) *" className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} value={newStaff.password}
                      onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                      placeholder="초기 비밀번호 *" className="text-sm border border-gray-200 rounded-lg px-3 py-2 pr-16 w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-0.5">
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="p-1 rounded text-gray-400 hover:text-gray-600">
                        {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                      <button type="button" onClick={generatePassword} className="p-1 rounded text-blue-500 hover:text-blue-700" title="자동 생성">
                        <Zap size={13} />
                      </button>
                    </div>
                  </div>
                  <select value={newStaff.position}
                    onChange={(e) => setNewStaff({ ...newStaff, position: e.target.value, isDoctor: e.target.value !== "스태프" })}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {POSITION_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  <select value={newStaff.role} onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label} — {r.desc}</option>)}
                  </select>
                  {newStaff.isDoctor && (
                    <select value={newStaff.specialty} onChange={(e) => setNewStaff({ ...newStaff, specialty: e.target.value })}
                      className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">전공 선택</option>
                      {SPECIALTY_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  )}
                  <input type="text" value={newStaff.phone} onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                    placeholder="연락처" className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                {/* 생성된 계정 정보 미리보기 */}
                {newStaff.email && newStaff.password && (
                  <div className="bg-white rounded-lg border border-blue-200 p-3 mb-3">
                    <p className="text-xs font-medium text-gray-700 mb-2">📋 생성될 계정 정보 (의사에게 전달):</p>
                    <div className="bg-gray-50 rounded p-2 font-mono text-xs space-y-1">
                      <div>로그인 URL: <span className="text-blue-600">https://app.dentalbi.kr/login</span></div>
                      <div>아이디 (이메일): <span className="text-gray-900 font-medium">{newStaff.email}</span></div>
                      <div>비밀번호: <span className="text-gray-900 font-medium">{showPassword ? newStaff.password : "••••••••••"}</span></div>
                      <div className="text-amber-600">⚠️ 첫 로그인 시 비밀번호 변경 필요</div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button onClick={handleAddStaff}
                    disabled={!newStaff.name || !newStaff.email || !newStaff.password}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1">
                    <Check size={14} />계정 생성
                  </button>
                  <button onClick={() => setShowAddForm(false)}
                    className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-1">
                    <X size={14} />취소
                  </button>
                </div>
              </div>
            )}

            {/* 직원 테이블 */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                    <th className="px-4 py-3 text-left">계정</th>
                    <th className="px-4 py-3 text-left">직급</th>
                    <th className="px-4 py-3 text-left">전공</th>
                    <th className="px-4 py-3 text-center">권한</th>
                    <th className="px-4 py-3 text-center">상태</th>
                    <th className="px-4 py-3 text-left">연락처</th>
                    <th className="px-4 py-3 text-left">마지막 접속</th>
                    <th className="px-4 py-3 text-center w-12">액션</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map((staff) => (
                    <tr key={staff.id}
                      className={`border-b border-gray-50 transition-colors ${
                        !staff.isActive ? "bg-gray-50/50 opacity-60" : "hover:bg-blue-50/30"
                      } ${editingId === staff.id ? "bg-blue-50/40" : ""}`}>

                      {/* 계정 정보 */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                            staff.isDoctor ? "bg-blue-500" : "bg-violet-500"
                          } ${!staff.isActive ? "grayscale" : ""}`}>{staff.name[0]}</div>
                          <div>
                            {editingId === staff.id ? (
                              <input type="text" value={editForm.name || ""} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                className="text-sm font-medium border border-blue-300 rounded px-2 py-0.5 w-24 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                            ) : (
                              <div className="font-medium text-gray-900">{staff.name}</div>
                            )}
                            <div className="text-xs text-gray-400 flex items-center gap-1">
                              <Mail size={10} />{staff.email}
                              <button onClick={() => copyCredentials(staff.email, staff.id)}
                                className="ml-1 text-gray-300 hover:text-blue-500" title="이메일 복사">
                                {copiedId === staff.id ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 직급 */}
                      <td className="px-4 py-3">
                        {editingId === staff.id ? (
                          <select value={editForm.position || ""} onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                            className="text-xs border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500">
                            {POSITION_OPTIONS.map(p => <option key={p}>{p}</option>)}
                          </select>
                        ) : (
                          <span className="text-xs font-medium text-gray-700">{staff.position}</span>
                        )}
                      </td>

                      {/* 전공 */}
                      <td className="px-4 py-3">
                        {editingId === staff.id && staff.isDoctor ? (
                          <select value={editForm.specialty || ""} onChange={(e) => setEditForm({ ...editForm, specialty: e.target.value })}
                            className="text-xs border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500">
                            <option value="">미지정</option>
                            {SPECIALTY_OPTIONS.map(s => <option key={s}>{s}</option>)}
                          </select>
                        ) : (
                          <span className="text-xs text-gray-500">{staff.specialty || (staff.isDoctor ? "-" : "")}</span>
                        )}
                      </td>

                      {/* 권한 */}
                      <td className="px-4 py-3 text-center">
                        {editingId === staff.id ? (
                          <select value={editForm.role || ""} onChange={(e) => setEditForm({ ...editForm, role: e.target.value as "owner" | "admin" | "viewer" })}
                            className="text-xs border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500">
                            {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                          </select>
                        ) : (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${ROLE_BADGE[staff.role]}`}>
                            {ROLE_LABEL[staff.role]}
                          </span>
                        )}
                      </td>

                      {/* 상태 */}
                      <td className="px-4 py-3 text-center">
                        {staff.isActive
                          ? <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">활성</span>
                          : <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-200 text-gray-500">비활성</span>
                        }
                      </td>

                      {/* 연락처 */}
                      <td className="px-4 py-3">
                        {editingId === staff.id ? (
                          <input type="text" value={editForm.phone || ""} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                            className="text-xs border border-blue-300 rounded px-2 py-1 w-28 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        ) : (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            {staff.phone && <><Phone size={10} />{staff.phone}</>}
                          </span>
                        )}
                      </td>

                      {/* 마지막 접속 */}
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-400">{staff.lastLogin || "-"}</span>
                      </td>

                      {/* 액션 */}
                      <td className="px-4 py-3 text-center">
                        {editingId === staff.id ? (
                          <div className="flex items-center gap-1 justify-center">
                            <button onClick={() => saveEdit(staff.id)} className="p-1 rounded bg-emerald-100 text-emerald-600 hover:bg-emerald-200"><Check size={14} /></button>
                            <button onClick={() => { setEditingId(null); setEditForm({}); }} className="p-1 rounded bg-gray-100 text-gray-500 hover:bg-gray-200"><X size={14} /></button>
                          </div>
                        ) : (
                          <div className="relative">
                            <button onClick={() => setActionMenuId(actionMenuId === staff.id ? null : staff.id)}
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"><MoreVertical size={14} /></button>
                            {actionMenuId === staff.id && (
                              <div className="absolute right-0 top-8 z-20 bg-white rounded-xl border border-gray-200 shadow-lg w-48 py-1 animate-fade-in">
                                <button onClick={() => startEdit(staff)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"><Pencil size={13} />정보 수정</button>
                                <button onClick={() => { setActionMenuId(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"><Key size={13} />비밀번호 초기화</button>
                                <div className="border-t border-gray-100 my-1" />
                                {staff.isActive ? (
                                  <button onClick={() => deactivateStaff(staff.id)} disabled={staff.role === "owner"}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed">
                                    <UserX size={13} />계정 정지
                                  </button>
                                ) : (
                                  <button onClick={() => reactivateStaff(staff.id)}
                                    disabled={!canAddMore}
                                    className="w-full text-left px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 flex items-center gap-2 disabled:opacity-30">
                                    <UserCheck size={13} />계정 활성화 {!canAddMore && "(한도 초과)"}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 권한 안내 */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100 p-5">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <ShieldCheck size={16} className="text-amber-600" />권한 안내
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {ROLE_OPTIONS.map(r => (
                <div key={r.value} className="bg-white/70 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${ROLE_BADGE[r.value]}`}>{r.label}</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    {r.value === "owner" && "구독 결제 계정. 팀 계정 생성/관리, 병원 설정 변경, 모든 데이터 접근. 한 병원에 1명만 가능."}
                    {r.value === "admin" && "직원 관리 + 데이터 접근. Owner 계정은 수정 불가. 병원 설정 변경 가능."}
                    {r.value === "viewer" && "대시보드 데이터 열람만 가능. 직원 관리 및 설정 변경 불가. 개인 필터만 저장."}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ════════════════════ 접속 현황 탭 ════════════════════ */}
      {activeTab === "sessions" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Monitor size={16} className="text-blue-600" />실시간 접속 현황
              </h3>
              <p className="text-xs text-gray-400 mt-1">현재 로그인된 사용자와 접속 기기 정보</p>
            </div>

            <div className="divide-y divide-gray-50">
              {DEMO_SESSIONS.map((session, i) => {
                const user = staffList.find(s => s.id === session.userId);
                if (!user) return null;
                return (
                  <div key={i} className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                        user.isDoctor ? "bg-blue-500" : "bg-violet-500"
                      }`}>{user.name[0]}</div>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{user.name}</div>
                        <div className="text-xs text-gray-400">{user.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-xs text-gray-500">
                      <div className="flex items-center gap-1.5">
                        {session.device.includes("Phone") || session.device.includes("iPad")
                          ? <Smartphone size={13} className="text-gray-400" />
                          : <Monitor size={13} className="text-gray-400" />
                        }
                        <span>{session.device} · {session.browser}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Globe size={13} className="text-gray-400" />
                        <span>{session.ip}</span>
                      </div>
                      <div className="w-16 text-right">{session.lastActivity}</div>
                      {session.isCurrentSession ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">현재 세션</span>
                      ) : (
                        <button className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 hover:bg-red-200 font-medium">
                          세션 종료
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 접속 로그 */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Lock size={16} className="text-violet-600" />최근 접속 로그
            </h3>
            <div className="space-y-2">
              {[
                { user: "김원장", action: "로그인", device: "MacBook Pro · Chrome", ip: "211.104.xxx.xxx", time: "오늘 09:30", status: "success" },
                { user: "이원장", action: "로그인", device: "Windows PC · Edge", ip: "175.213.xxx.xxx", time: "오늘 08:00", status: "success" },
                { user: "정원장", action: "중복 로그인 차단", device: "iPhone 15 · Safari", ip: "223.38.xxx.xxx", time: "오늘 07:45", status: "blocked" },
                { user: "정원장", action: "로그인 (기존 세션 만료)", device: "iPhone 15 · Safari", ip: "223.38.xxx.xxx", time: "오늘 07:46", status: "success" },
                { user: "박원장", action: "로그인", device: "iPad Pro · Safari", ip: "211.104.xxx.xxx", time: "오늘 08:15", status: "success" },
                { user: "최원장", action: "비밀번호 변경", device: "MacBook Air · Chrome", ip: "118.235.xxx.xxx", time: "어제 17:30", status: "success" },
                { user: "한위생사", action: "로그인 실패 (비밀번호 오류)", device: "불명", ip: "45.67.xxx.xxx", time: "어제 14:20", status: "failed" },
              ].map((log, i) => (
                <div key={i} className="flex items-center gap-3 text-xs py-2 px-3 rounded-lg hover:bg-gray-50">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    log.status === "success" ? "bg-emerald-500" : log.status === "blocked" ? "bg-amber-500" : "bg-red-500"
                  }`} />
                  <span className="font-medium text-gray-700 w-16">{log.user}</span>
                  <span className={`w-44 ${log.status === "blocked" ? "text-amber-600 font-medium" : log.status === "failed" ? "text-red-600 font-medium" : "text-gray-500"}`}>
                    {log.action}
                  </span>
                  <span className="text-gray-400 flex-1">{log.device} · {log.ip}</span>
                  <span className="text-gray-400 w-24 text-right">{log.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════ 보안 정책 탭 ════════════════════ */}
      {activeTab === "security" && (
        <div className="space-y-6">
          {/* 동시 로그인 방지 설명 */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield size={16} className="text-red-600" />계정 공유 방지 정책
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              덴비는 아이디/비밀번호 공유를 통한 무단 사용을 방지합니다.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  icon: Monitor,
                  title: "1계정 1세션 (동시 접속 차단)",
                  desc: "하나의 계정으로 동시에 여러 기기에서 로그인할 수 없습니다. 새 기기에서 로그인하면 이전 기기의 세션이 자동으로 만료됩니다.",
                  status: "활성",
                  color: "emerald",
                },
                {
                  icon: Globe,
                  title: "IP 주소 변경 감지",
                  desc: "짧은 시간 내 서로 다른 IP에서 접속 시도가 발생하면 비정상 접근으로 판단하고 Owner에게 알림을 보냅니다.",
                  status: "활성",
                  color: "emerald",
                },
                {
                  icon: Lock,
                  title: "JWT 토큰 단일 세션 바인딩",
                  desc: "로그인 시 발급된 session_id를 JWT에 포함하고, 서버에서 매 요청마다 유효한 세션인지 검증합니다.",
                  status: "활성",
                  color: "emerald",
                },
                {
                  icon: Key,
                  title: "첫 로그인 비밀번호 변경 강제",
                  desc: "Owner가 생성한 초기 비밀번호로 첫 로그인 시 반드시 새 비밀번호로 변경해야 합니다.",
                  status: "활성",
                  color: "emerald",
                },
              ].map((policy, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <policy.icon size={16} className="text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-semibold text-gray-900">{policy.title}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full bg-${policy.color}-100 text-${policy.color}-700 font-medium`}>
                          {policy.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">{policy.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 기술 구현 상세 (Owner 참고용) */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-5 text-white">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Lock size={16} />동시 로그인 방지 동작 흐름
            </h3>
            <div className="space-y-4 text-sm">
              <div className="flex gap-4 items-start">
                <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">1</div>
                <div>
                  <div className="font-medium">로그인 요청</div>
                  <div className="text-xs text-gray-400">사용자가 이메일/비밀번호로 로그인 → 서버에서 고유 session_id 생성</div>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">2</div>
                <div>
                  <div className="font-medium">기존 세션 무효화</div>
                  <div className="text-xs text-gray-400">DB에 저장된 해당 사용자의 이전 session_id를 삭제 → 이전 기기 자동 로그아웃</div>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">3</div>
                <div>
                  <div className="font-medium">JWT 발급 (session_id 포함)</div>
                  <div className="text-xs text-gray-400">{"{ user_id, clinic_id, role, session_id }"} → 매 API 요청마다 session_id 유효성 검증</div>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-7 h-7 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">4</div>
                <div>
                  <div className="font-medium">세션 만료 감지 (이전 기기)</div>
                  <div className="text-xs text-gray-400">이전 기기에서 API 요청 시 session_id 불일치 → &ldquo;다른 기기에서 로그인되었습니다&rdquo; 메시지 표시 → /login으로 리다이렉트</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
