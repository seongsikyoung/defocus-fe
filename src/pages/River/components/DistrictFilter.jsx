import { useEffect, useRef, useState } from 'react'

export function DistrictFilter({ regions, selectedIds, onToggle, onSelectAll, onClearAll }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const total         = regions.length
  const selectedCount = selectedIds.size
  const isAll         = total > 0 && selectedCount === total

  return (
    <div ref={ref} className="absolute bottom-3 right-3 z-50">

      {/* Dropdown — opens upward */}
      {open && (
        <div className="mb-2 w-[230px] overflow-hidden rounded-[12px] border border-[#e2e8f0] bg-white shadow-xl dark:border-[#2d3f5e] dark:bg-[#1e2d45]">

          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#e2e8f0] px-3 py-2 dark:border-[#2d3f5e]">
            <span className="shrink-0 text-[11px] font-semibold text-[#475569] dark:text-[#94a3b8]">
              {selectedCount}/{total}개 구
            </span>
            <div className="flex gap-1">
              <button
                onClick={onSelectAll}
                className="whitespace-nowrap rounded-[4px] bg-[#3b82f6] px-2 py-0.5 text-[10px] font-bold text-white transition-colors hover:bg-[#2563eb]"
              >
                전체선택
              </button>
              <button
                onClick={onClearAll}
                className="whitespace-nowrap rounded-[4px] bg-[#f1f5f9] px-2 py-0.5 text-[10px] font-bold text-[#64748b] transition-colors hover:bg-[#e2e8f0] dark:bg-[#2d3f5e] dark:text-[#94a3b8] dark:hover:bg-[#3d4f6e]"
              >
                전체해제
              </button>
            </div>
          </div>

          {/* District list */}
          <div className="max-h-[210px] overflow-y-auto scrollbar-hide py-0.5">
            {regions.map(r => {
              const checked = selectedIds.has(r.id)
              return (
                <label
                  key={r.id}
                  className="flex cursor-pointer items-center gap-2.5 px-3 py-[5px] transition-colors hover:bg-[#f8fafc] dark:hover:bg-[#111d35]"
                >
                  <div
                    onClick={() => onToggle(r.id)}
                    className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] border transition-colors ${
                      checked
                        ? 'border-[#3b82f6] bg-[#3b82f6]'
                        : 'border-[#cbd5e1] bg-white dark:border-[#4a5568] dark:bg-[#1a2744]'
                    }`}
                  >
                    {checked && (
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                        <path d="M1 3L3 5L7 1" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-[12px] ${checked ? 'font-medium text-[#1e293b] dark:text-[#e2e8f0]' : 'text-[#94a3b8]'}`}>
                    {r.guName}
                  </span>
                </label>
              )
            })}
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 rounded-full border px-3 py-2 text-[12px] font-semibold shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-[1.03] ${
          open
            ? 'border-[#3b82f6] bg-white text-[#3b82f6] dark:bg-[#1e2d45] dark:text-[#60a5fa]'
            : 'border-[#e2e8f0] bg-white/90 text-[#475569] hover:bg-white dark:border-[#2d3f5e] dark:bg-[#1e2d45]/90 dark:text-[#94a3b8] dark:hover:bg-[#1e2d45]'
        }`}
      >
        {/* Filter icon */}
        <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
          <path d="M0.5 1.5h12M2.5 5h8M4.5 8.5h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>

        <span>{isAll ? '전체 구' : `${selectedCount}개 구`}</span>

        {/* Badge showing hidden count */}
        {!isAll && selectedCount < total && (
          <span className="flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[#6366f1] px-1 text-[9px] font-bold text-white">
            -{total - selectedCount}
          </span>
        )}

        {/* Chevron */}
        <svg
          width="10" height="6" viewBox="0 0 10 6" fill="none"
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  )
}
