import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import polylabel from 'polylabel'
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '@/api/admin'
import geoData from '../../../gu.json'

const DISTRICT_COLORS = {
  idle:    '#94a3b8',
  loading: '#fbbf24',
  ok:      '#22c55e',
  error:   '#ef4444',
}

const LEGEND = [
  { label: '미실행', state: 'idle'    },
  { label: '진행 중', state: 'loading' },
  { label: '완료',   state: 'ok'      },
  { label: '실패',   state: 'error'   },
]

export function AdminPage() {
  const containerRef = useRef(null)
  const svgRef       = useRef(null)
  const initializedRef  = useRef(false)

  const [districtState, setDistrictState] = useState({})
  const [allLoading,    setAllLoading]    = useState(false)
  const [clearLoading,  setClearLoading]  = useState(false)
  const [lastMsg,       setLastMsg]       = useState('')

  const districtStateRef = useRef(districtState)
  const regionMapRef     = useRef({})
  const allLoadingRef    = useRef(false)

  useEffect(() => { districtStateRef.current = districtState }, [districtState])
  useEffect(() => { allLoadingRef.current = allLoading },       [allLoading])

  const { data: regions = [], isLoading: regionsLoading, isError: regionsError } = useQuery({
    queryKey: ['admin', 'regions'],
    queryFn:  () => adminApi.getRegions().then(r => r.data),
  })

  useEffect(() => {
    const map = {}
    regions.forEach(r => { if (r.guName) map[r.guName.trim()] = r.id })
    regionMapRef.current = map
  }, [regions])

  const handleMapClick = async (e) => {
    const datum = d3.select(e.target).datum()
    if (!datum?.properties?.name) return
    const name     = datum.properties.name.trim()
    const regionId = regionMapRef.current[name]
    if (!regionId) return
    if (allLoadingRef.current) return
    if (districtStateRef.current[name] === 'loading') return

    setDistrictState(s => ({ ...s, [name]: 'loading' }))
    setLastMsg(`${name} 시뮬레이션 중...`)
    try {
      await adminApi.simulateRegion(regionId)
      setDistrictState(s => ({ ...s, [name]: 'ok' }))
      setLastMsg(`${name} 완료`)
    } catch {
      setDistrictState(s => ({ ...s, [name]: 'error' }))
      setLastMsg(`${name} 실패`)
    }
  }

  const handleClearSimulated = async () => {
    if (!window.confirm('강수·하천·하수관 시뮬레이션 데이터를 전부 삭제하시겠습니까?')) return
    setClearLoading(true)
    setLastMsg('시뮬레이션 데이터 초기화 중...')
    try {
      const res = await adminApi.clearSimulated()
      const { rainfall, river, sewer } = res.data
      setDistrictState({})
      setLastMsg(`초기화 완료 — 강수 ${rainfall}건, 하천 ${river}건, 하수관 ${sewer}건 삭제`)
    } catch {
      setLastMsg('초기화 실패')
    } finally {
      setClearLoading(false)
    }
  }

  const handleSimulateAll = async () => {
    setAllLoading(true)
    const loading = {}
    geoData.features.forEach(f => { loading[f.properties.name] = 'loading' })
    setDistrictState(loading)
    setLastMsg('전체 구 시뮬레이션 중...')
    try {
      await adminApi.simulateAll()
      const ok = {}
      geoData.features.forEach(f => { ok[f.properties.name] = 'ok' })
      setDistrictState(ok)
      setLastMsg('전체 구 시뮬레이션 완료')
    } catch {
      const err = {}
      geoData.features.forEach(f => { err[f.properties.name] = 'error' })
      setDistrictState(err)
      setLastMsg('전체 구 시뮬레이션 실패')
    } finally {
      setAllLoading(false)
    }
  }

  // D3 마운트 + 리사이즈
  useEffect(() => {
    let rafId = null

    const draw = () => {
      if (!svgRef.current || !containerRef.current) return
      const { width, height } = containerRef.current.getBoundingClientRect()
      if (!width || !height) return

      const svg = d3.select(svgRef.current)
      svg.selectAll('*').remove()
      initializedRef.current = false

      const projection = d3.geoMercator().fitSize([width, height], geoData)
      const pathGen    = d3.geoPath().projection(projection)

      const districtG = svg.append('g').attr('class', 'districts')
      const labelG    = svg.append('g').attr('class', 'labels').attr('pointer-events', 'none')

      districtG.selectAll('path')
        .data(geoData.features)
        .join('path')
        .attr('d', pathGen)
        .attr('fill', d => DISTRICT_COLORS[districtStateRef.current[d.properties.name] ?? 'idle'])
        .attr('stroke', '#fff')
        .attr('stroke-width', 1.2)
        .attr('cursor', 'pointer')
        .attr('opacity', 0)
        .attr('transform', 'translate(0,10)')
        .transition()
        .duration(420)
        .ease(d3.easeCubicOut)
        .delay(d => {
          const b  = pathGen.bounds(d)
          const cx = (b[0][0] + b[1][0]) / 2
          return 60 + (cx / width) * 560
        })
        .attr('opacity', 1)
        .attr('transform', 'translate(0,0)')

      const getLabelPoint = feature => {
        const project = coord => projection(coord)
        let rings
        if (feature.geometry.type === 'Polygon') {
          rings = feature.geometry.coordinates.map(r => r.map(project))
        } else {
          const largest = feature.geometry.coordinates.reduce((a, b) => {
            const aA = Math.abs(d3.polygonArea(a[0].map(project)))
            const bA = Math.abs(d3.polygonArea(b[0].map(project)))
            return aA >= bA ? a : b
          })
          rings = largest.map(r => r.map(project))
        }
        return polylabel(rings, 0.5)
      }

      const labelPts = new Map(geoData.features.map(f => [f, getLabelPoint(f)]))

      labelG.selectAll('text')
        .data(geoData.features)
        .join('text')
        .attr('x', d => labelPts.get(d)[0])
        .attr('y', d => labelPts.get(d)[1])
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', '8px')
        .attr('font-weight', '600')
        .attr('fill', '#fff')
        .attr('opacity', 0)
        .text(d => d.properties.name)
        .transition().duration(300).delay(700).attr('opacity', 1)

      initializedRef.current = true
    }

    const scheduleDraw = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        if (!containerRef.current) return
        const { width, height } = containerRef.current.getBoundingClientRect()
        if (width && height) draw()
      })
    }

    scheduleDraw()
    const ro = new ResizeObserver(scheduleDraw)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => { cancelAnimationFrame(rafId); ro.disconnect() }
  }, [])

  useEffect(() => {
    if (!initializedRef.current || !svgRef.current) return
    d3.select(svgRef.current)
      .selectAll('.districts path')
      .transition().duration(300)
      .attr('fill', d => DISTRICT_COLORS[districtState[d.properties.name] ?? 'idle'])
  }, [districtState])

  const doneCount  = Object.values(districtState).filter(s => s === 'ok').length
  const errorCount = Object.values(districtState).filter(s => s === 'error').length

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-7 md:py-8">

      <h1 className="text-[20px] font-bold text-[#1e293b] md:text-[22px]">폭우 시뮬레이션</h1>
      <p className="mt-1.5 mb-5 text-[13px] text-[#64748b]">
        구를 클릭하면 해당 구에 강수·하천·하수관 위험 데이터를 즉시 삽입합니다.
        다음 배치(10분 주기) 실행 시 시뮬레이션 강수 데이터는 자동 삭제됩니다.
      </p>

      {/* 지역 로딩 상태 */}
      <p className="mb-3 text-[12px] text-[#64748b]">
        {regionsLoading && '지역 정보 로딩 중...'}
        {regionsError   && <span className="text-[#ef4444]">지역 정보 로딩 실패 — 새로고침 해주세요</span>}
        {!regionsLoading && !regionsError && `지역 ${regions.length}개 로딩 완료`}
      </p>

      {/* 버튼 + 상태 메시지 */}
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <button
          onClick={handleSimulateAll}
          disabled={allLoading || clearLoading || regionsLoading}
          className={`rounded-[6px] px-5 py-2 text-[13px] font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
            allLoading ? 'bg-[#94a3b8]' : 'bg-[#ef4444] hover:bg-[#dc2626]'
          }`}
        >
          {allLoading ? '전체 시뮬레이션 중...' : '전체 구 폭우 시뮬레이션'}
        </button>
        <button
          onClick={handleClearSimulated}
          disabled={allLoading || clearLoading}
          className={`rounded-[6px] px-5 py-2 text-[13px] font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
            clearLoading ? 'bg-[#94a3b8]' : 'bg-[#64748b] hover:bg-[#475569]'
          }`}
        >
          {clearLoading ? '초기화 중...' : '시뮬레이션 데이터 초기화'}
        </button>
        {lastMsg && (
          <span className="text-[13px] text-[#475569]">{lastMsg}</span>
        )}
        {(doneCount > 0 || errorCount > 0) && (
          <span className="text-[12px] text-[#94a3b8]">
            완료 {doneCount}{errorCount > 0 && ` / 실패 ${errorCount}`}
          </span>
        )}
      </div>

      {/* 범례 */}
      <div className="mb-3 flex flex-wrap gap-4">
        {LEGEND.map(({ label, state }) => (
          <div key={state} className="flex items-center gap-1.5 text-[12px] text-[#475569]">
            <div
              className="size-3 rounded-[2px]"
              style={{ background: DISTRICT_COLORS[state] }}
            />
            {label}
          </div>
        ))}
      </div>

      {/* 지도 */}
      <div
        ref={containerRef}
        className="w-full h-[260px] sm:h-[380px] md:h-[520px] overflow-hidden rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc]"
      >
        <svg
          ref={svgRef}
          className="w-full h-full cursor-default"
          onClick={handleMapClick}
          onMouseOver={(e) => {
            const el = d3.select(e.target)
            if (el.datum()?.properties?.name) el.attr('stroke', '#1e293b').attr('stroke-width', 2)
          }}
          onMouseOut={(e) => {
            const el = d3.select(e.target)
            if (el.datum()?.properties?.name) el.attr('stroke', '#fff').attr('stroke-width', 1.2)
          }}
        />
      </div>
    </div>
  )
}
