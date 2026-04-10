/**
 * 환자 포털 데모 데이터
 * 환자가 볼 수 있는 예약, 진료내역, AI 분석
 */

export interface PatientProfile {
  id: string;
  name: string;
  maskedName: string;
  phone: string;
  birthDate: string;
  clinicName: string;
}

export interface PatientAppointment {
  id: number;
  datetime: string;
  treatment: string;
  doctor: string;
  status: "upcoming" | "completed" | "cancelled";
  notes?: string;
}

export interface TreatmentRecord {
  id: number;
  date: string;
  treatment: string;
  toothNumber?: string;
  doctor: string;
  description: string;
  aiExplanation?: string;
  nextSteps?: string[];
  status: "completed" | "in_progress";
}

/** 데모 환자 프로필 */
export const DEMO_PATIENT: PatientProfile = {
  id: "P001",
  name: "한승수",
  maskedName: "한**",
  phone: "010-1234-8801",
  birthDate: "1990-06-12",
  clinicName: "아나플란트치과",
};

/** 데모 예약 데이터 */
export function genPatientAppointments(): PatientAppointment[] {
  const now = new Date();
  const future = (days: number, hour: number, min: number = 0) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    d.setHours(hour, min, 0, 0);
    return d.toISOString();
  };
  const past = (days: number, hour: number, min: number = 0) => {
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    d.setHours(hour, min, 0, 0);
    return d.toISOString();
  };

  return [
    { id: 1, datetime: future(3, 14, 0), treatment: "보철 세팅 (크라운)", doctor: "김원장", status: "upcoming", notes: "보철물 준비 완료. 시간 엄수 부탁드립니다." },
    { id: 2, datetime: future(10, 10, 30), treatment: "정기검진 + 스케일링", doctor: "박원장", status: "upcoming" },
    { id: 3, datetime: future(24, 15, 0), treatment: "임플란트 2차수술", doctor: "김원장", status: "upcoming", notes: "수술 전 항생제 복용 필요" },
    { id: 4, datetime: past(7, 11, 0), treatment: "크라운 인상(본뜨기)", doctor: "김원장", status: "completed" },
    { id: 5, datetime: past(21, 14, 30), treatment: "근관치료 3회차", doctor: "이원장", status: "completed" },
    { id: 6, datetime: past(35, 10, 0), treatment: "근관치료 2회차", doctor: "이원장", status: "completed" },
    { id: 7, datetime: past(49, 15, 0), treatment: "근관치료 1회차 + 응급처치", doctor: "이원장", status: "completed" },
    { id: 8, datetime: past(90, 11, 0), treatment: "정기검진 + 스케일링", doctor: "박원장", status: "completed" },
  ];
}

/** 데모 진료기록 + AI 분석 */
export function genTreatmentRecords(): TreatmentRecord[] {
  return [
    {
      id: 1,
      date: "2026-04-03",
      treatment: "크라운 인상",
      toothNumber: "#26",
      doctor: "김원장",
      description: "지대치 형성 후 PVS 인상 채득. 임시 크라운 장착.",
      status: "in_progress",
      aiExplanation: "이전에 신경치료를 한 어금니(왼쪽 위 6번)에 씌우는 치료(크라운)를 위해 치아 모양을 다듬고 본을 떴습니다. 지금은 임시 크라운(가짜 이)이 씌워져 있고, 약 7~10일 후 진짜 크라운이 만들어지면 다시 오셔서 붙이게 됩니다.",
      nextSteps: [
        "임시 크라운이 빠지지 않도록 딱딱한 음식은 반대쪽으로 드세요",
        "끈적한 음식(껌, 캐러멜)은 피해주세요",
        "다음 방문 시 최종 크라운을 붙입니다 (약 30분 소요)",
      ],
    },
    {
      id: 2,
      date: "2026-03-20",
      treatment: "근관치료 3회차 (완료)",
      toothNumber: "#26",
      doctor: "이원장",
      description: "근관 충전 완료. GP cone + sealer로 근관 폐쇄. 포스트 공간 확보.",
      status: "completed",
      aiExplanation: "신경치료의 마지막 단계입니다. 치아 내부의 신경이 있던 빈 공간을 특수 재료로 꼼꼼하게 채워 넣었습니다. 이제 신경치료는 모두 끝났고, 다음 단계로 치아를 보호하기 위한 크라운(씌우는 치료)을 진행하게 됩니다.",
      nextSteps: [
        "신경치료 후 치아가 약해져 있으므로 크라운을 씌우는 것이 중요합니다",
        "크라운 치료를 너무 미루면 치아가 깨질 수 있습니다",
      ],
    },
    {
      id: 3,
      date: "2026-03-06",
      treatment: "근관치료 2회차",
      toothNumber: "#26",
      doctor: "이원장",
      description: "근관 성형 및 세척. NiTi file 사용. 근관 길이 측정 완료.",
      status: "completed",
      aiExplanation: "신경치료 두 번째 단계입니다. 치아 안의 신경 통로를 특수 기구로 깨끗하게 청소하고 다듬었습니다. 소독약을 넣어 세균을 없앤 후 다음 방문까지 임시로 막아두었습니다.",
      nextSteps: [
        "치료 부위로 씹는 것을 피해주세요",
        "약간의 불편감이 있을 수 있으나 2~3일 내 사라집니다",
      ],
    },
    {
      id: 4,
      date: "2026-02-20",
      treatment: "근관치료 1회차 + 응급처치",
      toothNumber: "#26",
      doctor: "이원장",
      description: "급성 치수염 진단. 마취 후 치수 제거 및 배농. 항생제 처방.",
      status: "completed",
      aiExplanation: "왼쪽 위 어금니에 심한 충치로 신경에 염증이 생겼습니다. 통증을 줄이기 위해 마취 후 염증이 있는 신경을 제거하고 고름을 빼냈습니다. 항생제를 드시면 통증이 점차 줄어듭니다.",
      nextSteps: [
        "처방된 항생제를 꼭 끝까지 드세요",
        "진통제는 통증이 있을 때 복용하세요",
        "총 3회 정도 더 방문이 필요합니다",
      ],
    },
    {
      id: 5,
      date: "2026-01-10",
      treatment: "정기검진 + 스케일링",
      toothNumber: "전체",
      doctor: "박원장",
      description: "치석 제거(상하악 전체). #26 원심면 C3 충치 발견. 치주 상태 양호.",
      status: "completed",
      aiExplanation: "6개월마다 하는 정기 검진과 스케일링(치석 제거)을 했습니다. 전체적으로 잇몸 상태는 좋지만, 왼쪽 위 어금니(#26)에 꽤 진행된 충치가 발견되었습니다. 신경치료가 필요할 수 있어 다음 방문에서 확인하기로 했습니다.",
      nextSteps: [
        "#26 충치 치료를 빨리 받으셔야 합니다",
        "칫솔질 시 어금니 안쪽까지 꼼꼼하게 닦아주세요",
        "다음 검진: 6개월 후",
      ],
    },
    {
      id: 6,
      date: "2025-07-15",
      treatment: "정기검진",
      toothNumber: "전체",
      doctor: "박원장",
      description: "구강 검진. 치주 상태 양호. 특이사항 없음.",
      status: "completed",
      aiExplanation: "정기 구강 검진 결과 특별한 문제가 발견되지 않았습니다. 잇몸 상태도 양호하고 새로운 충치도 없었습니다.",
      nextSteps: [
        "6개월 후 다음 정기검진 예약 권장",
        "하루 2회 이상 칫솔질 유지",
      ],
    },
  ];
}
