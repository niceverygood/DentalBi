import { useState, useMemo, useCallback, useEffect } from "react";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";
import {
  Activity, BarChart3, Users, Calendar, TrendingUp, TrendingDown,
  UserPlus, UserMinus, Clock, Brain, ChevronDown, ChevronRight,
  AlertTriangle, CheckCircle, Phone, MessageSquare, Search,
  DollarSign, ArrowUpRight, ArrowDownRight, Filter, RefreshCw,
  Settings, Bell, Star, Target, Zap, Eye, XCircle
} from "lucide-react";

// ═══════════════════════════════════════
// MOCK DATA — 치과 전자차트 DB 구조 기반
// 실제 배포 시 API 호출로 대체
// ═══════════════════════════════════════
const DOCTORS = [
  { id: 1, name: "김원장", role: "대표원장", color: "#2563eb" },
  { id: 2, name: "이원장", role: "부원장", color: "#7c3aed" },
  { id: 3, name: "박원장", role: "진료원장", color: "#059669" },
  { id: 4, name: "최원장", role: "진료원장", color: "#d97706" },
  { id: 5, name: "정원장", role: "봉직의", color: "#dc2626" },
];

const genMonthlyData = () => {
  const months = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
  return months.map((m, i) => ({
    month: m,
    revenue: Math.round((7000 + Math.random() * 4000 + (i > 8 ? -500 : 0)) * 10) / 10,
    insurance: Math.round((2000 + Math.random() * 1500) * 10) / 10,
    newPatients: Math.round(55 + Math.random() * 40 + (i === 0 ? 15 : 0)),
    oldPatients: Math.round(350 + Math.random() * 150),
    totalPatients: Math.round(200 + Math.random() * 80),
    avgVisits: Math.round((1.8 + Math.random() * 0.6) * 100) / 100,
    corpFee: Math.round((1500 + Math.random() * 800) * 10) / 10,
  }));
};

const genDoctorStats = () => DOCTORS.map(d => ({
  ...d,
  totalRevenue: Math.round(1200 + Math.random() * 3800),
  corpFee: Math.round(400 + Math.random() * 600),
  totalPayment: Math.round(800 + Math.random() * 3200),
  newPatients: Math.round(8 + Math.random() * 35),
  oldVisits: Math.round(80 + Math.random() * 200),
  totalVisits: Math.round(100 + Math.random() * 230),
  distinctPatients: Math.round(70 + Math.random() * 150),
  avgVisitCount: Math.round((1.5 + Math.random() * 1) * 100) / 100,
  newRevenue9m: Math.round(500 + Math.random() * 2000),
  revenuePerNewPt: Math.round(50 + Math.random() * 150),
  chairOccupancy: Math.round(40 + Math.random() * 50),
  revenuePerMin: Math.round(2000 + Math.random() * 4000),
}));

const genPaymentData = () => {
  const days = [];
  for (let i = 1; i <= 28; i++) {
    days.push({
      day: `3/${i}`,
      card: Math.round(200 + Math.random() * 300),
      cash: Math.round(30 + Math.random() * 80),
      cashReceipt: Math.round(10 + Math.random() * 40),
      online: Math.round(5 + Math.random() * 30),
      corp: Math.round(100 + Math.random() * 150),
    });
  }
  return days;
};

const genTxMixData = () => [
  { category: "임플란트", count: 48, revenue: 4320, prevCount: 42, color: "#2563eb" },
  { category: "크라운", count: 67, revenue: 1675, prevCount: 72, color: "#7c3aed" },
  { category: "브릿지", count: 12, revenue: 540, prevCount: 15, color: "#059669" },
  { category: "근관치료", count: 89, revenue: 890, prevCount: 85, color: "#d97706" },
  { category: "발치(단순)", count: 124, revenue: 372, prevCount: 118, color: "#dc2626" },
  { category: "매복발치", count: 31, revenue: 310, prevCount: 28, color: "#0891b2" },
  { category: "스케일링", count: 198, revenue: 594, prevCount: 190, color: "#4f46e5" },
  { category: "레진충전", count: 156, revenue: 780, prevCount: 148, color: "#be185d" },
  { category: "교정(월)", count: 22, revenue: 660, prevCount: 22, color: "#65a30d" },
  { category: "미백", count: 8, revenue: 240, prevCount: 6, color: "#ca8a04" },
];

const genLostPatients = () => [
  { id: "P0412", name: "김**", lastVisit: "2026-01-15", pendingTx: "발치 후 임플란트 미진행 (#36)", riskScore: 92, doctor: "김원장", phone: "010-****-3421", daysAway: 72 },
  { id: "P1287", name: "이**", lastVisit: "2026-02-03", pendingTx: "근관치료 후 크라운 미진행 (#26)", riskScore: 87, doctor: "이원장", phone: "010-****-7812", daysAway: 53 },
  { id: "P0891", name: "박**", lastVisit: "2025-12-20", pendingTx: "발치 후 브릿지 미진행 (#45,46)", riskScore: 85, doctor: "박원장", phone: "010-****-5567", daysAway: 98 },
  { id: "P2034", name: "최**", lastVisit: "2026-01-28", pendingTx: "임플란트 2차수술 미내원", riskScore: 78, doctor: "김원장", phone: "010-****-9034", daysAway: 59 },
  { id: "P0567", name: "정**", lastVisit: "2026-02-10", pendingTx: "교정 월 체크 미내원 (2개월)", riskScore: 74, doctor: "최원장", phone: "010-****-2290", daysAway: 46 },
  { id: "P1456", name: "한**", lastVisit: "2025-11-05", pendingTx: "보철 인상 후 세팅 미내원", riskScore: 95, doctor: "이원장", phone: "010-****-8801", daysAway: 143 },
  { id: "P0723", name: "윤**", lastVisit: "2026-01-02", pendingTx: "발치 후 임플란트 상담 후 미내원", riskScore: 68, doctor: "박원장", phone: "010-****-1155", daysAway: 85 },
  { id: "P1890", name: "조**", lastVisit: "2026-02-22", pendingTx: "스케일링 후 잇몸치료 미진행", riskScore: 55, doctor: "정원장", phone: "010-****-4478", daysAway: 34 },
];

const genTurnawayData = () => [
  { month: "10월", count: 42, contacted: 28, returned: 12 },
  { month: "11월", count: 38, contacted: 30, returned: 15 },
  { month: "12월", count: 55, contacted: 35, returned: 14 },
  { month: "1월", count: 48, contacted: 32, returned: 16 },
  { month: "2월", count: 35, contacted: 28, returned: 13 },
  { month: "3월", count: 29, contacted: 18, returned: 8 },
];

const genNewPatientByPeriod = () => [
  { period: "초진일", payments: 82500, count: 65 },
  { period: "2~9일", payments: 156000, count: 48 },
  { period: "10~19일", payments: 234000, count: 42 },
  { period: "20~29일", payments: 312000, count: 38 },
  { period: "30~59일", payments: 445000, count: 35 },
  { period: "60~89일", payments: 520000, count: 30 },
  { period: "90~119일", payments: 580000, count: 25 },
  { period: "120~179일", payments: 620000, count: 20 },
  { period: "180~269일", payments: 650000, count: 15 },
  { period: "270~364일", payments: 670000, count: 10 },
];

const genChairHeatmap = () => {
  const hours = ["09","10","11","12","13","14","15","16","17","18"];
  const days = ["월","화","수","목","금","토"];
  const data = [];
  days.forEach(day => {
    hours.forEach(hour => {
      const isLunch = hour === "12" || hour === "13";
      const isSat = day === "토";
      const base = isLunch ? 30 : (isSat && parseInt(hour) > 13 ? 0 : 60);
      data.push({ day, hour, rate: Math.min(100, Math.max(0, base + Math.round(Math.random() * 40))) });
    });
  });
  return data;
};

const AI_INSIGHTS = [
  { type: "warning", icon: AlertTriangle, title: "Lost Patient 급증 알림", body: "지난 30일간 발치 후 임플란트 미진행 환자가 6명 발생했습니다. 전월 대비 50% 증가. 해당 환자들에게 개별 연락을 권장합니다.", impact: "추정 미실현 매출: 5,400만원", time: "2시간 전", priority: "high" },
  { type: "insight", icon: TrendingUp, title: "김원장 신환 전환율 상승", body: "김원장의 신환 90일 내 진료수익이 전월 대비 22% 상승했습니다. 초진 상담 시 종합검진 패키지 제안이 효과적인 것으로 분석됩니다.", impact: "신환당 평균 수익: 187만원", time: "5시간 전", priority: "positive" },
  { type: "warning", icon: Clock, title: "오후 체어 가동률 저조", body: "화/목 오후 3~5시 체어 가동률이 35%로 전체 평균(72%) 대비 현저히 낮습니다. 해당 시간대 예약 유도 프로모션을 검토해보세요.", impact: "개선 시 월 추가 매출: 약 800만원", time: "1일 전", priority: "medium" },
  { type: "action", icon: Target, title: "보험진료 비율 증가 추세", body: "보험진료 비율이 3개월 연속 상승하여 현재 38.2%입니다 (전년 동기 34.1%). 비보험 진료 상담 강화가 필요합니다.", impact: "비보험 비율 1% 회복 시 월 +120만원", time: "1일 전", priority: "medium" },
  { type: "insight", icon: Star, title: "크라운 진료 감소 추세", body: "근관치료 대비 크라운 진행률이 68%로 업계 평균(82%) 대비 낮습니다. 근관치료 완료 시 크라운 필요성 설명 프로세스를 강화하세요.", impact: "개선 시 월 추가 매출: 약 400만원", time: "2일 전", priority: "medium" },
];

// ═══════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════

const fmt = (n) => {
  if (n >= 10000) return (n / 10000).toFixed(1) + "억";
  if (n >= 1000) return (n / 1000).toFixed(1) + "천";
  return n.toLocaleString();
};
const fmtW = (n) => n.toLocaleString() + "만원";

function MetricCard({ label, value, sub, trend, icon: Icon, color = "blue" }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    purple: "bg-violet-50 text-violet-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
    cyan: "bg-cyan-50 text-cyan-600",
  };
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
        {Icon && <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors[color]}`}><Icon size={16} /></div>}
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="flex items-center gap-1">
        {trend !== undefined && (
          <span className={`text-xs font-medium flex items-center gap-0.5 ${trend >= 0 ? "text-emerald-600" : "text-red-500"}`}>
            {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(trend)}%
          </span>
        )}
        {sub && <span className="text-xs text-gray-400">{sub}</span>}
      </div>
    </div>
  );
}

function RiskBadge({ score }) {
  const color = score >= 80 ? "bg-red-100 text-red-700" : score >= 60 ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700";
  return <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>{score}점</span>;
}

function InsightCard({ insight }) {
  const Icon = insight.icon;
  const border = insight.priority === "high" ? "border-l-red-500" : insight.priority === "positive" ? "border-l-emerald-500" : "border-l-amber-500";
  const iconBg = insight.priority === "high" ? "bg-red-50 text-red-500" : insight.priority === "positive" ? "bg-emerald-50 text-emerald-500" : "bg-amber-50 text-amber-500";
  return (
    <div className={`bg-white rounded-xl border border-gray-100 border-l-4 ${border} p-5 hover:shadow-md transition-shadow`}>
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${iconBg}`}><Icon size={18} /></div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold text-sm text-gray-900">{insight.title}</h4>
            <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{insight.time}</span>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed mb-2">{insight.body}</p>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">{insight.impact}</span>
            <button className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"><Eye size={12} />상세보기</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════
export default function DentalBI() {
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState("month");
  const [selectedDoctor, setSelectedDoctor] = useState("all");
  const [showNotif, setShowNotif] = useState(false);

  const monthlyData = useMemo(() => genMonthlyData(), []);
  const doctorStats = useMemo(() => genDoctorStats(), []);
  const paymentData = useMemo(() => genPaymentData(), []);
  const txMixData = useMemo(() => genTxMixData(), []);
  const lostPatients = useMemo(() => genLostPatients(), []);
  const turnawayData = useMemo(() => genTurnawayData(), []);
  const newPtByPeriod = useMemo(() => genNewPatientByPeriod(), []);
  const chairHeatmap = useMemo(() => genChairHeatmap(), []);

  const totalRevenue = useMemo(() => doctorStats.reduce((s, d) => s + d.totalRevenue, 0), [doctorStats]);
  const totalNewPt = useMemo(() => doctorStats.reduce((s, d) => s + d.newPatients, 0), [doctorStats]);
  const totalVisits = useMemo(() => doctorStats.reduce((s, d) => s + d.totalVisits, 0), [doctorStats]);
  const totalDistinct = useMemo(() => doctorStats.reduce((s, d) => s + d.distinctPatients, 0), [doctorStats]);
  const avgChairRate = useMemo(() => Math.round(doctorStats.reduce((s, d) => s + d.chairOccupancy, 0) / doctorStats.length), [doctorStats]);
  const lostPtCount = lostPatients.filter(p => p.riskScore >= 70).length;

  const tabs = [
    { id: "overview", label: "종합 현황", icon: Activity },
    { id: "doctors", label: "의사별 성과", icon: BarChart3 },
    { id: "payments", label: "수납 관리", icon: DollarSign },
    { id: "txmix", label: "진료내역(TxMix)", icon: Target },
    { id: "retention", label: "환자 이탈 관리", icon: UserMinus },
    { id: "newpatient", label: "신환 분석", icon: UserPlus },
    { id: "chairs", label: "체어 가동률", icon: Clock },
    { id: "insights", label: "AI 인사이트", icon: Brain },
  ];

  const chartTooltipStyle = { contentStyle: { borderRadius: 8, border: "1px solid #e5e7eb", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)", fontSize: 12 } };

  // ─── OVERVIEW ───
  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard label="총 수익" value={fmtW(totalRevenue)} trend={8.2} sub="전월대비" icon={DollarSign} color="blue" />
        <MetricCard label="신환 수" value={totalNewPt + "명"} trend={12.5} sub="전월대비" icon={UserPlus} color="green" />
        <MetricCard label="총 진료건수" value={totalVisits.toLocaleString() + "건"} trend={3.1} sub="전월대비" icon={Activity} color="purple" />
        <MetricCard label="총 환자수" value={totalDistinct + "명"} trend={5.7} sub="전월대비" icon={Users} color="cyan" />
        <MetricCard label="체어 가동률" value={avgChairRate + "%"} trend={-2.3} sub="전월대비" icon={Clock} color="amber" />
        <MetricCard label="이탈 위험 환자" value={lostPtCount + "명"} trend={-15} sub="주의 필요" icon={AlertTriangle} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">월별 수익 추이</h3>
            <div className="flex gap-2 text-xs">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" />총수익</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />공단부담금</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2563eb" stopOpacity={0.15} /><stop offset="100%" stopColor="#2563eb" stopOpacity={0} /></linearGradient>
                <linearGradient id="gCorp" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#059669" stopOpacity={0.15} /><stop offset="100%" stopColor="#059669" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => fmt(v)} />
              <Tooltip {...chartTooltipStyle} formatter={(v) => [fmtW(v)]} />
              <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} fill="url(#gRev)" name="총수익" />
              <Area type="monotone" dataKey="corpFee" stroke="#059669" strokeWidth={2} fill="url(#gCorp)" name="공단부담금" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">월별 신환 / 구환</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip {...chartTooltipStyle} />
              <Bar dataKey="newPatients" fill="#7c3aed" name="신환" radius={[3, 3, 0, 0]} />
              <Bar dataKey="oldPatients" fill="#e0e7ff" name="구환진료건" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">최근 AI 인사이트</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {AI_INSIGHTS.slice(0, 4).map((ins, i) => <InsightCard key={i} insight={ins} />)}
        </div>
      </div>
    </div>
  );

  // ─── DOCTORS ───
  const renderDoctors = () => {
    const sorted = [...doctorStats].sort((a, b) => b.totalRevenue - a.totalRevenue);
    const radarData = sorted.map(d => ({
      name: d.name,
      수익: Math.round(d.totalRevenue / 50),
      신환: d.newPatients,
      내원횟수: Math.round(d.avgVisitCount * 30),
      체어점유: d.chairOccupancy,
      분당수익: Math.round(d.revenuePerMin / 50),
    }));
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {sorted.map(d => (
            <div key={d.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: d.color }}>{d.name[0]}</div>
                <div><div className="font-semibold text-sm">{d.name}</div><div className="text-xs text-gray-400">{d.role}</div></div>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-gray-500">총수익</span><span className="font-bold text-gray-900">{fmtW(d.totalRevenue)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">신환</span><span className="font-semibold">{d.newPatients}명</span></div>
                <div className="flex justify-between"><span className="text-gray-500">총환자</span><span>{d.distinctPatients}명</span></div>
                <div className="flex justify-between"><span className="text-gray-500">평균내원</span><span>{d.avgVisitCount}회</span></div>
                <div className="flex justify-between"><span className="text-gray-500">체어점유</span><span>{d.chairOccupancy}%</span></div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">의사별 수익 비교</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sorted} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => fmt(v)} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={60} />
                <Tooltip {...chartTooltipStyle} formatter={v => [fmtW(v)]} />
                <Bar dataKey="totalRevenue" name="총수익" radius={[0, 4, 4, 0]}>
                  {sorted.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">의사별 역량 레이더</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[{ subject: "수익", ...Object.fromEntries(radarData.map(d => [d.name, d.수익])) }, { subject: "신환", ...Object.fromEntries(radarData.map(d => [d.name, d.신환])) }, { subject: "내원횟수", ...Object.fromEntries(radarData.map(d => [d.name, d.내원횟수])) }, { subject: "체어점유", ...Object.fromEntries(radarData.map(d => [d.name, d.체어점유])) }, { subject: "분당수익", ...Object.fromEntries(radarData.map(d => [d.name, d.분당수익])) }]}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                {sorted.slice(0, 3).map((d, i) => (
                  <Radar key={d.id} name={d.name} dataKey={d.name} stroke={d.color} fill={d.color} fillOpacity={0.1} strokeWidth={2} />
                ))}
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50"><h3 className="font-semibold text-gray-900">의사별 상세 KPI 테이블</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                <th className="px-4 py-3 text-left">의사</th><th className="px-4 py-3 text-right">총수익</th><th className="px-4 py-3 text-right">공단부담금</th><th className="px-4 py-3 text-right">총수납</th>
                <th className="px-4 py-3 text-right">신환수</th><th className="px-4 py-3 text-right">구환건수</th><th className="px-4 py-3 text-right">총진료건</th><th className="px-4 py-3 text-right">총환자수</th>
                <th className="px-4 py-3 text-right">평균내원</th><th className="px-4 py-3 text-right">신환당수익</th>
              </tr></thead>
              <tbody>
                {sorted.map((d, i) => (
                  <tr key={d.id} className={`border-b border-gray-50 hover:bg-blue-50/30 ${i === 0 ? "bg-blue-50/20" : ""}`}>
                    <td className="px-4 py-3 font-medium flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />{d.name}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">{fmtW(d.totalRevenue)}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{fmtW(d.corpFee)}</td>
                    <td className="px-4 py-3 text-right">{fmtW(d.totalPayment)}</td>
                    <td className="px-4 py-3 text-right text-blue-600 font-semibold">{d.newPatients}</td>
                    <td className="px-4 py-3 text-right">{d.oldVisits}</td>
                    <td className="px-4 py-3 text-right">{d.totalVisits}</td>
                    <td className="px-4 py-3 text-right">{d.distinctPatients}</td>
                    <td className="px-4 py-3 text-right">{d.avgVisitCount}회</td>
                    <td className="px-4 py-3 text-right font-semibold">{fmtW(d.revenuePerNewPt)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr className="bg-gray-50 font-bold text-sm">
                <td className="px-4 py-3">합계</td>
                <td className="px-4 py-3 text-right">{fmtW(totalRevenue)}</td>
                <td className="px-4 py-3 text-right text-gray-500">{fmtW(sorted.reduce((s, d) => s + d.corpFee, 0))}</td>
                <td className="px-4 py-3 text-right">{fmtW(sorted.reduce((s, d) => s + d.totalPayment, 0))}</td>
                <td className="px-4 py-3 text-right text-blue-600">{totalNewPt}</td>
                <td className="px-4 py-3 text-right">{sorted.reduce((s, d) => s + d.oldVisits, 0)}</td>
                <td className="px-4 py-3 text-right">{totalVisits}</td>
                <td className="px-4 py-3 text-right">{totalDistinct}</td>
                <td className="px-4 py-3 text-right">{(sorted.reduce((s, d) => s + d.avgVisitCount, 0) / sorted.length).toFixed(2)}회</td>
                <td className="px-4 py-3 text-right">{fmtW(Math.round(sorted.reduce((s, d) => s + d.revenuePerNewPt, 0) / sorted.length))}</td>
              </tr></tfoot>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // ─── PAYMENTS ───
  const renderPayments = () => {
    const totalCard = paymentData.reduce((s, d) => s + d.card, 0);
    const totalCash = paymentData.reduce((s, d) => s + d.cash, 0);
    const totalCashR = paymentData.reduce((s, d) => s + d.cashReceipt, 0);
    const totalOnline = paymentData.reduce((s, d) => s + d.online, 0);
    const totalCorp = paymentData.reduce((s, d) => s + d.corp, 0);
    const grandTotal = totalCard + totalCash + totalCashR + totalOnline + totalCorp;
    const pieData = [
      { name: "카드", value: totalCard, color: "#2563eb" },
      { name: "현금", value: totalCash, color: "#059669" },
      { name: "현금영수증", value: totalCashR, color: "#7c3aed" },
      { name: "온라인", value: totalOnline, color: "#d97706" },
      { name: "공단부담금", value: totalCorp, color: "#0891b2" },
    ];
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <MetricCard label="총 수납액" value={fmtW(grandTotal)} trend={6.4} icon={DollarSign} color="blue" />
          <MetricCard label="카드 수납" value={fmtW(totalCard)} sub={Math.round(totalCard/grandTotal*100)+"%"} icon={DollarSign} color="purple" />
          <MetricCard label="현금 수납" value={fmtW(totalCash)} sub={Math.round(totalCash/grandTotal*100)+"%"} icon={DollarSign} color="green" />
          <MetricCard label="현금영수증" value={fmtW(totalCashR)} sub={Math.round(totalCashR/grandTotal*100)+"%"} icon={DollarSign} color="amber" />
          <MetricCard label="온라인" value={fmtW(totalOnline)} sub={Math.round(totalOnline/grandTotal*100)+"%"} icon={DollarSign} color="cyan" />
          <MetricCard label="공단부담금" value={fmtW(totalCorp)} sub={Math.round(totalCorp/grandTotal*100)+"%"} icon={DollarSign} color="red" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">일별 수납 추이</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={paymentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} interval={2} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => fmt(v)} />
                <Tooltip {...chartTooltipStyle} formatter={v => [fmtW(v)]} />
                <Bar dataKey="card" stackId="a" fill="#2563eb" name="카드" />
                <Bar dataKey="cash" stackId="a" fill="#059669" name="현금" />
                <Bar dataKey="cashReceipt" stackId="a" fill="#7c3aed" name="현금영수증" />
                <Bar dataKey="online" stackId="a" fill="#d97706" name="온라인" />
                <Bar dataKey="corp" stackId="a" fill="#0891b2" name="공단부담금" radius={[3, 3, 0, 0]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">수납 구성비</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} style={{ fontSize: 11 }}>
                  {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip formatter={v => [fmtW(v)]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 space-y-1">
              {pieData.map(d => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: d.color }} />{d.name}</span>
                  <span className="font-medium">{fmtW(d.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ─── TXMIX ───
  const renderTxMix = () => {
    const totalCount = txMixData.reduce((s, d) => s + d.count, 0);
    const totalRev = txMixData.reduce((s, d) => s + d.revenue, 0);
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="총 진료건수" value={totalCount + "건"} trend={5.2} icon={Target} color="blue" />
          <MetricCard label="총 진료수익" value={fmtW(totalRev)} trend={7.8} icon={DollarSign} color="green" />
          <MetricCard label="임플란트" value={txMixData[0].count + "건"} trend={Math.round((txMixData[0].count/txMixData[0].prevCount-1)*100)} icon={Star} color="purple" />
          <MetricCard label="건당 평균수익" value={fmtW(Math.round(totalRev/totalCount))} icon={TrendingUp} color="amber" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">진료항목별 건수</h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={txMixData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="category" type="category" tick={{ fontSize: 11 }} width={75} />
                <Tooltip {...chartTooltipStyle} />
                <Bar dataKey="count" name="이번 달" radius={[0, 4, 4, 0]}>
                  {txMixData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
                <Bar dataKey="prevCount" name="전월" fill="#e5e7eb" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">진료항목별 수익</h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={txMixData.sort((a, b) => b.revenue - a.revenue)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => fmtW(v)} />
                <YAxis dataKey="category" type="category" tick={{ fontSize: 11 }} width={75} />
                <Tooltip {...chartTooltipStyle} formatter={v => [fmtW(v)]} />
                <Bar dataKey="revenue" name="수익(만원)" radius={[0, 4, 4, 0]}>
                  {txMixData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50"><h3 className="font-semibold text-gray-900">TxMix 상세 (1월 사업장 현황신고용)</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 text-xs text-gray-500">
                <th className="px-4 py-3 text-left">진료항목</th><th className="px-4 py-3 text-right">건수</th><th className="px-4 py-3 text-right">전월</th>
                <th className="px-4 py-3 text-right">증감</th><th className="px-4 py-3 text-right">수익(만원)</th><th className="px-4 py-3 text-right">건당수익</th><th className="px-4 py-3 text-right">비중</th>
              </tr></thead>
              <tbody>{txMixData.map(d => {
                const diff = d.count - d.prevCount;
                return (
                  <tr key={d.category} className="border-b border-gray-50 hover:bg-blue-50/30">
                    <td className="px-4 py-3 font-medium flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />{d.category}</td>
                    <td className="px-4 py-3 text-right font-semibold">{d.count}</td>
                    <td className="px-4 py-3 text-right text-gray-400">{d.prevCount}</td>
                    <td className={`px-4 py-3 text-right font-medium ${diff > 0 ? "text-emerald-600" : diff < 0 ? "text-red-500" : "text-gray-400"}`}>{diff > 0 ? "+" : ""}{diff}</td>
                    <td className="px-4 py-3 text-right">{fmtW(d.revenue)}</td>
                    <td className="px-4 py-3 text-right">{fmtW(Math.round(d.revenue / d.count))}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{Math.round(d.revenue / totalRev * 100)}%</td>
                  </tr>
                );
              })}</tbody>
              <tfoot><tr className="bg-gray-50 font-bold">
                <td className="px-4 py-3">합계</td><td className="px-4 py-3 text-right">{totalCount}</td>
                <td className="px-4 py-3 text-right text-gray-400">{txMixData.reduce((s, d) => s + d.prevCount, 0)}</td>
                <td className="px-4 py-3 text-right text-emerald-600">+{totalCount - txMixData.reduce((s, d) => s + d.prevCount, 0)}</td>
                <td className="px-4 py-3 text-right">{fmtW(totalRev)}</td><td className="px-4 py-3 text-right">{fmtW(Math.round(totalRev / totalCount))}</td>
                <td className="px-4 py-3 text-right">100%</td>
              </tr></tfoot>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // ─── RETENTION ───
  const renderRetention = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Lost Patient" value={lostPatients.length + "명"} sub="진료중단 환자" icon={UserMinus} color="red" />
        <MetricCard label="고위험 (80+)" value={lostPatients.filter(p => p.riskScore >= 80).length + "명"} sub="즉시 연락 필요" icon={AlertTriangle} color="red" />
        <MetricCard label="이번달 Turn-away" value={turnawayData[turnawayData.length - 1].count + "명"} trend={-17} icon={XCircle} color="amber" />
        <MetricCard label="추정 미실현 매출" value="9,200만원" sub="Lost Patient 기준" icon={DollarSign} color="purple" />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Lost Patient 목록 (진료 진행 중 미내원)</h3>
          <div className="flex gap-2">
            <button className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 flex items-center gap-1"><MessageSquare size={12} />일괄 문자발송</button>
            <button className="text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 flex items-center gap-1"><Phone size={12} />통화목록 생성</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 text-xs text-gray-500">
              <th className="px-4 py-3 text-left">위험도</th><th className="px-4 py-3 text-left">환자</th><th className="px-4 py-3 text-left">미완료 진료내용</th>
              <th className="px-4 py-3 text-left">담당의사</th><th className="px-4 py-3 text-right">미내원일수</th><th className="px-4 py-3 text-right">마지막내원</th>
              <th className="px-4 py-3 text-center">액션</th>
            </tr></thead>
            <tbody>{lostPatients.sort((a, b) => b.riskScore - a.riskScore).map(p => (
              <tr key={p.id} className={`border-b border-gray-50 hover:bg-red-50/20 ${p.riskScore >= 80 ? "bg-red-50/10" : ""}`}>
                <td className="px-4 py-3"><RiskBadge score={p.riskScore} /></td>
                <td className="px-4 py-3 font-medium">{p.name} <span className="text-gray-400 text-xs">{p.id}</span></td>
                <td className="px-4 py-3 text-xs text-gray-600 max-w-xs">{p.pendingTx}</td>
                <td className="px-4 py-3 text-xs">{p.doctor}</td>
                <td className="px-4 py-3 text-right font-bold text-red-600">{p.daysAway}일</td>
                <td className="px-4 py-3 text-right text-xs text-gray-500">{p.lastVisit}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex gap-1 justify-center">
                    <button className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100"><Phone size={11} /></button>
                    <button className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded hover:bg-green-100"><MessageSquare size={11} /></button>
                  </div>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Turn-away Patient 추이</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={turnawayData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip {...chartTooltipStyle} />
              <Bar dataKey="count" fill="#fca5a5" name="이탈 환자" radius={[3, 3, 0, 0]} />
              <Bar dataKey="contacted" fill="#93c5fd" name="연락 완료" radius={[3, 3, 0, 0]} />
              <Bar dataKey="returned" fill="#86efac" name="복귀 성공" radius={[3, 3, 0, 0]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">미완료 진료 유형별 분포</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={[
                { name: "발치→임플란트", value: 3, color: "#dc2626" },
                { name: "근관→크라운", value: 2, color: "#d97706" },
                { name: "보철 세팅", value: 1, color: "#7c3aed" },
                { name: "교정 체크", value: 1, color: "#2563eb" },
                { name: "잇몸치료", value: 1, color: "#059669" },
              ]} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name} (${value})`} style={{ fontSize: 11 }}>
                {[{ color: "#dc2626" }, { color: "#d97706" }, { color: "#7c3aed" }, { color: "#2563eb" }, { color: "#059669" }].map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  // ─── NEW PATIENT ───
  const renderNewPatient = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="이번달 신환" value={totalNewPt + "명"} trend={12.5} icon={UserPlus} color="blue" />
        <MetricCard label="일평균 신환" value={Math.round(totalNewPt / 22) + "명"} icon={Users} color="green" />
        <MetricCard label="신환당 평균수익" value="142만원" trend={8.3} sub="9개월 누적" icon={DollarSign} color="purple" />
        <MetricCard label="신환 수익비중" value="42.1%" trend={3.2} icon={TrendingUp} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-1">신환 내원기간별 누적수납</h3>
          <p className="text-xs text-gray-400 mb-4">신환 초진일 이후 기간별 평균 수납액 추이</p>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={newPtByPeriod}>
              <defs><linearGradient id="gNp" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7c3aed" stopOpacity={0.2} /><stop offset="100%" stopColor="#7c3aed" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="period" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => (v / 10000).toFixed(0) + "만"} />
              <Tooltip {...chartTooltipStyle} formatter={v => [(v).toLocaleString() + "원"]} />
              <Area type="monotone" dataKey="payments" stroke="#7c3aed" strokeWidth={2.5} fill="url(#gNp)" name="누적수납액" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-1">초진/진료의사별 신환 수납</h3>
          <p className="text-xs text-gray-400 mb-4">초진 의사 기준 vs 실제 진료 의사 기준 수납 비교</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={doctorStats.map(d => ({ name: d.name, 초진기준: Math.round(d.newRevenue9m * 0.7), 진료기준: d.newRevenue9m }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => fmt(v)} />
              <Tooltip {...chartTooltipStyle} formatter={v => [fmtW(v)]} />
              <Bar dataKey="초진기준" fill="#93c5fd" radius={[3, 3, 0, 0]} />
              <Bar dataKey="진료기준" fill="#2563eb" radius={[3, 3, 0, 0]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">월별 신환 수 및 평균 진료비 누계</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={monthlyData.map((m, i) => ({ ...m, avgRevPerNew: Math.round((100 + i * 8 + Math.random() * 20) * 10) / 10 }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={v => fmtW(v)} />
            <Tooltip {...chartTooltipStyle} />
            <Bar yAxisId="left" dataKey="newPatients" fill="#c4b5fd" name="신환수" radius={[3, 3, 0, 0]} />
            <Line yAxisId="right" type="monotone" dataKey="avgRevPerNew" stroke="#dc2626" strokeWidth={2} dot={{ fill: "#dc2626", r: 3 }} name="평균진료비누계(만원)" />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  // ─── CHAIRS ───
  const renderChairs = () => {
    const hours = ["09","10","11","12","13","14","15","16","17","18"];
    const days = ["월","화","수","목","금","토"];
    const getColor = (rate) => {
      if (rate === 0) return "bg-gray-100";
      if (rate < 30) return "bg-red-100 text-red-700";
      if (rate < 50) return "bg-amber-100 text-amber-700";
      if (rate < 70) return "bg-yellow-100 text-yellow-700";
      if (rate < 85) return "bg-emerald-100 text-emerald-700";
      return "bg-emerald-200 text-emerald-800";
    };
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="평균 가동률" value={avgChairRate + "%"} trend={-2.3} icon={Clock} color="blue" />
          <MetricCard label="피크 시간대" value="오전 10~12시" sub="가동률 92%" icon={TrendingUp} color="green" />
          <MetricCard label="저조 시간대" value="오후 4~6시" sub="가동률 38%" icon={TrendingDown} color="red" />
          <MetricCard label="토요일 가동률" value="61%" trend={5.1} icon={Calendar} color="purple" />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-1">체어 가동률 히트맵</h3>
          <p className="text-xs text-gray-400 mb-4">요일/시간대별 체어 점유율 (%)</p>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr>
                <th className="px-2 py-2 text-xs text-gray-500 w-12"></th>
                {hours.map(h => <th key={h} className="px-2 py-2 text-xs text-gray-500 text-center">{h}시</th>)}
              </tr></thead>
              <tbody>{days.map(day => (
                <tr key={day}>
                  <td className="px-2 py-1 text-xs font-medium text-gray-600">{day}</td>
                  {hours.map(hour => {
                    const cell = chairHeatmap.find(c => c.day === day && c.hour === hour);
                    const rate = cell ? cell.rate : 0;
                    return (
                      <td key={hour} className="px-1 py-1">
                        <div className={`rounded-lg text-center py-3 text-xs font-bold ${getColor(rate)}`}>
                          {rate > 0 ? rate + "%" : "-"}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div className="flex items-center gap-3 mt-4 text-xs text-gray-500">
            <span>범례:</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100" />30% 미만</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-100" />30~50%</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-100" />50~70%</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-100" />70~85%</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-200" />85%+</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">의사별 진료시간당 수익 / 체어시간 점유율</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={doctorStats.sort((a, b) => b.revenuePerMin - a.revenuePerMin)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickFormatter={v => (v / 1000).toFixed(0) + "천"} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} unit="%" />
              <Tooltip {...chartTooltipStyle} />
              <Bar yAxisId="left" dataKey="revenuePerMin" fill="#2563eb" name="진료시간당수익(원/분)" radius={[3, 3, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="chairOccupancy" stroke="#dc2626" strokeWidth={2} dot={{ fill: "#dc2626", r: 4 }} name="체어점유율(%)" />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // ─── AI INSIGHTS ───
  const renderInsights = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard label="이번 주 인사이트" value={AI_INSIGHTS.length + "건"} icon={Brain} color="purple" />
        <MetricCard label="긴급 알림" value={AI_INSIGHTS.filter(i => i.priority === "high").length + "건"} icon={AlertTriangle} color="red" />
        <MetricCard label="추정 개선 효과" value="월 2,520만원" icon={Zap} color="green" />
      </div>
      <div className="space-y-4">
        {AI_INSIGHTS.map((ins, i) => <InsightCard key={i} insight={ins} />)}
      </div>
      <div className="bg-gradient-to-r from-blue-50 to-violet-50 rounded-xl border border-blue-100 p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0"><Brain size={20} className="text-white" /></div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">AI에게 질문하기</h3>
            <p className="text-sm text-gray-600 mb-3">데이터 기반으로 경영 관련 질문에 답변합니다</p>
            <div className="flex gap-2">
              <input type="text" placeholder="예: 이번 달 수익이 감소한 원인은?" className="flex-1 text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
              <button className="bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-1"><Zap size={14} />분석</button>
            </div>
            <div className="flex gap-2 mt-3 flex-wrap">
              {["신환 전환율이 낮은 원인은?", "인건비율을 줄이려면?", "가장 수익성 높은 진료항목은?"].map(q => (
                <button key={q} className="text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full hover:bg-gray-50">{q}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const tabContent = {
    overview: renderOverview,
    doctors: renderDoctors,
    payments: renderPayments,
    txmix: renderTxMix,
    retention: renderRetention,
    newpatient: renderNewPatient,
    chairs: renderChairs,
    insights: renderInsights,
  };

  // ═══════════════════════════════════════
  // LAYOUT
  // ═══════════════════════════════════════
  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* SIDEBAR */}
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center"><BarChart3 size={18} className="text-white" /></div>
            <div><div className="font-bold text-sm text-gray-900">DentalBI</div><div className="text-xs text-gray-400">AI 경영 대시보드</div></div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  active ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
                <Icon size={16} className={active ? "text-blue-600" : "text-gray-400"} />
                {tab.label}
                {tab.id === "retention" && lostPtCount > 0 && (
                  <span className="ml-auto text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">{lostPtCount}</span>
                )}
                {tab.id === "insights" && (
                  <span className="ml-auto text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-bold">{AI_INSIGHTS.length}</span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="p-3 border-t border-gray-100">
          <div className="bg-emerald-50 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-emerald-700">동기화 완료</span>
            </div>
            <p className="text-xs text-emerald-600">마지막 동기화: 오늘 02:00</p>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* HEADER */}
        <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="font-bold text-lg text-gray-900">{tabs.find(t => t.id === activeTab)?.label}</h1>
            <p className="text-xs text-gray-400">아나플란트치과 · 2026년 3월</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              {[["today", "오늘"], ["week", "이번주"], ["month", "이번달"], ["quarter", "분기"]].map(([k, l]) => (
                <button key={k} onClick={() => setDateRange(k)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${dateRange === k ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>{l}</button>
              ))}
            </div>
            <select value={selectedDoctor} onChange={e => setSelectedDoctor(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">전체 의사</option>
              {DOCTORS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <button className="relative p-2 rounded-lg hover:bg-gray-100" onClick={() => setShowNotif(!showNotif)}>
              <Bell size={18} className="text-gray-500" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-100"><Settings size={18} className="text-gray-500" /></button>
          </div>
        </header>

        {/* CONTENT */}
        <main className="flex-1 overflow-y-auto p-6">
          {tabContent[activeTab]?.()}
        </main>
      </div>
    </div>
  );
}
