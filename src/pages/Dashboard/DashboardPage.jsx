import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'

// Assets (Figma MCP, valid 7 days from generation)
const IMG_HEADER_LOGO = 'https://www.figma.com/api/mcp/asset/161cce9e-acc8-4905-b7d9-c5fe1e5e9af2'
const IMG_ALERT_DOT   = 'https://www.figma.com/api/mcp/asset/81fbf487-3700-4c28-a07b-453bd2281965'
const IMG_AI_DOT      = 'https://www.figma.com/api/mcp/asset/7032a66f-9877-46e7-aff7-405516da4d1f'
const IMG_LIVE_DOT    = 'https://www.figma.com/api/mcp/asset/2a20294d-966d-4e00-9b2a-5eaa3e021b05'
const IMG_PEAK_DOT    = 'https://www.figma.com/api/mcp/asset/31df3bb2-beb5-47f5-98a3-f3f9b49fdc4d'
const IMG_WARN_DOT    = 'https://www.figma.com/api/mcp/asset/d01da74a-af4e-4595-a593-1c3ab94a4a7f'

const NAV_ITEMS = [
  { label: '종합', sub: '종합현황', active: true,  route: ROUTES.DASHBOARD },
  { label: '강수', sub: '강수현황', active: false, route: ROUTES.RAINFALL  },
  { label: '하천', sub: '하천수위', active: false, route: ROUTES.RIVER },
  { label: '하수', sub: '하수관로', active: false, route: ROUTES.SEWER },
  { label: 'AI',   sub: 'AI분석',   active: false, route: null },
]

const KPI_CARDS = [
  {
    label: '현재 강수량', badge: '정상', badgeBg: 'rgba(30,135,229,0.15)', badgeText: '#1e87e5',
    value: '12.4', unit: 'mm/h', valueColor: '#1e87e5', borderColor: 'rgba(30,135,229,0.2)',
    sub1: 'AWS 89개 관측소 평균', sub2: '+2.1 ↑ (1h 전 대비)', accent: '#1e87e5',
  },
  {
    label: '하천 위험 지점', badge: '주의', badgeBg: 'rgba(254,150,0,0.15)', badgeText: '#fe9600',
    value: '3', unit: '개소', valueColor: '#fe9600', borderColor: 'rgba(254,150,0,0.2)',
    sub1: '홍수주의 이상 발령', sub2: '중랑천·탄천·한강 상류', accent: '#fe9600',
  },
  {
    label: '하수관로 이상', badge: '경보', badgeBg: 'rgba(243,66,54,0.15)', badgeText: '#f34236',
    value: '7', unit: '개소', valueColor: '#f34236', borderColor: 'rgba(243,66,54,0.2)',
    sub1: '수위 70% 초과', sub2: '강남 4 서초 2 송파 1', accent: '#f34236',
  },
  {
    label: '전체 관측소', badge: '운영 중', badgeBg: 'rgba(36,197,82,0.15)', badgeText: '#24c552',
    value: '89', unit: '개소', valueColor: '#24c552', borderColor: 'rgba(36,197,82,0.2)',
    sub1: '정상 79 / 주의 7 / 위험 3', sub2: '14:32 업데이트', accent: '#24c552',
  },
]

const ALERTS = [
  { type: '홍수 경보', typeBg: 'rgba(243,66,54,0.15)', typeText: '#f34236', rowBg: 'rgba(243,66,54,0.07)', time: '14:28', place: '중랑천 상류 망우 관측소' },
  { type: '홍수 주의', typeBg: 'rgba(254,150,0,0.15)',  typeText: '#fe9600', rowBg: 'rgba(254,150,0,0.07)',  time: '14:15', place: '한강 광진 수위관측소' },
  { type: '침수 위험', typeBg: 'rgba(254,150,0,0.15)',  typeText: '#fe9600', rowBg: 'rgba(254,150,0,0.07)',  time: '14:05', place: '강남구 역삼1동 일대' },
  { type: '댐 방류',   typeBg: 'rgba(30,135,229,0.15)', typeText: '#1e87e5', rowBg: 'rgba(30,135,229,0.07)', time: '13:50', place: '소양강댐 320 m³/s' },
]

const DAMS = [
  { name: '소양강댐', info: '235.4m  |  1,240 ㎥/s', pct: 72, color: '#fe9600' },
  { name: '충주댐',   info: '141.2m  |  520 ㎥/s',   pct: 45, color: '#24c552' },
  { name: '대청댐',   info: '72.8m  |  850 ㎥/s',    pct: 58, color: '#1e87e5' },
  { name: '합천댐',   info: '168.1m  |  210 ㎥/s',   pct: 31, color: '#24c552' },
]

const SEWERS = [
  { gu: '강남구',   info: '이상 3/12개소', badge: '경보', badgeBg: 'rgba(243,66,54,0.15)', badgeText: '#f34236' },
  { gu: '서초구',   info: '이상 1/9개소',  badge: '주의', badgeBg: 'rgba(254,150,0,0.15)',  badgeText: '#fe9600' },
  { gu: '관악구',   info: '이상 2/11개소', badge: '경보', badgeBg: 'rgba(243,66,54,0.15)', badgeText: '#f34236' },
  { gu: '동작구',   info: '이상 0/8개소',  badge: '정상', badgeBg: 'rgba(36,197,82,0.15)',  badgeText: '#24c552' },
  { gu: '영등포구', info: '이상 1/10개소', badge: '주의', badgeBg: 'rgba(254,150,0,0.15)',  badgeText: '#fe9600' },
]

const CHART_BARS = [
  { hour: '18시', value: 2.1,  h: 20,  color: 'rgba(28,101,169,0.65)', active: false },
  { hour: '19시', value: 5.3,  h: 51,  color: 'rgba(28,101,169,0.65)', active: false },
  { hour: '20시', value: 8.7,  h: 84,  color: 'rgba(28,101,169,0.65)', active: false },
  { hour: '21시', value: 12.4, h: 120, color: '#1e87e5',               active: true  },
  { hour: '22시', value: 9.2,  h: 89,  color: 'rgba(28,101,169,0.65)', active: false },
  { hour: '23시', value: 6.8,  h: 66,  color: 'rgba(28,101,169,0.65)', active: false },
]

export function DashboardPage() {
  const navigate = useNavigate()
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const timeStr = now.toLocaleTimeString('ko-KR', { hour12: false })

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#edf0f4]">

      {/* ── Header ── */}
      <header className="grid h-14 shrink-0 grid-cols-[72px_1fr_auto] items-center bg-white shadow-[0px_2px_8px_0px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-center">
          <div className="flex size-[30px] items-center justify-center rounded-full bg-[#3b82f6]">
            <span className="text-sm font-bold text-white">D</span>
          </div>
        </div>
        <p className="truncate px-2 text-center text-[13px] font-bold text-[#1e293b] sm:text-[15px]">
          실시간 강수 재난안전 통합 모니터링 시스템
        </p>
        <div className="flex items-center gap-2 pr-4 sm:gap-3 sm:pr-5">
          <div className="flex items-center gap-1.5 rounded-full border border-[#e53333] bg-[#ffe5e5] px-2.5 py-1 sm:px-3">
            <span className="size-[7px] rounded-full bg-[#e53333]" />
            <span className="text-[11px] font-medium text-[#cc1a1a]">경보 3건</span>
          </div>
          <span className="hidden text-[12px] text-[#64748b] sm:block">{timeStr}</span>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex min-h-0 flex-1">

        {/* ── Left Nav ── */}
        <nav className="relative flex w-[72px] shrink-0 flex-col items-center border-r border-[#e2e8f0] bg-white">
          <div className="flex w-full flex-col">
            {NAV_ITEMS.map((item) => (
              <div
                key={item.label}
                onClick={() => item.route && navigate(item.route)}
                className={`relative flex w-full flex-col items-center py-3 md:py-4 ${
                  item.active
                    ? 'bg-[rgba(185,217,254,0.4)]'
                    : `${item.route ? 'cursor-pointer hover:bg-[#f1f5f9]' : ''}`
                }`}
              >
                {item.active && (
                  <div className="absolute left-0 top-1/2 h-11 w-[3px] -translate-y-1/2 rounded-r-[2px] bg-[#3b82f6]" />
                )}
                <span className={`text-[13px] md:text-[14px] ${item.active ? 'font-bold text-[#3b82f6]' : 'font-medium text-[#64748b]'}`}>
                  {item.label}
                </span>
                <span className={`text-[8px] md:text-[9px] ${item.active ? 'text-[#3b82f6]' : 'text-[#64748b]'}`}>
                  {item.sub}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-auto flex w-full cursor-pointer flex-col items-center py-3 hover:bg-[#f1f5f9] md:py-4">
            <span className="text-[13px] font-medium text-[#64748b] md:text-[14px]">설정</span>
            <span className="text-[8px] text-[#64748b] md:text-[9px]">설정</span>
          </div>
        </nav>

        {/* ── Content ── */}
        <main className="flex flex-1 flex-col gap-4 overflow-auto p-4 md:p-6 scrollbar-hide">

          {/* Row 1 – KPI Cards */}
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            {KPI_CARDS.map((card, i) => (
              <div
                key={card.label}
                className="animate-slide-up flex flex-col gap-2.5 rounded-xl border bg-white p-5 shadow-[0px_2px_12px_0px_rgba(38,64,102,0.1)]"
                style={{ borderColor: card.borderColor, animationDelay: `${i * 80}ms` }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium text-[#66809b]">{card.label}</span>
                  <span
                    className="rounded-[5px] px-2 py-[3px] text-[10px] font-semibold"
                    style={{ background: card.badgeBg, color: card.badgeText }}
                  >
                    {card.badge}
                  </span>
                </div>
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-bold leading-none xl:text-[36px]" style={{ color: card.valueColor }}>
                    {card.value}
                  </span>
                  <span className="mb-1 text-sm text-[#66809b]">{card.unit}</span>
                </div>
                <p className="text-[11px] text-[#97abc1]">{card.sub1}</p>
                <p className="text-[11px] text-[#97abc1]">{card.sub2}</p>
                <div className="h-[3px] w-8 rounded-[2px]" style={{ background: card.accent }} />
              </div>
            ))}
          </div>

          {/* Row 2 – AI Card + Alert Card */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

            {/* AI 재난 예측 분석 */}
            <div className="animate-slide-up flex flex-col gap-3 rounded-xl border border-[rgba(0,184,209,0.2)] bg-white px-6 py-5 shadow-[0px_2px_12px_0px_rgba(38,64,102,0.1)]" style={{ animationDelay: '320ms' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src={IMG_AI_DOT} alt="" className="size-[8px]" />
                  <span className="text-[13px] font-semibold text-[#00b8d1]">AI 재난 예측 분석</span>
                </div>
                <div className="flex items-center gap-1 rounded-[6px] border border-[rgba(219,226,234,0.5)] bg-white px-2.5 py-1">
                  <img src={IMG_LIVE_DOT} alt="" className="size-[6px]" />
                  <span className="text-[11px] text-[#66809b]">14:32 분석</span>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-[rgba(243,66,54,0.25)] bg-[rgba(243,66,54,0.08)] px-4 py-2.5">
                <span className="text-[12px] font-medium text-[#66809b]">종합 위험도</span>
                <span className="rounded-[5px] bg-[rgba(243,66,54,0.2)] px-2 py-[3px] text-[10px] font-semibold text-[#f34236]">
                  🔴&nbsp;&nbsp;높음 — Level 3
                </span>
              </div>
              <p className="text-[12px] leading-5 text-[#1b2c42]">
                중랑천 상류(망우 관측소) 수위가 급격히 상승 중이며, 현재 강수량(12.4 mm/h) 지속 시 약 1.5시간 내 홍수경보 기준(5.0m) 초과가 예상됩니다. 소양강댐 방류(320 m³/s)로 한강 하류 연쇄 상승이 우려되며, 강남구 역삼·논현동 하수관로 포화 위험이 감지됩니다.
              </p>
              <p className="text-[11px] font-semibold text-[#66809b]">권고 조치 사항</p>
              <div className="flex flex-col gap-1.5">
                {[
                  { color: '#f34236', text: '중랑천·탄천 하류 지역 주민 대피 권고 발령 즉시 검토' },
                  { color: '#fe9600', text: '강남구 역삼1동·논현동 하수관로 역류 현장 점검 시행' },
                  { color: '#fe9600', text: '소양강댐 하류 지자체 협조 요청 및 방류량 모니터링 강화' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="mt-[5px] size-[4px] shrink-0 rounded-[2px]" style={{ background: item.color }} />
                    <p className="text-[11px] leading-[17px] text-[#1b2c42]">{item.text}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2.5">
                <button className="rounded-lg bg-[#1e87e5] px-3.5 py-2 text-[11px] font-medium text-white">상세 분석 보고서</button>
                <button className="rounded-lg border border-[#dbe2ea] bg-white px-3.5 py-2 text-[11px] font-medium text-[#66809b]">대피 경로 지도</button>
                <button className="rounded-lg border border-[#dbe2ea] bg-white px-3.5 py-2 text-[11px] font-medium text-[#66809b]">기관 공유</button>
              </div>
            </div>

            {/* 실시간 경보 현황 */}
            <div className="animate-slide-up flex flex-col gap-2.5 rounded-xl bg-white p-5 shadow-[0px_2px_12px_0px_rgba(38,64,102,0.1)]" style={{ animationDelay: '400ms' }}>
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-[#1b2c42]">실시간 경보 현황</span>
                <span className="rounded-[5px] bg-[rgba(243,66,54,0.15)] px-2 py-[3px] text-[10px] font-semibold text-[#f34236]">경보 3건</span>
              </div>
              {ALERTS.map((a, i) => (
                <div key={i} className="flex flex-col gap-1 rounded-lg px-3 py-2.5" style={{ background: a.rowBg }}>
                  <div className="flex items-center justify-between">
                    <span className="rounded-[5px] px-2 py-[3px] text-[10px] font-semibold" style={{ background: a.typeBg, color: a.typeText }}>
                      {a.type}
                    </span>
                    <span className="text-[10px] text-[#97abc1]">{a.time}</span>
                  </div>
                  <p className="text-[11px] font-medium text-[#1b2c42]">{a.place}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Row 3 – Dam + Sewer + Chart */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">

            {/* 댐 방류 현황 */}
            <div className="animate-slide-up flex flex-col gap-3 rounded-xl border border-[#dbe2ea] bg-white p-5 shadow-[0px_2px_12px_0px_rgba(38,64,102,0.1)]" style={{ animationDelay: '480ms' }}>
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-semibold text-[#1b2c42]">댐 방류 현황</span>
                <span className="rounded-[10px] bg-[rgba(254,150,0,0.2)] px-2.5 py-[3px] text-[11px] font-medium text-[#fe9600]">방류중</span>
              </div>
              {DAMS.map((dam) => (
                <div key={dam.name} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-[#1b2c42]">{dam.name}</span>
                    <span className="text-[12px] text-[#66809b]">{dam.info}</span>
                  </div>
                  <div className="relative h-2 w-full rounded-full bg-[#dbe2ea]">
                    <div
                      className="absolute left-0 top-0 h-2 rounded-full"
                      style={{ width: `${dam.pct}%`, background: dam.color }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* 하수관로 수위 현황 */}
            <div className="animate-slide-up flex flex-col gap-2.5 rounded-xl border border-[#dbe2ea] bg-white p-5 shadow-[0px_2px_12px_0px_rgba(38,64,102,0.1)]" style={{ animationDelay: '560ms' }}>
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-semibold text-[#1b2c42]">하수관로 수위 현황</span>
                <span className="text-[12px] text-[#66809b]">구별</span>
              </div>
              <div className="h-px bg-[#dbe2ea]" />
              {SEWERS.map((s) => (
                <div key={s.gu} className="flex h-9 items-center justify-between rounded-[6px] bg-[#eef1f4] px-3">
                  <span className="flex-1 text-[13px] font-medium text-[#1b2c42]">{s.gu}</span>
                  <span className="text-[12px] text-[#66809b]">{s.info}</span>
                  <div className="ml-2 flex h-5 w-11 items-center justify-center rounded" style={{ background: s.badgeBg }}>
                    <span className="text-[11px] font-semibold" style={{ color: s.badgeText }}>{s.badge}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* 시간별 강수량 추이 */}
            <div className="animate-slide-up flex flex-col gap-3.5 rounded-xl border border-[#dbe2ea] bg-white p-5 shadow-[0px_2px_12px_0px_rgba(38,64,102,0.1)] md:col-span-2 lg:col-span-1" style={{ animationDelay: '640ms' }}>
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-semibold text-[#1b2c42]">시간별 강수량 추이</span>
                <span className="text-[12px] text-[#66809b]">최근 6시간 (mm/h)</span>
              </div>
              <div className="flex h-[180px] items-end justify-between rounded-lg bg-[#eef1f4] px-4 py-3">
                {CHART_BARS.map((bar) => (
                  <div key={bar.hour} className="flex h-full w-9 flex-col items-center justify-end gap-1">
                    <span className={`text-[11px] font-medium ${bar.active ? 'text-[#1b2c42]' : 'text-[#66809b]'}`}>
                      {bar.value}
                    </span>
                    <div
                      className="w-6 rounded"
                      style={{ height: bar.h, background: bar.color }}
                    />
                    <span className="text-[10px] text-[#97abc1]">{bar.hour}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <div className="flex items-center gap-1.5">
                  <img src={IMG_PEAK_DOT} alt="" className="size-[8px]" />
                  <span className="text-[11px] text-[#66809b]">피크 (12.4 mm/h)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <img src={IMG_WARN_DOT} alt="" className="size-[8px]" />
                  <span className="text-[11px] text-[#66809b]">경보 기준 (10.0 mm/h)</span>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  )
}
