/**
 * 총괄관리자(SuperAdmin) 대시보드
 * 플랫폼 전체 치과/계정/구독 관리
 * hss@bottlecorp.kr 전용
 */
"use client";

import { useState, useMemo } from "react";
import {
  Shield, Building2, Users, Crown, Stethoscope,
  Search, MoreVertical, Check, X, Eye, ChevronDown,
  Zap, Star, UserCheck, UserX, Key, BarChart3,
  TrendingUp, CreditCard, Activity,
} from "lucide-react";
import KPICard from "@/components/ui/KPICard";
import {
  SUBSCRIPTION_PLANS, PLAN_FEATURES,
  type PlanTier,
} from "@/lib/plans";

// ═══════════════════════════════════════
// 데모 데이터 — DB 미연결 시 fallback
// ═══════════════════════════════════════
const DEMO_CLINICS = [
  { id: 1, name: "아나플란트치과",   ehrType: "hanaro",  plan: "basic" as PlanTier,        planExpires: "2026-04-15", chairCount: 5,  totalStaff: 7, activeDoctors: 5, ownerName: "김원장", ownerEmail: "kim@clinic.com",      isActive: true,  createdAt: "2025-01-15" },
  { id: 2, name: "서울밝은치과",     ehrType: "dentweb", plan: "professional" as PlanTier,  planExpires: "2026-06-01", chairCount: 8,  totalStaff: 12, activeDoctors: 4, ownerName: "박대표", ownerEmail: "park@seoul-dental.kr", isActive: true,  createdAt: "2025-03-20" },
  { id: 3, name: "강남미소치과",     ehrType: "hanaro",  plan: "enterprise" as PlanTier,    planExpires: "2027-01-01", chairCount: 15, totalStaff: 25, activeDoctors: 8, ownerName: "이원장", ownerEmail: "lee@gangnam-smile.kr", isActive: true,  createdAt: "2025-02-10" },
  { id: 4, name: "해피덴탈의원",     ehrType: "oneclick",plan: "free" as PlanTier,          planExpires: null,         chairCount: 3,  totalStaff: 3,  activeDoctors: 1, ownerName: "최원장", ownerEmail: "choi@happy-dental.kr", isActive: true,  createdAt: "2026-01-05" },
  { id: 5, name: "드림치과의원",     ehrType: "hanaro",  plan: "basic" as PlanTier,         planExpires: "2026-05-20", chairCount: 4,  totalStaff: 5,  activeDoctors: 2, ownerName: "정원장", ownerEmail: "jung@dream-dental.kr", isActive: false, createdAt: "2025-08-12" },
];

const DEMO_USERS = [
  { id: 0, email: "hss@bottlecorp.kr", name: "한승수", role: "superadmin", position: "총괄관리자", clinicId: 0, clinicName: "BottleCorp", isActive: true, isDoctor: false, createdAt: "2025-01-01", lastLogin: "2026-03-29 14:30" },
  { id: 1, email: "kim@clinic.com", name: "김원장", role: "owner", position: "대표원장", clinicId: 1, clinicName: "아나플란트치과", isActive: true, isDoctor: true, createdAt: "2025-01-15", lastLogin: "2026-03-29 09:30" },
  { id: 2, email: "lee@clinic.com", name: "이원장", role: "admin", position: "부원장", clinicId: 1, clinicName: "아나플란트치과", isActive: true, isDoctor: true, createdAt: "2025-03-01", lastLogin: "2026-03-28 18:00" },
  { id: 3, email: "park@seoul-dental.kr", name: "박대표", role: "owner", position: "대표원장", clinicId: 2, clinicName: "서울밝은치과", isActive: true, isDoctor: true, createdAt: "2025-03-20", lastLogin: "2026-03-29 08:15" },
  { id: 4, email: "lee@gangnam-smile.kr", name: "이원장", role: "owner", position: "대표원장", clinicId: 3, clinicName: "강남미소치과", isActive: true, isDoctor: true, createdAt: "2025-02-10", lastLogin: "2026-03-29 10:00" },
  { id: 5, email: "choi@happy-dental.kr", name: "최원장", role: "owner", position: "대표원장", clinicId: 4, clinicName: "해피덴탈의원", isActive: true, isDoctor: true, createdAt: "2026-01-05", lastLogin: "2026-03-27 17:45" },
  { id: 6, email: "jung@dream-dental.kr", name: "정원장", role: "owner", position: "대표원장", clinicId: 5, clinicName: "드림치과의원", isActive: false, isDoctor: true, createdAt: "2025-08-12", lastLogin: "2026-02-15 16:30" },
];

const PLAN_BADGE: Record<string, string> = {
  free: "bg-gray-100 text-gray-600 border-gray-200",
  basic: "bg-blue-100 text-blue-700 border-blue-200",
  professional: "bg-violet-100 text-violet-700 border-violet-200",
  enterprise: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const PLAN_LABEL: Record<string, string> = {
  free: "Free", basic: "Basic", professional: "Professional", enterprise: "Enterprise",
};

const ROLE_BADGE: Record<string, string> = {
  superadmin: "bg-red-100 text-red-700 border-red-200",
  owner: "bg-amber-100 text-amber-700 border-amber-200",
  admin: "bg-blue-100 text-blue-700 border-blue-200",
  viewer: "bg-gray-100 text-gray-600 border-gray-200",
};

const ROLE_LABEL: Record<string, string> = {
  superadmin: "SuperAdmin", owner: "Owner", admin: "Admin", viewer: "Viewer",
};

type TabId = "overview" | "clinics" | "users" | "subscriptions";

export default function SuperAdminPage() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [clinicSearch, setClinicSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [clinicPlanFilter, setClinicPlanFilter] = useState<string>("all");
  const [planEditId, setPlanEditId] = useState<number | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanTier>("free");
  const [clinics, setClinics] = useState(DEMO_CLINICS);
  const [users, setUsers] = useState(DEMO_USERS);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  // ─── KPI 계산 ───
  const totalClinics = clinics.length;
  const activeClinics = clinics.filter(c => c.isActive).length;
  const totalUsers = users.length;
  const totalDoctors = users.filter(u => u.isDoctor && u.isActive).length;
  const monthlyRevenue = clinics.reduce((sum, c) => {
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === c.plan);
    return sum + (plan?.price || 0);
  }, 0);

  // ─── 필터 ───
  const filteredClinics = useMemo(() => {
    return clinics.filter(c => {
      if (clinicSearch && !c.name.toLowerCase().includes(clinicSearch.toLowerCase()) &&
          !c.ownerEmail.toLowerCase().includes(clinicSearch.toLowerCase())) return false;
      if (clinicPlanFilter !== "all" && c.plan !== clinicPlanFilter) return false;
      return true;
    });
  }, [clinics, clinicSearch, clinicPlanFilter]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      if (userSearch && !u.name.toLowerCase().includes(userSearch.toLowerCase()) &&
          !u.email.toLowerCase().includes(userSearch.toLowerCase()) &&
          !u.clinicName.toLowerCase().includes(userSearch.toLowerCase())) return false;
      return true;
    });
  }, [users, userSearch]);

  // ─── 핸들러 ───
  const handlePlanChange = (clinicId: number) => {
    setClinics(prev => prev.map(c => c.id === clinicId ? { ...c, plan: selectedPlan } : c));
    setPlanEditId(null);
  };

  const toggleClinicActive = (clinicId: number) => {
    setClinics(prev => prev.map(c => c.id === clinicId ? { ...c, isActive: !c.isActive } : c));
    setActionMenuId(null);
  };

  const toggleUserActive = (userId: number) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: !u.isActive } : u));
    setActionMenuId(null);
  };

  const TABS: { id: TabId; label: string; icon: typeof Shield }[] = [
    { id: "overview",      label: "플랫폼 현황",   icon: Activity },
    { id: "clinics",       label: "치과 관리",      icon: Building2 },
    { id: "users",         label: "사용자 관리",    icon: Users },
    { id: "subscriptions", label: "구독 관리",      icon: Crown },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 총괄관리자 헤더 */}
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 rounded-2xl p-5 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Shield size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">총괄관리자 콘솔</h2>
              <p className="text-sm opacity-80">hss@bottlecorp.kr · 플랫폼 전체 관리</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{activeClinics}개 치과</div>
            <div className="text-sm opacity-70">{totalUsers}명 사용자 운영 중</div>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
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

      {/* ════════════════════ 플랫폼 현황 탭 ════════════════════ */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* KPI */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <KPICard label="전체 치과" value={totalClinics + "개"} icon={Building2} color="blue" />
            <KPICard label="활성 치과" value={activeClinics + "개"} icon={Check} color="green" />
            <KPICard label="전체 사용자" value={totalUsers + "명"} icon={Users} color="purple" />
            <KPICard label="활성 의사" value={totalDoctors + "명"} icon={Stethoscope} color="amber" />
            <KPICard label="월 예상 매출" value={(monthlyRevenue / 10000).toFixed(1) + "만원"} icon={CreditCard} color="green" />
          </div>

          {/* 플랜별 분포 */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Crown size={16} className="text-amber-500" />구독 플랜 분포
            </h3>
            <div className="grid grid-cols-4 gap-4">
              {SUBSCRIPTION_PLANS.map(plan => {
                const count = clinics.filter(c => c.plan === plan.id).length;
                const pct = totalClinics > 0 ? Math.round((count / totalClinics) * 100) : 0;
                return (
                  <div key={plan.id} className="bg-gray-50 rounded-xl p-4 text-center">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${plan.gradient} flex items-center justify-center mx-auto mb-2`}>
                      {plan.id === "free" && <Zap size={18} className="text-white" />}
                      {plan.id === "basic" && <Star size={18} className="text-white" />}
                      {plan.id === "professional" && <Crown size={18} className="text-white" />}
                      {plan.id === "enterprise" && <Building2 size={18} className="text-white" />}
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{count}</div>
                    <div className="text-xs text-gray-500">{plan.name}</div>
                    <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: plan.color }} />
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{pct}%</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 최근 활동 */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <TrendingUp size={16} className="text-blue-500" />최근 활동 로그
            </h3>
            <div className="space-y-3">
              {[
                { time: "10분 전", text: "서울밝은치과가 Professional 플랜으로 업그레이드", type: "upgrade" },
                { time: "1시간 전", text: "해피덴탈의원이 무료 체험 등록", type: "new" },
                { time: "3시간 전", text: "아나플란트치과 새 의사 계정 추가 (정원장)", type: "user" },
                { time: "어제", text: "드림치과의원 결제 실패 — 카드 만료", type: "warning" },
                { time: "2일 전", text: "강남미소치과 Enterprise 연간 결제 완료", type: "payment" },
              ].map((log, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="text-xs text-gray-400 w-16">{log.time}</span>
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    log.type === "upgrade" ? "bg-violet-500" :
                    log.type === "new" ? "bg-emerald-500" :
                    log.type === "user" ? "bg-blue-500" :
                    log.type === "warning" ? "bg-amber-500" :
                    "bg-green-500"
                  }`} />
                  <span className="text-gray-700">{log.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════ 치과 관리 탭 ════════════════════ */}
      {activeTab === "clinics" && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">전체 치과 목록 ({filteredClinics.length}개)</h3>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text" value={clinicSearch} onChange={(e) => setClinicSearch(e.target.value)}
                  placeholder="치과명, 이메일 검색..." className="w-full text-sm border border-gray-200 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                {[["all", "전체"], ["free", "Free"], ["basic", "Basic"], ["professional", "Pro"], ["enterprise", "Ent"]].map(([key, label]) => (
                  <button key={key} onClick={() => setClinicPlanFilter(key)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${clinicPlanFilter === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
                  >{label}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <th className="px-4 py-3 text-left">치과</th>
                  <th className="px-4 py-3 text-center">플랜</th>
                  <th className="px-4 py-3 text-center">만료일</th>
                  <th className="px-4 py-3 text-center">체어</th>
                  <th className="px-4 py-3 text-center">직원</th>
                  <th className="px-4 py-3 text-center">의사</th>
                  <th className="px-4 py-3 text-center">상태</th>
                  <th className="px-4 py-3 text-center w-16">액션</th>
                </tr>
              </thead>
              <tbody>
                {filteredClinics.map(clinic => (
                  <tr key={clinic.id} className={`border-b border-gray-50 hover:bg-blue-50/30 ${!clinic.isActive ? "opacity-50" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{clinic.name}</div>
                      <div className="text-xs text-gray-400">{clinic.ownerName} · {clinic.ownerEmail}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {planEditId === clinic.id ? (
                        <div className="flex items-center gap-1 justify-center">
                          <select value={selectedPlan} onChange={(e) => setSelectedPlan(e.target.value as PlanTier)}
                            className="text-xs border rounded px-2 py-1 focus:ring-1 focus:ring-blue-500">
                            {SUBSCRIPTION_PLANS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                          <button onClick={() => handlePlanChange(clinic.id)} className="p-1 bg-emerald-100 text-emerald-600 rounded"><Check size={12} /></button>
                          <button onClick={() => setPlanEditId(null)} className="p-1 bg-gray-100 text-gray-500 rounded"><X size={12} /></button>
                        </div>
                      ) : (
                        <button onClick={() => { setPlanEditId(clinic.id); setSelectedPlan(clinic.plan); }}
                          className={`text-xs font-medium px-2 py-0.5 rounded-full border cursor-pointer hover:opacity-80 ${PLAN_BADGE[clinic.plan]}`}>
                          {PLAN_LABEL[clinic.plan]}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-gray-500">{clinic.planExpires || "-"}</td>
                    <td className="px-4 py-3 text-center text-xs">{clinic.chairCount}대</td>
                    <td className="px-4 py-3 text-center text-xs">{clinic.totalStaff}명</td>
                    <td className="px-4 py-3 text-center text-xs">{clinic.activeDoctors}명</td>
                    <td className="px-4 py-3 text-center">
                      {clinic.isActive
                        ? <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">활성</span>
                        : <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-500">비활성</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="relative">
                        <button onClick={() => setActionMenuId(actionMenuId === `c-${clinic.id}` ? null : `c-${clinic.id}`)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><MoreVertical size={14} /></button>
                        {actionMenuId === `c-${clinic.id}` && (
                          <div className="absolute right-0 top-8 z-20 bg-white rounded-xl border shadow-lg w-40 py-1 animate-fade-in">
                            <button onClick={() => { setPlanEditId(clinic.id); setSelectedPlan(clinic.plan); setActionMenuId(null); }}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2">
                              <Crown size={13} />플랜 변경
                            </button>
                            <button onClick={() => toggleClinicActive(clinic.id)}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${clinic.isActive ? "text-red-600" : "text-emerald-600"}`}>
                              {clinic.isActive ? <><UserX size={13} />비활성화</> : <><UserCheck size={13} />활성화</>}
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════════════════════ 사용자 관리 탭 ════════════════════ */}
      {activeTab === "users" && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">전체 사용자 ({filteredUsers.length}명)</h3>
            </div>
            <div className="relative max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={userSearch} onChange={(e) => setUserSearch(e.target.value)}
                placeholder="이름, 이메일, 병원명 검색..." className="w-full text-sm border border-gray-200 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <th className="px-4 py-3 text-left">사용자</th>
                  <th className="px-4 py-3 text-left">소속 치과</th>
                  <th className="px-4 py-3 text-center">역할</th>
                  <th className="px-4 py-3 text-center">직급</th>
                  <th className="px-4 py-3 text-center">상태</th>
                  <th className="px-4 py-3 text-left">마지막 접속</th>
                  <th className="px-4 py-3 text-center w-16">액션</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id} className={`border-b border-gray-50 hover:bg-blue-50/30 ${!user.isActive ? "opacity-50" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                          user.role === "superadmin" ? "bg-red-500" : user.isDoctor ? "bg-blue-500" : "bg-violet-500"
                        }`}>{user.name[0]}</div>
                        <div>
                          <div className="font-medium text-gray-900">{user.name}</div>
                          <div className="text-xs text-gray-400">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{user.clinicName}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${ROLE_BADGE[user.role]}`}>
                        {ROLE_LABEL[user.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-gray-600">{user.position}</td>
                    <td className="px-4 py-3 text-center">
                      {user.isActive
                        ? <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">활성</span>
                        : <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-500">비활성</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{user.lastLogin}</td>
                    <td className="px-4 py-3 text-center">
                      {user.role !== "superadmin" && (
                        <div className="relative">
                          <button onClick={() => setActionMenuId(actionMenuId === `u-${user.id}` ? null : `u-${user.id}`)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><MoreVertical size={14} /></button>
                          {actionMenuId === `u-${user.id}` && (
                            <div className="absolute right-0 top-8 z-20 bg-white rounded-xl border shadow-lg w-44 py-1 animate-fade-in">
                              <button onClick={() => { setActionMenuId(null); }}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"><Key size={13} />비밀번호 초기화</button>
                              <button onClick={() => toggleUserActive(user.id)}
                                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${user.isActive ? "text-red-600" : "text-emerald-600"}`}>
                                {user.isActive ? <><UserX size={13} />비활성화</> : <><UserCheck size={13} />활성화</>}
                              </button>
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
      )}

      {/* ════════════════════ 구독 관리 탭 ════════════════════ */}
      {activeTab === "subscriptions" && (
        <div className="space-y-6">
          {/* 매출 개요 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard label="월 예상 매출" value={(monthlyRevenue / 10000).toFixed(1) + "만원"} icon={CreditCard} color="green" />
            <KPICard label="연 예상 매출" value={(monthlyRevenue * 12 / 10000).toFixed(0) + "만원"} icon={TrendingUp} color="blue" />
            <KPICard label="유료 전환율" value={Math.round((clinics.filter(c => c.plan !== "free").length / Math.max(totalClinics, 1)) * 100) + "%"} icon={BarChart3} color="purple" />
            <KPICard label="평균 객단가" value={Math.round(monthlyRevenue / Math.max(clinics.filter(c => c.plan !== "free").length, 1) / 10000) + "만원"} icon={Crown} color="amber" />
          </div>

          {/* 치과별 구독 현황 */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">치과별 구독 현황</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                    <th className="px-4 py-3 text-left">치과</th>
                    <th className="px-4 py-3 text-center">현재 플랜</th>
                    <th className="px-4 py-3 text-right">월 요금</th>
                    <th className="px-4 py-3 text-center">만료일</th>
                    <th className="px-4 py-3 text-center">체어/한도</th>
                    <th className="px-4 py-3 text-center">계정/한도</th>
                    <th className="px-4 py-3 text-center">플랜 변경</th>
                  </tr>
                </thead>
                <tbody>
                  {clinics.map(clinic => {
                    const plan = SUBSCRIPTION_PLANS.find(p => p.id === clinic.plan)!;
                    return (
                      <tr key={clinic.id} className="border-b border-gray-50 hover:bg-blue-50/30">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{clinic.name}</div>
                          <div className="text-xs text-gray-400">{clinic.ownerEmail}</div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${PLAN_BADGE[clinic.plan]}`}>
                            {PLAN_LABEL[clinic.plan]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">{plan.price > 0 ? plan.price.toLocaleString() + "원" : "무료"}</td>
                        <td className="px-4 py-3 text-center text-xs text-gray-500">{clinic.planExpires || "-"}</td>
                        <td className="px-4 py-3 text-center text-xs">
                          <span className={clinic.chairCount > plan.maxChairs ? "text-red-600 font-bold" : ""}>
                            {clinic.chairCount}/{plan.maxChairs >= 999 ? "∞" : plan.maxChairs}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-xs">
                          <span className={clinic.totalStaff > plan.maxStaff ? "text-red-600 font-bold" : ""}>
                            {clinic.totalStaff}/{plan.maxStaff >= 999 ? "∞" : plan.maxStaff}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <select
                            value={clinic.plan}
                            onChange={(e) => {
                              const newPlan = e.target.value as PlanTier;
                              setClinics(prev => prev.map(c => c.id === clinic.id ? { ...c, plan: newPlan } : c));
                            }}
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:ring-1 focus:ring-blue-500"
                          >
                            {SUBSCRIPTION_PLANS.map(p => <option key={p.id} value={p.id}>{p.name} ({p.price > 0 ? p.price.toLocaleString() + "원" : "무료"})</option>)}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-semibold">
                    <td className="px-4 py-3">합계</td>
                    <td className="px-4 py-3 text-center text-xs">{clinics.filter(c => c.plan !== "free").length}개 유료</td>
                    <td className="px-4 py-3 text-right">{monthlyRevenue.toLocaleString()}원/월</td>
                    <td colSpan={4}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
