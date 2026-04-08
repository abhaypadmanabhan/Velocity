"use client"
import { useEffect, useState, useCallback, useMemo } from "react"
import { NavRail } from "@/components/NavRail"
import { api } from "@/lib/api"
import type { AnalyticsData } from "@/types"

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      const stats = await api.getAnalytics()
      setData(stats)
    } catch(e) {
      console.warn("Could not fetch analytics stats", e)
      setError("Analytics telemetry unreachable.")
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const hours = data ? Math.floor(data.enduranceMins / 60) : 0
  const mins = data ? data.enduranceMins % 60 : 0
  
  // Calculate polyline points
  const polylinePath = useMemo(() => {
    if (!data?.progression || data.progression.length === 0) return ""
    const maxWpm = Math.max(...data.progression.map(p => p.wpm), 1000)
    const points = data.progression.map((p, i) => {
      const x = i * (1000 / Math.max(1, data.progression.length - 1))
      // Map WPM to Y: assuming 0 is bottom (Y=400) and maxWpm is top (Y=0)
      // but let's give it some padding (bottom 350, top 50)
      const y = 350 - ((p.wpm / maxWpm) * 300)
      return `${i === 0 ? 'M' : 'L'} ${x},${y}`
    })
    return points.join(" ")
  }, [data])

  return (
    <div className="flex h-screen w-full overflow-hidden antialiased bg-[#120216] text-white font-display">
      <NavRail />
      
      <main className="flex-1 flex flex-col h-screen overflow-y-auto p-8 lg:p-12 gap-8 relative">
        <header className="flex justify-between items-end w-full border-b border-[#4a2c5a] pb-4">
          <h1 className="text-4xl lg:text-6xl font-bold tracking-tight text-white uppercase m-0 leading-none">Cognitive Analytics</h1>
          <div className="font-mono text-sm text-[#dbb8ff] text-right">
            <div>SYSTEM {error ? 'ERROR' : 'NOMINAL'}</div>
            {!error && <div className="animate-pulse">LIVE TELEMETRY</div>}
          </div>
        </header>

        {error ? (
          <div className="flex-1 flex items-center justify-center text-[#ee1438] font-mono text-xl">{error}</div>
        ) : !data ? (
          <div className="flex-1 flex items-center justify-center text-[#4a2c5a] font-mono text-xl">SYNCING...</div>
        ) : (
          <>
            <section className="w-full flex flex-col gap-4">
              <div className="flex justify-between items-end">
                <h2 className="text-2xl font-bold text-white uppercase tracking-wide">WPM Progression (Last 30 Days)</h2>
                <div className="flex gap-4 font-mono text-xs text-white">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#dbb8ff]"></div> AVERAGE</div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#ee1438] rounded-full"></div> SESSION PEAK</div>
                </div>
              </div>

              <div className="relative w-full h-[400px] bg-[#1e0824] border border-[#4a2c5a] p-4 flex">
                <div className="h-full flex flex-col justify-between items-end pr-4 text-[#4a2c5a] font-mono text-xs shrink-0 w-12 border-r border-[#4a2c5a] z-10">
                  <span>1000</span>
                  <span>800</span>
                  <span>600</span>
                  <span>400</span>
                  <span>200</span>
                  <span>0</span>
                </div>

                <div className="relative flex-1 h-full group" style={{
                  backgroundImage: `linear-gradient(to right, #4a2c5a 1px, transparent 1px), linear-gradient(to bottom, #4a2c5a 1px, transparent 1px)`,
                  backgroundSize: `calc(100% / ${Math.max(1, data.progression.length - 1)}) 50px`,
                  backgroundPosition: 'left top'
                }}>
                  <svg className="absolute top-0 left-0 w-full h-full overflow-visible z-10" preserveAspectRatio="none" viewBox="0 0 1000 400">
                    <path d={polylinePath} fill="none" stroke="#dbb8ff" strokeWidth="3" vectorEffect="non-scaling-stroke"></path>
                  </svg>

                  {/* Points */}
                  {data.progression.map((p, i) => {
                    const maxWpm = Math.max(...data.progression.map(p => p.wpm), 1000)
                    const xPercent = i * (100 / Math.max(1, data.progression.length - 1))
                    const yPercent = (1 - ((350 - ((p.wpm / maxWpm) * 300)) / 400)) * 100
                    const topPos = 100 - yPercent;
                    
                    return (
                      <div key={i}>
                        <div 
                          className="absolute w-3 h-3 bg-[#ee1438] rounded-full z-20 cursor-crosshair transform -translate-x-1.5 -translate-y-1.5 hover:scale-150 transition-transform" 
                          style={{ left: `${xPercent}%`, top: `${topPos}%` }}
                        ></div>
                        <div 
                          className="absolute opacity-0 hover:opacity-100 z-30 bg-[#1e0824] border border-[#4a2c5a] text-white font-mono text-xs p-2 whitespace-nowrap transform -translate-y-full -translate-x-1/2 -mt-4 transition-opacity"
                          style={{ left: `${xPercent}%`, top: `${topPos}%` }}
                        >
                          {p.date} // {p.wpm} WPM
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="flex justify-between pl-16 text-[#4a2c5a] font-mono text-xs mt-1 w-full">
                {data.progression.map(p => <span key={p.date}>{p.date}</span>)}
              </div>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
              <div className="lg:col-span-4 bg-[#1e0824] border border-[#4a2c5a] p-6 flex flex-col justify-between group hover:border-[#ee1438] transition-colors cursor-default">
                <div>
                  <h3 className="font-mono text-sm text-[#4a2c5a] mb-2 uppercase">Endurance Metric</h3>
                  <div className="text-xs font-mono text-white bg-[#120216] inline-block px-2 py-1 mb-4 border border-[#4a2c5a]">
                    SUSTAINED &gt; {data.enduranceSustainedWpm} WPM
                  </div>
                </div>
                <div className="flex flex-col items-end w-full">
                  <div className="text-7xl font-bold text-white tracking-tighter leading-none group-hover:text-[#ee1438] transition-colors">
                    {hours > 0 ? `${hours}H ` : ''}{mins}M
                  </div>
                  <div className="font-mono text-sm text-[#dbb8ff] mt-2">+{data.enduranceVsPrev}M VS PREV WEEK</div>
                </div>
              </div>

              <div className="lg:col-span-8 bg-[#1e0824] border border-[#4a2c5a] p-6 flex flex-col gap-4">
                <div className="flex justify-between items-end border-b border-[#4a2c5a] pb-2">
                  <h3 className="font-mono text-sm text-[#4a2c5a] uppercase">Comprehension vs Speed Heatmap</h3>
                  <div className="flex gap-2 items-center font-mono text-[10px] text-white">
                    <span>LOW</span>
                    <div className="flex gap-1">
                      <div className="w-3 h-3 bg-[#120216] border border-[#4a2c5a]"></div>
                      <div className="w-3 h-3 bg-[#4a2c5a]"></div>
                      <div className="w-3 h-3 bg-[#dbb8ff]"></div>
                      <div className="w-3 h-3 bg-[#ee1438]"></div>
                    </div>
                    <span>HIGH</span>
                  </div>
                </div>

                <div className="flex-1 flex flex-col gap-1 w-full">
                  {["MON", "TUE", "WED"].map(day => (
                    <div key={day} className="flex gap-2 items-center h-full w-full">
                      <span className="font-mono text-xs text-[#4a2c5a] w-8 shrink-0 text-right">{day}</span>
                      <div className="flex flex-1 gap-1 h-full">
                        {data.heatmap.filter(h => h.dayStr === day).map((h, i) => {
                          const heatLevel = h.retention < 70 ? 'bg-[#120216] border border-[#4a2c5a]' : h.retention < 80 ? 'bg-[#4a2c5a] border border-transparent' : h.retention < 90 ? 'bg-[#dbb8ff] border border-transparent' : 'bg-[#ee1438] border border-transparent';
                          
                          return (
                            <div key={i} className={`flex-1 ${heatLevel} hover:border-white cursor-crosshair relative group/cell`}>
                              <div className="absolute hidden group-hover/cell:block z-40 bg-[#1e0824] border border-[#4a2c5a] p-1 text-[10px] font-mono text-white -top-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                                {h.wpm} WPM / {h.retention}%
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}

                  <div className="flex gap-2 items-center w-full mt-2">
                    <span className="w-8 shrink-0"></span>
                    <div className="flex flex-1 justify-between font-mono text-[10px] text-[#4a2c5a]">
                      <span>WK 1</span>
                      <span>WK 2</span>
                      <span>WK 3</span>
                      <span>WK 4</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}
