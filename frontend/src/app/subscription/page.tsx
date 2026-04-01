/**
 * 구독 관리 페이지
 * 현재 플랜 표시 + 플랜 비교 + 기능 비교표 + 결제 변경
 */
"use client";

import { useState } from "react";
import {
  Crown, Check, X, Zap, Star, Building2,
  ChevronRight, CreditCard, Calendar, Users,
  Armchair, Stethoscope, ArrowRight,
} from "lucide-react";
import {
  SUBSCRIPTION_PLANS, PLAN_FEATURES,
  type PlanTier, type SubscriptionPlan,
} from "@/lib/plans";

export default function SubscriptionPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  // 현재 플랜 (데모: basic)
  const [currentPlan] = useState<PlanTier>("basic");
  const [showConfirmModal, setShowConfirmModal] = useState<PlanTier | null>(null);

  /** 가격 표시 */
  const displayPrice = (plan: SubscriptionPlan) => {
    if (plan.price === 0) return "무료";
    const price = billingCycle === "annual" ? plan.priceAnnual : plan.price;
    return price.toLocaleString() + "원";
  };

  /** 연간 할인율 */
  const discountPct = (plan: SubscriptionPlan) => {
    if (plan.price === 0) return 0;
    return Math.round((1 - plan.priceAnnual / plan.price) * 100);
  };

  /** 기능 값 렌더링 */
  const renderFeatureValue = (value: boolean | string) => {
    if (value === true) return <Check size={16} className="text-emerald-500 mx-auto" />;
    if (value === false) return <X size={14} className="text-gray-300 mx-auto" />;
    return <span className="text-xs font-medium text-gray-700">{value}</span>;
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      {/* 현재 플랜 상태 */}
      <div className="bg-gradient-to-r from-blue-600 to-violet-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Crown size={20} />
              <span className="text-sm font-medium opacity-80">현재 구독 플랜</span>
            </div>
            <h2 className="text-2xl font-bold">
              {SUBSCRIPTION_PLANS.find(p => p.id === currentPlan)?.name}
            </h2>
            <p className="text-sm opacity-70 mt-1">
              아나플란트치과 · 2026년 4월 15일 갱신 예정
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">
              {displayPrice(SUBSCRIPTION_PLANS.find(p => p.id === currentPlan)!)}
            </div>
            <div className="text-sm opacity-70">/ 월</div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-6 text-sm opacity-80">
          <span className="flex items-center gap-1"><Armchair size={14} />체어 3대 / 3대</span>
          <span className="flex items-center gap-1"><Stethoscope size={14} />의사 2명 / 2명</span>
          <span className="flex items-center gap-1"><Users size={14} />계정 4명 / 5명</span>
          <span className="flex items-center gap-1"><CreditCard size={14} />카드 결제</span>
          <span className="flex items-center gap-1"><Calendar size={14} />월간 결제</span>
        </div>
      </div>

      {/* 빌링 주기 토글 */}
      <div className="flex items-center justify-center gap-3">
        <div className="flex bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              billingCycle === "monthly" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
            }`}
          >
            월간 결제
          </button>
          <button
            onClick={() => setBillingCycle("annual")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
              billingCycle === "annual" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
            }`}
          >
            연간 결제
            <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-semibold">
              최대 20% 할인
            </span>
          </button>
        </div>
      </div>

      {/* 플랜 카드 4개 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {SUBSCRIPTION_PLANS.map((plan) => {
          const isCurrent = plan.id === currentPlan;
          const discount = discountPct(plan);

          return (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl border-2 p-6 transition-all hover:shadow-lg ${
                plan.highlight ? "border-violet-300 shadow-violet-100 shadow-md" : "border-gray-100"
              } ${isCurrent ? "ring-2 ring-blue-500 ring-offset-2" : ""}`}
            >
              {/* 추천 뱃지 */}
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <Star size={11} />가장 인기
                  </span>
                </div>
              )}

              {/* 현재 플랜 뱃지 */}
              {isCurrent && (
                <div className="absolute -top-3 right-4">
                  <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    현재 플랜
                  </span>
                </div>
              )}

              {/* 플랜 헤더 */}
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center mb-4`}>
                {plan.id === "free" && <Zap size={20} className="text-white" />}
                {plan.id === "basic" && <Star size={20} className="text-white" />}
                {plan.id === "professional" && <Crown size={20} className="text-white" />}
                {plan.id === "enterprise" && <Building2 size={20} className="text-white" />}
              </div>

              <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
              <p className="text-xs text-gray-500 mt-1 mb-4">{plan.description}</p>

              {/* 가격 */}
              <div className="mb-5">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-gray-900">{displayPrice(plan)}</span>
                  {plan.price > 0 && <span className="text-sm text-gray-400">/ 월</span>}
                </div>
                {billingCycle === "annual" && discount > 0 && (
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs text-gray-400 line-through">{plan.price.toLocaleString()}원</span>
                    <span className="text-xs font-bold text-emerald-600">-{discount}%</span>
                  </div>
                )}
                {billingCycle === "annual" && plan.price > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    연 {(plan.priceAnnual * 12).toLocaleString()}원 (일시납)
                  </p>
                )}
              </div>

              {/* 주요 제한 */}
              <div className="space-y-2 mb-5 text-xs">
                <div className="flex items-center justify-between text-gray-600">
                  <span>체어</span>
                  <span className="font-semibold">{plan.maxChairs >= 999 ? "무제한" : plan.maxChairs + "대"}</span>
                </div>
                <div className="flex items-center justify-between text-gray-600">
                  <span>의사 계정</span>
                  <span className="font-semibold">{plan.maxDoctors >= 999 ? "무제한" : plan.maxDoctors + "명"}</span>
                </div>
                <div className="flex items-center justify-between text-gray-600">
                  <span>전체 계정</span>
                  <span className="font-semibold">{plan.maxStaff >= 999 ? "무제한" : plan.maxStaff + "명"}</span>
                </div>
              </div>

              {/* CTA 버튼 */}
              {isCurrent ? (
                <button
                  disabled
                  className="w-full py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-400 cursor-not-allowed"
                >
                  현재 이용 중
                </button>
              ) : (
                <button
                  onClick={() => setShowConfirmModal(plan.id)}
                  className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1 ${
                    plan.highlight
                      ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700"
                      : plan.id === "enterprise"
                      ? "bg-gray-900 text-white hover:bg-gray-800"
                      : "bg-white border-2 border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {plan.id === "free" ? "무료 체험" : plan.id === "enterprise" ? "문의하기" : "업그레이드"}
                  <ArrowRight size={14} />
                </button>
              )}

              <p className="text-center text-xs text-gray-400 mt-2">{plan.targetClinic}</p>
            </div>
          );
        })}
      </div>

      {/* 기능 비교표 */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">플랜별 기능 비교</h3>
          <p className="text-sm text-gray-400 mt-1">각 플랜에서 이용할 수 있는 기능을 상세히 비교합니다</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 w-64">기능</th>
                {SUBSCRIPTION_PLANS.map(plan => (
                  <th key={plan.id} className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        plan.id === currentPlan ? "bg-blue-100 text-blue-700" : "text-gray-700"
                      }`}>
                        {plan.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {plan.price === 0 ? "무료" : displayPrice(plan) + "/월"}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PLAN_FEATURES.map((feature, i) => (
                <tr key={i} className={`border-t border-gray-50 ${i % 2 === 0 ? "" : "bg-gray-50/50"}`}>
                  <td className="px-6 py-3 text-sm text-gray-700">{feature.name}</td>
                  <td className="px-4 py-3 text-center">{renderFeatureValue(feature.free)}</td>
                  <td className="px-4 py-3 text-center">{renderFeatureValue(feature.basic)}</td>
                  <td className={`px-4 py-3 text-center ${currentPlan === "professional" ? "bg-violet-50/50" : ""}`}>
                    {renderFeatureValue(feature.professional)}
                  </td>
                  <td className="px-4 py-3 text-center">{renderFeatureValue(feature.enterprise)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ / 부가 안내 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-6">
          <h4 className="font-semibold text-gray-900 mb-3">💡 왜 덴비를 선택하나요?</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2"><Check size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />전자차트 DB를 직접 읽어 실시간 분석 (하나로/덴트웹/원클릭 지원)</li>
            <li className="flex items-start gap-2"><Check size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />진료 중 DB 부하 없음 (NOLOCK 읽기전용 쿼리)</li>
            <li className="flex items-start gap-2"><Check size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />환자 개인정보 해시 처리 — 클라우드에 원본 저장 안 함</li>
            <li className="flex items-start gap-2"><Check size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />서울대 치과경영정보학교실 KPI 기준 분석 설계</li>
          </ul>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100 p-6">
          <h4 className="font-semibold text-gray-900 mb-3">❓ 자주 묻는 질문</h4>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-medium text-gray-800">플랜 변경은 언제든 가능한가요?</p>
              <p className="text-gray-500 mt-0.5">네, 업그레이드는 즉시 적용되며 다운그레이드는 다음 결제일부터 적용됩니다.</p>
            </div>
            <div>
              <p className="font-medium text-gray-800">설치가 어렵진 않나요?</p>
              <p className="text-gray-500 mt-0.5">Basic 이상 플랜은 원격 설치 지원, Professional 이상은 방문 설치를 제공합니다.</p>
            </div>
            <div>
              <p className="font-medium text-gray-800">환불 정책이 있나요?</p>
              <p className="text-gray-500 mt-0.5">결제일로부터 7일 이내 전액 환불이 가능합니다.</p>
            </div>
          </div>
        </div>
      </div>

      {/* 플랜 변경 확인 모달 */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              플랜 변경 확인
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              <strong className="text-gray-900">
                {SUBSCRIPTION_PLANS.find(p => p.id === showConfirmModal)?.name}
              </strong>
              {" "}플랜으로 변경하시겠습니까?
            </p>
            <div className="bg-gray-50 rounded-xl p-4 mb-4 text-sm">
              <div className="flex justify-between mb-1">
                <span className="text-gray-500">월 요금</span>
                <span className="font-bold">{displayPrice(SUBSCRIPTION_PLANS.find(p => p.id === showConfirmModal)!)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">결제 주기</span>
                <span>{billingCycle === "annual" ? "연간 (일시납)" : "월간"}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirmModal(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                취소
              </button>
              <button
                onClick={() => { setShowConfirmModal(null); /* 실제: API 호출 */ }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
              >
                변경 확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
