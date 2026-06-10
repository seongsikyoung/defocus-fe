import { useEffect, useRef } from 'react'
import { getStationStatus } from '@/utils/statusUtils'

export function KakaoMap({ stations, onSelect }) {
  const containerRef = useRef(null)
  const mapRef       = useRef(null)
  const overlaysRef  = useRef([])
  const stationsRef  = useRef(stations)
  const onSelectRef  = useRef(onSelect)

  useEffect(() => { stationsRef.current = stations }, [stations])
  useEffect(() => { onSelectRef.current = onSelect }, [onSelect])

  function drawMarkers(map, stationList) {
    overlaysRef.current.forEach(o => o.setMap(null))
    overlaysRef.current = []

    stationList.forEach(station => {
      const isRiver = station.type === 'river'
      const st      = getStationStatus(station)

      // ── Pin shape paths (both fit viewBox 0 0 36 46) ──
      // River: teardrop — organic, pointed bottom
      // Sewer: shield/crest — flat-sided, pointed-V bottom notch, clearly heraldic
      const pinPath = isRiver
        ? 'M18 2C9.16 2 2 9.16 2 18c0 11 16 26 16 26s16-15 16-26C34 9.16 26.84 2 18 2z'
        : 'M18 2C9.16 2 2 9.16 2 18L2 36Q2 42 8 42L14 42L18 46L22 42L28 42Q34 42 34 36L34 18C34 9.16 26.84 2 18 2z'

      // ── Icon paths inside the pin (circle area centered at cx=18, cy=17) ──
      const iconPaths = isRiver
        // Water waves
        ? `<path d="M9 20 Q12 16.5 15 20 Q18 23.5 21 20 Q24 16.5 27 20"
             stroke="rgba(255,255,255,0.95)" stroke-width="2.3" stroke-linecap="round" fill="none"/>
           <path d="M10 14 Q13 11 16 14 Q19 17 22 14 Q25 11 27 14"
             stroke="rgba(255,255,255,0.55)" stroke-width="1.3" stroke-linecap="round" fill="none"/>`
        // Manhole cover — concentric rings + cardinal ticks
        : `<circle cx="18" cy="17" r="9" stroke="rgba(255,255,255,0.9)" stroke-width="1.7" fill="none"/>
           <circle cx="18" cy="17" r="5" stroke="rgba(255,255,255,0.55)" stroke-width="1.2" fill="none"/>
           <circle cx="18" cy="17" r="1.6" fill="rgba(255,255,255,0.85)"/>
           <path d="M18 8v3M18 23v3M9 17h3M24 17h3"
             stroke="rgba(255,255,255,0.45)" stroke-width="1.1" stroke-linecap="round"/>`

      const div = document.createElement('div')
      div.style.cssText = 'position:relative;display:inline-flex;flex-direction:column;align-items:center;cursor:pointer;'
      div.innerHTML = `
        <div style="
          position:absolute;bottom:50px;left:50%;transform:translateX(-50%);
          background:#1e293b;color:#f8fafc;
          font-size:11px;font-weight:600;line-height:1.3;
          padding:5px 10px;border-radius:7px;white-space:nowrap;
          box-shadow:0 4px 14px rgba(0,0,0,0.28);
          pointer-events:none;opacity:0;transition:opacity 0.15s ease;z-index:9999;
        ">
          ${station.name}
          <div style="
            position:absolute;top:100%;left:50%;transform:translateX(-50%);
            width:0;height:0;
            border-left:5px solid transparent;border-right:5px solid transparent;
            border-top:5px solid #1e293b;
          "></div>
        </div>
        <svg width="36" height="46" viewBox="0 0 36 46" fill="none" xmlns="http://www.w3.org/2000/svg"
          style="display:block;filter:drop-shadow(0 2px 7px ${st.color}90);transition:transform 0.15s ease;">
          <path d="${pinPath}" fill="${st.color}" stroke="white" stroke-width="2.5" stroke-linejoin="round"/>
          <circle cx="18" cy="17" r="12" fill="rgba(255,255,255,0.12)"/>
          ${iconPaths}
        </svg>
      `

      const tooltip = div.firstElementChild
      const svg     = div.lastElementChild

      div.addEventListener('click', () => onSelectRef.current(station))
      div.addEventListener('mouseenter', () => {
        tooltip.style.opacity = '1'
        svg.style.transform = 'scale(1.12)'
      })
      div.addEventListener('mouseleave', () => {
        tooltip.style.opacity = '0'
        svg.style.transform = 'scale(1)'
      })

      const overlay = new window.kakao.maps.CustomOverlay({
        position: new window.kakao.maps.LatLng(station.lat, station.lng),
        content: div,
        yAnchor: 1,
      })
      overlay.setMap(map)
      overlaysRef.current.push(overlay)
    })
  }

  useEffect(() => {
    const KEY = import.meta.env.VITE_KAKAO_MAP_KEY
    if (!KEY || !containerRef.current) return

    const initMap = () => {
      if (!mapRef.current) {
        mapRef.current = new window.kakao.maps.Map(containerRef.current, {
          center: new window.kakao.maps.LatLng(37.52, 127.00),
          level: 9,
        })
      }
      drawMarkers(mapRef.current, stationsRef.current)
    }

    if (window.kakao?.maps) {
      initMap()
    } else {
      const existing = document.getElementById('kakao-maps-sdk')
      if (existing) { existing.onload = () => window.kakao.maps.load(initMap); return }
      const script = document.createElement('script')
      script.id    = 'kakao-maps-sdk'
      script.src   = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KEY}&autoload=false`
      script.async = true
      script.onload = () => window.kakao.maps.load(initMap)
      document.head.appendChild(script)
    }

    return () => overlaysRef.current.forEach(o => o.setMap(null))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!mapRef.current) return
    drawMarkers(mapRef.current, stations)
  }, [stations]) // eslint-disable-line react-hooks/exhaustive-deps

  const noKey = !import.meta.env.VITE_KAKAO_MAP_KEY

  return (
    <div className="relative h-full w-full bg-[#e8eef5]">
      <div ref={containerRef} className="h-full w-full" />

      {noKey && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#e8eef5]">
          <svg className="absolute inset-0 h-full w-full opacity-30" xmlns="http://www.w3.org/2000/svg">
            {Array.from({ length: 20 }).map((_, i) => (
              <line key={`h${i}`} x1="0" y1={`${i * 5}%`} x2="100%" y2={`${i * 5}%`} stroke="#94a3b8" strokeWidth="0.5" />
            ))}
            {Array.from({ length: 20 }).map((_, i) => (
              <line key={`v${i}`} x1={`${i * 5}%`} y1="0" x2={`${i * 5}%`} y2="100%" stroke="#94a3b8" strokeWidth="0.5" />
            ))}
          </svg>
          <div className="relative z-10 flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#3b82f6" />
                <circle cx="12" cy="9" r="2.5" fill="white" />
              </svg>
            </div>
            <p className="text-[13px] font-medium text-[#475569]">카카오맵을 표시하려면</p>
            <code className="rounded-md bg-white px-3 py-1.5 text-[12px] text-[#3b82f6] shadow">
              VITE_KAKAO_MAP_KEY=발급받은키
            </code>
            <p className="text-[12px] text-[#94a3b8]">.env 파일에 추가해주세요</p>
          </div>
          <div className="absolute bottom-20 left-4 right-4 flex flex-wrap gap-1.5">
            {stations.map(s => {
              const st      = getStationStatus(s)
              const isRiver = s.type === 'river'
              return (
                <button key={s.id} onClick={() => onSelect(s)}
                  className="flex items-center gap-1.5 rounded-full border bg-white px-3 py-1.5 text-[11px] font-medium shadow-sm transition-shadow hover:shadow-md"
                  style={{ borderColor: `${st.color}40`, color: st.color }}>
                  {isRiver
                    ? <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                        <path d="M1 7 Q3.5 3.5 6 7 Q8.5 10.5 11 7 Q13.5 3.5 14 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                      </svg>
                    : <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
                        <circle cx="6" cy="6" r="2.2" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
                        <circle cx="6" cy="6" r="0.8" fill="currentColor" opacity="0.7"/>
                      </svg>
                  }
                  {s.name}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
