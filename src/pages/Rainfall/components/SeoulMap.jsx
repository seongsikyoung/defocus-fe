import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import polylabel from 'polylabel'
import { getRainfallLevel } from '@/utils/statusUtils'
import geoData from '../../../../gu.json'

export function SeoulMap({ rainfallData }) {
  const containerRef = useRef(null)
  const svgRef       = useRef(null)
  const [tooltip, setTooltip] = useState(null)

  const dataRef        = useRef(rainfallData)
  const initializedRef = useRef(false)

  useEffect(() => { dataRef.current = rainfallData }, [rainfallData])

  // Full draw — mount + resize only
  useEffect(() => {
    let rafId = null

    const draw = () => {
      if (!svgRef.current || !containerRef.current) return
      const { width, height } = containerRef.current.getBoundingClientRect()
      if (!width || !height) return

      const svg = d3.select(svgRef.current)
      svg.selectAll('*').remove()
      initializedRef.current = false

      const snap       = dataRef.current
      const projection = d3.geoMercator().fitSize([width, height], geoData)
      const pathGen    = d3.geoPath().projection(projection)

      const districtG = svg.append('g').attr('class', 'districts')
      const labelG    = svg.append('g').attr('class', 'labels').attr('pointer-events', 'none')

      districtG.selectAll('path')
        .data(geoData.features)
        .join('path')
        .attr('d', pathGen)
        .attr('fill', d => getRainfallLevel(snap[d.properties.name] || 0).mapColor)
        .attr('stroke', 'white')
        .attr('stroke-width', 1.2)
        .attr('cursor', 'pointer')
        .attr('opacity', 0)
        .attr('transform', 'translate(0,10)')
        .on('mousemove', function (event, d) {
          const [x, y] = d3.pointer(event, svgRef.current)
          const name   = d.properties.name
          const rain   = dataRef.current[name] || 0
          d3.select(this).raise().attr('stroke', '#0ea5e9').attr('stroke-width', 2.5)
          setTooltip({ x, y, name, rain })
        })
        .on('mouseout', function () {
          d3.select(this).attr('stroke', 'white').attr('stroke-width', 1.2)
          setTooltip(null)
        })
        .transition('entrance')
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
      const cx = d => labelPts.get(d)[0]
      const cy = d => labelPts.get(d)[1]

      labelG.selectAll('text.dname')
        .data(geoData.features).join('text')
        .attr('class', 'dname')
        .attr('x', cx).attr('y', d => cy(d) - 2)
        .attr('text-anchor', 'middle').attr('font-size', '8px').attr('font-weight', '600')
        .attr('fill', d => getRainfallLevel(snap[d.properties.name] || 0).textColor)
        .attr('opacity', 0)
        .text(d => d.properties.name)

      labelG.selectAll('text.dval')
        .data(geoData.features).join('text')
        .attr('class', 'dval')
        .attr('x', cx).attr('y', d => cy(d) + 9)
        .attr('text-anchor', 'middle').attr('font-size', '7px')
        .attr('fill', d => getRainfallLevel(snap[d.properties.name] || 0).textColor)
        .attr('opacity', 0)
        .text(d => `${(snap[d.properties.name] || 0).toFixed(1)}`)

      labelG.selectAll('text')
        .transition('entrance').duration(300).delay(700).attr('opacity', 1)

      initializedRef.current = true
    }

    // Debounced RAF draw: cancels any pending RAF before scheduling a new one.
    // This prevents ResizeObserver and the initial RAF from both calling draw()
    // at nearly the same time, which would cancel in-progress opacity transitions.
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

  // Color + value update on every rainfallData change.
  // No skipFirstRef: removed to prevent missed updates during period playback.
  useEffect(() => {
    if (!initializedRef.current || !svgRef.current) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('.districts path')
      .transition().duration(700).ease(d3.easeCubicOut)
      .attr('fill', d => getRainfallLevel(rainfallData[d.properties.name] || 0).mapColor)
    svg.selectAll('text.dval')
      .text(d => `${(rainfallData[d.properties.name] || 0).toFixed(1)}`)
      .attr('fill', d => getRainfallLevel(rainfallData[d.properties.name] || 0).textColor)
    svg.selectAll('text.dname')
      .attr('fill', d => getRainfallLevel(rainfallData[d.properties.name] || 0).textColor)
  }, [rainfallData])

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <svg ref={svgRef} className="h-full w-full" style={{ overflow: 'hidden' }} />
      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 shadow-lg"
          style={{
            left: Math.min(tooltip.x + 14, (containerRef.current?.clientWidth ?? 400) - 130),
            top:  Math.max(4, tooltip.y - 56),
          }}
        >
          <p className="text-[12px] font-semibold text-[#1e293b]">{tooltip.name}</p>
          <p className="text-[14px] font-bold text-[#3b82f6]">{tooltip.rain.toFixed(1)} mm/hr</p>
          <p className="text-[11px] text-[#64748b]">{getRainfallLevel(tooltip.rain).label}</p>
        </div>
      )}
    </div>
  )
}
