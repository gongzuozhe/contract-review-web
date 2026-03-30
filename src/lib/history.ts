export interface ReviewRecord {
  id: string
  timestamp: number
  contractType: string
  stance: string
  fileName?: string
  overview: {
    overallRisk: string
    highRisk: number
    mediumRisk: number
    lowRisk: number
  }
  findings?: any[]
  revisedContract?: any
  summary: string
}

const STORAGE_KEY = 'contract_review_history'

export function saveReviewRecord(record: ReviewRecord): void {
  const history = getReviewHistory()
  history.unshift(record)
  
  // 最多保存 50 条记录
  if (history.length > 50) {
    history.pop()
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
}

export function getReviewHistory(): ReviewRecord[] {
  if (typeof window === 'undefined') return []
  
  const data = localStorage.getItem(STORAGE_KEY)
  if (!data) return []
  
  try {
    return JSON.parse(data)
  } catch {
    return []
  }
}

export function deleteReviewRecord(id: string): void {
  const history = getReviewHistory()
  const filtered = history.filter(r => r.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
}

export function clearReviewHistory(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function exportToMarkdown(record: ReviewRecord): string {
  return `# 合同审查报告

## 一、基本信息
- 合同类型：${record.contractType}
- 审查视角：${record.stance === 'party_a' ? '甲方' : record.stance === 'party_b' ? '乙方' : '第三方'}
- 审查时间：${new Date(record.timestamp).toLocaleString('zh-CN')}

## 二、审查概览
- 总体风险：${record.overview.overallRisk === 'high' ? '高风险' : record.overview.overallRisk === 'medium' ? '中风险' : '低风险'}
- 高风险：${record.overview.highRisk} 项
- 中风险：${record.overview.mediumRisk} 项
- 低风险：${record.overview.lowRisk} 项

## 三、总结
${record.summary}

---
*本报告由 AI 合同审查工具生成*
`
}

export function exportToJSON(record: ReviewRecord): string {
  return JSON.stringify(record, null, 2)
}
