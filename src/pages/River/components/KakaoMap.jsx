import { useEffect, useRef } from 'react'
import { getStationStatus } from '@/utils/statusUtils'
import { RIVER_ICON_SVG, SEWER_ICON_SVG } from '@/mocks/river'

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
      const icon    = isRiver ? RIVER_ICON_SVG : SEWER_ICON_SVG
      const tail    = isRiver
        ? `<div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:7px solid ${st.color};margin-top:-1px;"></div>`
        : `<div style="width:7px;height:7px;border-radius:50%;background:${st.color};margin-top:3px;border:2px solid #fff;box-shadow:0 1px 5px ${st.color}99;"></div>`

      const div = document.createElement('div')
      div.style.cssText = 'display:flex;flex-direction:column;align-items:center;cursor:pointer;transform:translateY(-100%);'
      div.innerHTML = `
        <div style="display:flex;align-items:center;background:${st.color};color:#fff;font-size:11px;font-weight:700;padding:5px 10px;border-radius:20px;white-space:nowrap;box-shadow:0 2px 10px ${st.color}66;border:2px solid #fff;transition:transform 0.15s;">
          ${icon}${station.name}
        </div>
        ${tail}
      `
      div.addEventListener('click', () => onSelectRef.current(station))
      div.addEventListener('mouseenter', () => { div.children[0].style.transform = 'scale(1.08)' })
      div.addEventListener('mouseleave', () => { div.children[0].style.transform = 'scale(1)' })

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
                    ? <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                        <path d="M0.5 5.5 Q2 2.5 3.5 5.5 Q5 8.5 6.5 5.5 Q8 2.5 9.5 5.5 Q11 8.5 12 5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                      </svg>
                    : <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.3"/>
                        <circle cx="5" cy="5" r="1.4" stroke="currentColor" strokeWidth="0.9" opacity="0.6"/>
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
