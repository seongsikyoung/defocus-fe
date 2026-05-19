import { useState } from 'react'

// District shape images from Figma (valid for 7 days from generation)
const DISTRICT_IMGS = {
  도봉구:   'https://www.figma.com/api/mcp/asset/039ee1cd-c6af-4e38-83d5-a0fb8b534037',
  노원구:   'https://www.figma.com/api/mcp/asset/23affb49-f137-420e-a6da-717e8e145e32',
  강북구:   'https://www.figma.com/api/mcp/asset/21cbebb0-ca3e-48c6-9c35-44d9e1e63d6a',
  은평구:   'https://www.figma.com/api/mcp/asset/a2260e05-ab1d-44d4-9901-d774db702c4e',
  성북구:   'https://www.figma.com/api/mcp/asset/4b2f719e-90fb-402f-8eb8-43fa065d5609',
  중랑구:   'https://www.figma.com/api/mcp/asset/21c0b392-8891-47b7-abc4-b5338ff9cfc6',
  서대문구: 'https://www.figma.com/api/mcp/asset/29ca6b0f-d3b6-41a4-8f25-ff5fd04117c1',
  종로구:   'https://www.figma.com/api/mcp/asset/c1f55f58-626c-4759-9d30-cedcfde18d3a',
  동대문구: 'https://www.figma.com/api/mcp/asset/d20da492-3757-4c67-ab32-476a8b1c5f2f',
  광진구:   'https://www.figma.com/api/mcp/asset/80730a69-fde4-4b95-8bc6-2b894dc3db2a',
  마포구:   'https://www.figma.com/api/mcp/asset/907d83a3-262c-4920-a0f6-139b20353b85',
  용산구:   'https://www.figma.com/api/mcp/asset/3bba8195-5ced-4691-a40c-f24765bcbf47',
  중구:     'https://www.figma.com/api/mcp/asset/5ad769fe-7c22-4e89-8fcf-18b4ba48f83b',
  성동구:   'https://www.figma.com/api/mcp/asset/693ff6eb-1c2d-4307-b067-40cd53573b5e',
  강동구:   'https://www.figma.com/api/mcp/asset/a29e5057-6b97-4efb-80f4-2165b9642ba2',
  양천구:   'https://www.figma.com/api/mcp/asset/1d98ac57-3b06-4681-ba11-9fff89cbe4f7',
  영등포구: 'https://www.figma.com/api/mcp/asset/b0005b96-c53b-4e39-ad24-f6976fb3713f',
  동작구:   'https://www.figma.com/api/mcp/asset/463c43a3-1f0e-49a8-9e39-479badced936',
  서초구:   'https://www.figma.com/api/mcp/asset/7ef985d3-cc78-4092-b473-ae52ace3de72',
  강남구:   'https://www.figma.com/api/mcp/asset/b6e212a1-0699-46e9-9344-5e81615fb6c6',
  강서구:   'https://www.figma.com/api/mcp/asset/398741b6-8cff-49e6-b274-d945d2c449a4',
  구로구:   'https://www.figma.com/api/mcp/asset/d7604854-9999-455a-85cf-82743631560a',
  관악구:   'https://www.figma.com/api/mcp/asset/2a4f41c5-da2a-4671-bdcc-afa73a80d6cd',
  금천구:   'https://www.figma.com/api/mcp/asset/c8eb221c-d6d0-408b-adb5-6257c92627d2',
  송파구:   'https://www.figma.com/api/mcp/asset/7f2f645f-16e9-439c-a030-1dc3fde33841',
}

const LEGEND_DOTS = [
  'https://www.figma.com/api/mcp/asset/3da28e7e-de24-4db2-a137-e6d7517b5e17',
  'https://www.figma.com/api/mcp/asset/3cc423b7-a43f-43e3-a43f-213f73656e57',
  'https://www.figma.com/api/mcp/asset/772273c8-79e0-4ec2-b5d6-8aa2fcfb1e2a',
  'https://www.figma.com/api/mcp/asset/ac33f862-107c-4c4b-8991-3695a14e9b30',
  'https://www.figma.com/api/mcp/asset/aa3a4c0e-3b2f-4f51-96ac-ea42e1906f68',
]

const AWS_MARKER = 'https://www.figma.com/api/mcp/asset/b83852ac-dafc-4ec3-bd9c-a2a788b00963'
const LOGO_ELLIPSE = 'https://www.figma.com/api/mcp/asset/d87c852d-8f43-4e7c-95a9-25f8dab53f12'
const ALERT_DOT = 'https://www.figma.com/api/mcp/asset/53bb1a02-dcc0-4b84-89cd-f6cad05c77f4'

const TIME_FILTERS = ['1시간', '3시간', '6시간', '12시간', '24시간']

const NAV_ITEMS = [
  { label: '종합', sub: '종합현황', active: false },
  { label: '강수', sub: '강수현황', active: true },
  { label: '하천', sub: '하천수위', active: false },
  { label: '하수', sub: '하수관로', active: false },
  { label: 'AI',  sub: 'AI분석',   active: false },
]

const DISTRICTS = [
  { name: '도봉구', value: 8.5,  left: 395, top: 10,  w: 160, h: 155 },
  { name: '노원구', value: 13.1, left: 510, top: 0,   w: 255, h: 200 },
  { name: '강북구', value: 9.2,  left: 270, top: 30,  w: 175, h: 140 },
  { name: '은평구', value: 5.7,  left: 50,  top: 50,  w: 195, h: 278 },
  { name: '성북구', value: 18.6, left: 245, top: 132, w: 303, h: 158 },
  { name: '중랑구', value: 23.4, left: 548, top: 192, w: 180, h: 173 },
  { name: '서대문구',value: 7.3, left: 132, top: 262, w: 120, h: 100 },
  { name: '종로구', value: 15.2, left: 255, top: 234, w: 147, h: 96  },
  { name: '동대문구',value: 21.7,left: 435, top: 240, w: 127, h: 125 },
  { name: '광진구', value: 28.9, left: 562, top: 280, w: 180, h: 148 },
  { name: '마포구', value: 6.8,  left: 50,  top: 322, w: 185, h: 112 },
  { name: '용산구', value: 11.5, left: 222, top: 328, w: 183, h: 116 },
  { name: '중구',   value: 14.3, left: 358, top: 304, w: 114, h: 106 },
  { name: '성동구', value: 26.4, left: 442, top: 320, w: 163, h: 150 },
  { name: '강동구', value: 20.1, left: 685, top: 175, w: 163, h: 325 },
  { name: '양천구', value: 4.3,  left: 48,  top: 392, w: 154, h: 125 },
  { name: '영등포구',value: 8.8, left: 178, top: 434, w: 140, h: 80  },
  { name: '동작구', value: 17.3, left: 272, top: 417, w: 178, h: 117 },
  { name: '서초구', value: 33.7, left: 385, top: 412, w: 217, h: 188 },
  { name: '강남구', value: 44.2, left: 582, top: 410, w: 180, h: 160 },
  { name: '강서구', value: 3.9,  left: 20,  top: 320, w: 58,  h: 214 },
  { name: '구로구', value: 5.1,  left: 75,  top: 482, w: 175, h: 110 },
  { name: '관악구', value: 20.8, left: 265, top: 462, w: 165, h: 140 },
  { name: '금천구', value: 9.7,  left: 245, top: 517, w: 135, h: 95  },
  { name: '송파구', value: 39.6, left: 590, top: 462, w: 210, h: 160 },
]

const DISTRICT_LABEL_OFFSET = {
  도봉구:   { lx: 470.5, ty: 78  },
  노원구:   { lx: 627.5, ty: 85  },
  강북구:   { lx: 350.5, ty: 98  },
  은평구:   { lx: 140.5, ty: 180 },
  성북구:   { lx: 387.5, ty: 202 },
  중랑구:   { lx: 622.5, ty: 268 },
  서대문구: { lx: 186,   ty: 305 },
  종로구:   { lx: 320.5, ty: 277 },
  동대문구: { lx: 488,   ty: 295 },
  광진구:   { lx: 640.5, ty: 345 },
  마포구:   { lx: 134.5, ty: 368 },
  용산구:   { lx: 304.5, ty: 377 },
  중구:     { lx: 402.5, ty: 358 },
  성동구:   { lx: 514.5, ty: 390 },
  강동구:   { lx: 750.5, ty: 328 },
  양천구:   { lx: 114.5, ty: 445 },
  영등포구: { lx: 244,   ty: 463 },
  동작구:   { lx: 350.5, ty: 465 },
  서초구:   { lx: 480.5, ty: 505 },
  강남구:   { lx: 660.5, ty: 478 },
  강서구:   { lx: 27.5,  ty: 405 },
  구로구:   { lx: 155.5, ty: 527 },
  관악구:   { lx: 340.5, ty: 535 },
  금천구:   { lx: 302.5, ty: 560 },
  송파구:   { lx: 687.5, ty: 535 },
}

const AWS_MARKERS = [
  { left: 316, top: 266 }, { left: 486, top: 161 },
  { left: 626, top: 256 }, { left: 406, top: 386 },
  { left: 576, top: 436 }, { left: 196, top: 376 },
  { left: 706, top: 426 },
]

const RANKINGS = [
  { rank: 1, name: '강남구',  value: 44.2, level: '경계', bg: '#feddbe', text: '#8c300a', stripe: false },
  { rank: 2, name: '송파구',  value: 39.6, level: '경계', bg: '#feddbe', text: '#8c300a', stripe: true  },
  { rank: 3, name: '서초구',  value: 33.7, level: '경계', bg: '#feddbe', text: '#8c300a', stripe: false },
  { rank: 4, name: '광진구',  value: 28.9, level: '주의', bg: '#feefc9', text: '#8c520a', stripe: true  },
  { rank: 5, name: '성동구',  value: 26.4, level: '주의', bg: '#feefc9', text: '#8c520a', stripe: false },
  { rank: 6, name: '중랑구',  value: 23.4, level: '주의', bg: '#feefc9', text: '#8c520a', stripe: true  },
  { rank: 7, name: '동대문구',value: 21.7, level: '주의', bg: '#feefc9', text: '#8c520a', stripe: false },
]

const ALERTS = [
  { gu: '강남구', type: '호우 경보',  time: '14:20', desc: '시간당 44mm 이상 — 도심 침수 위험', bg: '#fff0f0', titleColor: '#b81515' },
  { gu: '서초구', type: '호우 경보',  time: '14:25', desc: '시간당 34mm — 배수불량 구간 침수',   bg: '#fff0f0', titleColor: '#b81515' },
  { gu: '송파구', type: '호우 주의보', time: '14:28', desc: '3시간 누적 62mm — 관심 필요',        bg: '#fff7e5', titleColor: '#8c520a' },
]

const LEGEND_LABELS = ['정상', '관심', '주의', '경계', '위험']

export function DashboardPage() {
  const [activeFilter, setActiveFilter] = useState('1시간')

  return (
    <div className="relative bg-[#f1f5f9]" style={{ width: 1440, height: 900 }}>

      {/* ── Header ── */}
      <div className="absolute left-0 top-0 h-[56px] w-full bg-white shadow-[0px_2px_8px_0px_rgba(0,0,0,0.06)]">
        <img src={LOGO_ELLIPSE} alt="" className="absolute left-[20px] top-[13px] size-[30px]" />
        <p className="absolute left-[58px] top-[21px] text-[12px] font-medium text-[#1e293b]">
          재난안전 모니터링
        </p>
        <p className="absolute left-1/2 top-[16px] -translate-x-1/2 text-[16px] font-bold text-[#1e293b]">
          실시간 강수 모니터링 시스템
        </p>
        <div className="absolute left-[1173px] top-[16px] flex h-[24px] w-[80px] items-center gap-[6px] rounded-[12px] border border-[#e53333] bg-[#ffe5e5] px-[9px]">
          <img src={ALERT_DOT} alt="" className="size-[7px]" />
          <span className="text-[11px] font-medium text-[#cc1a1a]">경보 2건</span>
        </div>
        <p className="absolute left-[1268px] top-[20px] text-[12px] text-[#64748b]">
          2025.05.11 14:32:17
        </p>
      </div>

      {/* ── Left Nav ── */}
      <div className="absolute left-0 top-[56px] h-[844px] w-[72px] bg-white shadow-[2px_0px_6px_0px_rgba(0,0,0,0.05)]">
        <div className="absolute left-0 top-0 h-full w-px bg-[#e2e8f0]" style={{ left: 71 }} />
        {NAV_ITEMS.map((item, i) => {
          const tops = [38, 126, 214, 302, 390]
          return (
            <div key={item.label} className="absolute left-0 w-full" style={{ top: tops[i] }}>
              {item.active && (
                <div className="absolute left-0 h-[44px] w-[3px] rounded-[2px] bg-[#3b82f6]" style={{ top: -4 }} />
              )}
              {item.active && (
                <div className="absolute left-[4px] h-[72px] w-[64px] rounded-[8px] bg-[rgba(185,217,254,0.4)]" style={{ top: -16 }} />
              )}
              <p className={`text-center text-[14px] font-medium ${item.active ? 'font-bold text-[#3b82f6]' : 'text-[#64748b]'}`}>
                {item.label}
              </p>
              <p className={`mt-[0px] text-center text-[9px] ${item.active ? 'text-[#3b82f6]' : 'text-[#64748b]'}`}>
                {item.sub}
              </p>
            </div>
          )
        })}
        <div className="absolute bottom-[56px] w-full text-center">
          <p className="text-[14px] font-medium text-[#64748b]">설정</p>
          <p className="text-[9px] text-[#64748b]">설정</p>
        </div>
      </div>

      {/* ── Content Area ── */}
      <div className="absolute left-[72px] top-[56px] flex h-[844px] w-[1368px] flex-col gap-0 overflow-hidden p-[16px]">

        {/* Filter Bar */}
        <div className="flex h-[40px] w-full shrink-0 items-center gap-[12px] rounded-[8px] border border-[#e2e8f0] bg-white px-[16px]">
          <span className="text-[13px] font-medium text-[#64748b]">기간 선택:</span>
          {TIME_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`h-[28px] w-[64px] rounded-[6px] border text-[12px] font-medium transition-colors ${
                activeFilter === f
                  ? 'border-[#3b82f6] bg-[#3b82f6] text-white'
                  : 'border-[#e2e8f0] bg-[#f1f5f9] text-[#64748b]'
              }`}
            >
              {f}
            </button>
          ))}
          <div className="flex-1" />
          <span className="text-[12px] text-[#64748b]">최종 갱신: 14:32:17 &nbsp;(10분 단위 갱신)</span>
        </div>

        {/* Main Row */}
        <div className="mt-[12px] flex h-[768px] shrink-0 gap-[12px]">

          {/* Map Panel */}
          <div className="relative h-[768px] w-[860px] shrink-0 overflow-hidden rounded-[10px] border border-[#e2e8f0] bg-white">
            {/* Map Header */}
            <div className="flex h-[48px] items-center justify-center gap-0 px-[16px]">
              <span className="text-[15px] font-semibold text-[#1e293b]">서울시 구별 강수량 현황</span>
              <span className="text-[12px] text-[#64748b]">&nbsp;&nbsp;&nbsp;&nbsp;단위: mm/hr</span>
            </div>
            <div className="absolute left-0 top-[47px] h-px w-full bg-[#e2e8f0]" />

            {/* Map Container */}
            <div className="absolute left-0 top-[48px] h-[700px] w-[860px] overflow-hidden bg-[#f7fbff]">

              {/* District shapes */}
              {DISTRICTS.map((d) => (
                <div
                  key={d.name}
                  className="absolute"
                  style={{ left: d.left, top: d.top, width: d.w, height: d.h }}
                >
                  <img alt={d.name} className="size-full" src={DISTRICT_IMGS[d.name]} />
                </div>
              ))}

              {/* District labels */}
              {DISTRICTS.map((d) => {
                const pos = DISTRICT_LABEL_OFFSET[d.name]
                return (
                  <div key={`label-${d.name}`} className="absolute -translate-x-1/2" style={{ left: pos.lx, top: pos.ty }}>
                    <p className="text-center text-[9px] font-medium text-[#1e293b] whitespace-nowrap">{d.name}</p>
                    <p className="text-center text-[8px] text-[#64748b] whitespace-nowrap">{d.value}</p>
                  </div>
                )
              })}

              {/* AWS sensor markers */}
              {AWS_MARKERS.map((m, i) => (
                <img key={i} src={AWS_MARKER} alt="" className="absolute size-[8px]" style={{ left: m.left, top: m.top }} />
              ))}

              {/* Legend */}
              <div className="absolute bottom-[20px] left-[20px] flex h-[32px] w-[400px] items-center rounded-[6px] bg-[rgba(255,255,255,0.88)] px-[8px]">
                <span className="text-[10px] font-medium text-[#1e293b]">강수 단계:</span>
                {LEGEND_LABELS.map((label, i) => (
                  <span key={label} className="ml-[14px] flex items-center gap-[4px]">
                    <img src={LEGEND_DOTS[i]} alt="" className="size-[10px]" />
                    <span className="text-[10px] text-[#1e293b]">{label}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="flex h-[768px] w-[464px] shrink-0 flex-col gap-[10px]">

            {/* KPI - 평균 강수량 */}
            <div className="relative h-[80px] w-full shrink-0 overflow-hidden rounded-[10px] border border-[#e2e8f0] bg-white">
              <p className="absolute left-[15px] top-[13px] text-[12px] text-[#64748b]">서울시 평균 강수량</p>
              <p className="absolute left-[15px] top-[33px] text-[22px] font-bold text-[#3b82f6]">18.4</p>
              <p className="absolute left-[66px] top-[43px] text-[12px] text-[#64748b]">mm/hr</p>
              <p className="absolute left-[339px] top-[33px] text-[11px] text-[#64748b]">▲ 3.2 전시간 대비</p>
            </div>

            {/* KPI - 최고 강수량 */}
            <div className="relative h-[80px] w-full shrink-0 overflow-hidden rounded-[10px] border border-[#e2e8f0] bg-white">
              <p className="absolute left-[15px] top-[13px] text-[12px] text-[#64748b]">최고 강수량 지역</p>
              <p className="absolute left-[15px] top-[33px] text-[22px] font-bold text-[#ed8936]">44.2</p>
              <p className="absolute left-[69px] top-[43px] text-[12px] text-[#64748b]">mm/hr (강남구)</p>
              <p className="absolute left-[339px] top-[33px] text-[11px] text-[#64748b]">⚠ 경계 단계</p>
            </div>

            {/* KPI - 경보 발령 */}
            <div className="relative h-[80px] w-full shrink-0 overflow-hidden rounded-[10px] border border-[#e2e8f0] bg-white">
              <p className="absolute left-[15px] top-[13px] text-[12px] text-[#64748b]">경보 발령 구</p>
              <p className="absolute left-[15px] top-[33px] text-[22px] font-bold text-[#e53e3e]">3</p>
              <p className="absolute left-[34px] top-[43px] text-[12px] text-[#64748b]">개구</p>
              <p className="absolute left-[339px] top-[33px] text-[11px] text-[#64748b]">강남/서초/송파</p>
            </div>

            {/* District Ranking */}
            <div className="relative h-[310px] w-full shrink-0 overflow-hidden rounded-[10px] border border-[#e2e8f0] bg-white">
              <p className="absolute left-[15px] top-[13px] text-[13px] font-semibold text-[#1e293b]">
                구별 강수량 순위 (Top 7)
              </p>
              {RANKINGS.map((r, i) => (
                <div
                  key={r.rank}
                  className="absolute left-[15px] h-[32px] w-[432px] overflow-hidden rounded-[4px]"
                  style={{
                    top: 43 + i * 36,
                    backgroundColor: r.stripe ? '#f9fbfe' : 'transparent',
                  }}
                >
                  <p className="absolute left-[8px] top-[8px] text-[13px] font-bold text-[#64748b]">{r.rank}</p>
                  <p className="absolute left-[30px] top-[8px] text-[13px] font-medium text-[#1e293b]">{r.name}</p>
                  <p className="absolute left-[180px] top-[8px] text-[13px] font-medium" style={{ color: r.text }}>
                    {r.value} mm/hr
                  </p>
                  <div
                    className="absolute left-[378px] top-[6px] flex h-[20px] w-[44px] items-center justify-center rounded-[4px]"
                    style={{ backgroundColor: r.bg }}
                  >
                    <span className="text-[11px] font-medium" style={{ color: r.text }}>{r.level}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Alert Panel */}
            <div className="relative h-[238px] w-full shrink-0 overflow-hidden rounded-[10px] border border-[#e2e8f0] bg-white">
              <p className="absolute left-[15px] top-[13px] text-[13px] font-semibold text-[#e53e3e]">
                ⚠&nbsp;&nbsp;경보 현황
              </p>
              {ALERTS.map((a, i) => (
                <div
                  key={i}
                  className="absolute left-[15px] h-[56px] w-[432px] overflow-hidden rounded-[6px]"
                  style={{ top: 41 + i * 62, backgroundColor: a.bg }}
                >
                  <p className="absolute left-[10px] top-[8px] text-[13px] font-semibold whitespace-pre" style={{ color: a.titleColor }}>
                    {`${a.gu}  ${a.type}`}
                  </p>
                  <p className="absolute left-[390px] top-[8px] text-[11px] text-[#64748b]">{a.time}</p>
                  <p className="absolute left-[10px] top-[30px] text-[11px] text-[#1e293b]">{a.desc}</p>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
