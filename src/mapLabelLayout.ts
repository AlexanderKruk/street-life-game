export const mapPositions: Record<string, [number, number]> = {
  hospital: [81.3, 14.1], jobcenter: [37.3, 20.2], support: [11.2, 21.5],
  'free-clinic': [85.1, 29.8], work: [50.4, 40.5], daycenter: [11.2, 47.5],
  shelter: [89.3, 38.5], 'residential-shelter': [16.1, 63.2], station: [34.5, 65.8],
}

type Label = { id: string; x: number; y: number; width: number; height: number; left: boolean }
type Rect = { x: number; y: number; width: number; height: number }
const overlap = (a: Rect, b: Rect) => Math.max(0, Math.min(a.x+a.width+4,b.x+b.width+4)-Math.max(a.x,b.x)) * Math.max(0,Math.min(a.y+a.height+4,b.y+b.height+4)-Math.max(a.y,b.y))
export function layoutMapLabels(labels: Label[], width: number, height: number) {
  const placed: Rect[] = []
  const offsets: Record<string, { x: number; y: number; line?: { x1:number; y1:number; x2:number; y2:number } }> = {}
  const markers = labels.map(label => ({ x:label.x-9, y:label.y-9, width:18, height:18 }))
  for (const label of [...labels].sort((a,b)=>a.y-b.y || a.x-b.x)) {
    const baseX = label.left ? label.x-20-label.width : label.x+20
    const baseY = label.y-label.height/2
    const x = Math.max(4, Math.min(width-label.width-4,baseX))
    let best: Rect | undefined, score = Infinity
    for (const delta of [0,-28,28,-56,56,-84,84,-112,112]) {
      const y = Math.max(4,Math.min(height-label.height-4,baseY+delta))
      const rect = { x,y,width:label.width,height:label.height }
      const collision = [...placed,...markers].reduce((sum,other)=>sum+overlap(rect,other),0)
      if (collision < score) { best=rect; score=collision }
      if (collision === 0) break
    }
    placed.push(best!)
    const dx=best!.x-baseX, dy=best!.y-baseY
    offsets[label.id] = { x:dx, y:dy, ...(dx || dy ? { line:{ x1:label.x, y1:label.y, x2:Math.max(best!.x,Math.min(best!.x+label.width,label.x)), y2:Math.max(best!.y,Math.min(best!.y+label.height,label.y)) } } : {}) }
  }
  return offsets
}
