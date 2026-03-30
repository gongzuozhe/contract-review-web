'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  Printer, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Shield,
  FileText,
  Edit3,
  ChevronDown,
  ChevronUp,
  Loader2,
  Scale,
  BookOpen
} from 'lucide-react'

import { legalReferences, findLegalReferences } from '@/data/legal-references'
import { exportToMarkdown, exportToJSON } from '@/lib/history'

const getReportData = (stance: string) => {
  const stanceLabels: Record<string, string> = {
    party_a: '甲方',
    party_b: '乙方',
    third_party: '第三方'
  }
  
  const partyLabel = stanceLabels[stance] || '甲方'
  
  const analyses: Record<string, Record<number, { analysis: string, suggestion: string }>> = {
    party_a: {
      1: { analysis: '该违约金条款对甲方较为有利，可有效督促乙方履约。但可能因过于严格导致乙方拒绝签署。', suggestion: '建议适当放宽乙方违约责任比例，争取合同顺利签署。' },
      2: { analysis: '管辖约定对甲方有利，可降低甲方维权成本。', suggestion: '建议保持，可降低诉讼成本。' },
      3: { analysis: '验收标准不明确可能导致交付争议，建议补充。', suggestion: '建议明确验收标准、流程和异议期限。' },
      4: { analysis: '知识产权归属约定不明确，建议明确以保护甲方权益。', suggestion: '建议明确知识产权归甲方所有或按比例分享。' }
    },
    party_b: {
      1: { analysis: '乙方违约金比例是甲方的20倍，严重不对等！这将给乙方带来巨大风险。', suggestion: '必须争取修改！建议将乙方违约金调整为日万分之五。' },
      2: { analysis: '该管辖约定明显偏向甲方，将增加乙方诉讼成本和维权难度。', suggestion: '必须争取修改为"被告所在地人民法院"或约定仲裁。' },
      3: { analysis: '不明确的验收标准可能成为甲方拒付的借口，乙方风险极大。', suggestion: '必须争取明确验收标准、流程和期限。' },
      4: { analysis: '知识产权归属不明确，可能导致乙方成果被甲方无偿使用。', suggestion: '必须争取明确知识产权归属或获得合理补偿。' }
    },
    third_party: {
      1: { analysis: '违约金比例差异可能影响第三方权益，需关注。', suggestion: '建议各方协商确定合理比例。' },
      2: { analysis: '管辖约定可能影响第三方维权便利性。', suggestion: '建议约定对各方公平的管辖法院。' },
      3: { analysis: '验收标准不明确可能引发纠纷，间接影响第三方。', suggestion: '建议各方明确验收标准。' },
      4: { analysis: '知识产权归属不明确可能产生争议，影响第三方权益。', suggestion: '建议明确各方知识产权边界。' }
    }
  }
  
  const modifications: Record<string, { required: string[], recommended: string[], optional: string[] }> = {
    party_a: {
      required: ['明确验收标准、流程和异议期限'],
      recommended: ['适当调整乙方违约金比例，争取双赢'],
      optional: ['增加合同变更流程', '补充不可抗力条款']
    },
    party_b: {
      required: ['将乙方逾期交付违约金调整为日万分之五（与甲方一致）', '修改管辖约定为被告所在地人民法院或仲裁', '明确验收标准、流程和异议期限'],
      recommended: ['明确知识产权归属和使用范围'],
      optional: ['增加合同变更流程', '补充不可抗力条款']
    },
    third_party: {
      required: ['明确各方违约责任比例'],
      recommended: ['约定公平的管辖法院'],
      optional: ['明确知识产权边界']
    }
  }
  
  const summaries: Record<string, string> = {
    party_a: '该合同整体对甲方较为有利，但存在部分条款可能影响合同签署。建议适当调整后签署。',
    party_b: '该合同存在严重风险！多处条款明显偏向甲方，乙方责任过重。必须修改后再签署！',
    third_party: '该合同部分条款可能影响第三方权益，建议关注并适时介入。'
  }

  return {
    overview: {
      contractType: '商业合同',
      reviewDate: '2026-03-30',
      overallRisk: stance === 'party_b' ? 'high' : 'medium',
      stance: partyLabel,
      highRisk: stance === 'party_b' ? 2 : 1,
      mediumRisk: 2,
      lowRisk: 1
    },
    risks: [
      { id: 1, level: 'high', category: '违约责任', title: '违约责任不对等', clause: '甲方逾期付款的，应按日万分之五支付违约金；乙方逾期交付的，应按日千分之一支付违约金', location: '第8条', ...analyses[stance]?.[1] },
      { id: 2, level: 'medium', category: '争议解决', title: '管辖约定不公平', clause: '因本合同产生的争议，由甲方所在地人民法院管辖', location: '第12条', ...analyses[stance]?.[2] },
      { id: 3, level: 'medium', category: '履行条款', title: '验收标准不明确', clause: '乙方应在合同约定的期限内完成工作，并向甲方交付工作成果', location: '第5条', ...analyses[stance]?.[3] },
      { id: 4, level: 'low', category: '知识产权', title: '知识产权归属需明确', clause: '乙方应保证其工作成果不侵犯任何第三方的知识产权', location: '第6条', ...analyses[stance]?.[4] }
    ],
    modifications: modifications[stance] || modifications.party_a,
    summary: summaries[stance] || summaries.party_a
  }
}

function ReportContent() {
  const searchParams = useSearchParams()
  const [stance, setStance] = useState('party_a')
  const [aiData, setAIData] = useState<any>(null)
  const [dataSource, setDataSource] = useState<'ai' | 'mock'>('mock')

  useEffect(() => {
    const urlStance = searchParams.get('stance')
    const urlSource = searchParams.get('source')
    const fromHistory = searchParams.get('fromHistory')
    
    if (urlStance) {
      setStance(urlStance)
    } else if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('contract_stance')
      if (stored) setStance(stored)
    }

    if ((urlSource === 'ai' || fromHistory === 'true') && typeof window !== 'undefined') {
      const storedAI = sessionStorage.getItem('ai_report_data')
      if (storedAI) {
        try {
          const parsed = JSON.parse(storedAI)
          setAIData(parsed)
          setDataSource(parsed.dataSource || 'ai')
        } catch {}
      }
    }
  }, [searchParams])

  const reportData = aiData ? null : getReportData(stance)
  
  const [expandedSections, setExpandedSections] = useState<string[]>((['overview', 'risks', 'legal']))
  const [expandedRisks, setExpandedRisks] = useState<number[]>([0])
  
  const currentRisks = dataSource === 'ai' && aiData?.findings ? aiData.findings : (reportData?.risks || [])
  const allKeywords = currentRisks.flatMap((r: any) => [r.category, r.title])
  const relatedLaws = findLegalReferences(allKeywords)

  const handleExportMarkdown = () => {
    const risks = dataSource === 'ai' && aiData?.findings ? aiData.findings : reportData?.risks || []
    const highRisk = risks.filter((r: any) => (r.level || r.type) === 'high').length
    const mediumRisk = risks.filter((r: any) => (r.level || r.type) === 'medium').length
    const lowRisk = risks.filter((r: any) => (r.level || r.type) === 'low').length
    
    const content = exportToMarkdown({
      id: 'export',
      timestamp: Date.now(),
      contractType: dataSource === 'ai' && aiData?.contractType ? aiData.contractType : reportData?.overview.contractType || '合同审查',
      stance: stance,
      overview: {
        overallRisk: highRisk > 0 ? 'high' : mediumRisk > 0 ? 'medium' : 'low',
        highRisk,
        mediumRisk,
        lowRisk
      },
      summary: dataSource === 'ai' ? 'AI智能审查' : reportData?.summary || ''
    })
    downloadFile(content, '合同审查报告.md', 'text/markdown')
  }

  const handleExportJSON = () => {
    const risks = dataSource === 'ai' && aiData?.findings ? aiData.findings : reportData?.risks || []
    const highRisk = risks.filter((r: any) => (r.level || r.type) === 'high').length
    const mediumRisk = risks.filter((r: any) => (r.level || r.type) === 'medium').length
    const lowRisk = risks.filter((r: any) => (r.level || r.type) === 'low').length
    
    const content = exportToJSON({
      id: 'export',
      timestamp: Date.now(),
      contractType: dataSource === 'ai' && aiData?.contractType ? aiData.contractType : reportData?.overview.contractType || '合同审查',
      stance: stance,
      overview: {
        overallRisk: highRisk > 0 ? 'high' : mediumRisk > 0 ? 'medium' : 'low',
        highRisk,
        mediumRisk,
        lowRisk
      },
      summary: dataSource === 'ai' ? 'AI智能审查' : reportData?.summary || ''
    })
    downloadFile(content, '合同审查报告.json', 'application/json')
  }

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }

  const toggleRisk = (id: number) => {
    setExpandedRisks(prev =>
      prev.includes(id)
        ? prev.filter(r => r !== id)
        : [...prev, id]
    )
  }

  // 计算AI/模拟数据的风险统计
  const riskStats = (() => {
    // 如果有 overview 数据（从历史记录进入），直接使用
    if (aiData?.overview) {
      return {
        highRisk: aiData.overview.highRisk || 0,
        mediumRisk: aiData.overview.mediumRisk || 0,
        lowRisk: aiData.overview.lowRisk || 0,
        overallRisk: aiData.overview.overallRisk || 'low'
      }
    }
    // 否则从 findings 计算
    const risks = dataSource === 'ai' && aiData?.findings ? aiData.findings : (reportData?.risks || [])
    const highRisk = risks.filter((r: any) => (r.level || r.type) === 'high').length
    const mediumRisk = risks.filter((r: any) => (r.level || r.type) === 'medium').length
    const lowRisk = risks.filter((r: any) => (r.level || r.type) === 'low').length
    const overallRisk = highRisk > 0 ? 'high' : mediumRisk > 0 ? 'medium' : 'low'
    return { highRisk, mediumRisk, lowRisk, overallRisk }
  })()

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'red'
      case 'medium': return 'warning'
      default: return 'green'
    }
  }

  const getOverallRiskBadge = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-100 text-red-700'
      case 'medium': return 'bg-warning-100 text-warning-700'
      default: return 'bg-green-100 text-green-700'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4" />
            <span>返回首页</span>
          </Link>
          <div className="flex gap-2">
            <button className="btn-secondary flex items-center gap-2">
              <Printer className="w-4 h-4" />
              打印
            </button>
            <button onClick={handleExportMarkdown} className="btn-secondary flex items-center gap-2">
              <Download className="w-4 h-4" />
              导出MD
            </button>
            <button onClick={handleExportJSON} className="btn-secondary flex items-center gap-2">
              <Download className="w-4 h-4" />
              导出JSON
            </button>
            {(dataSource === 'ai' && aiData?.revisedContract?.hasChanges) && (
              <button 
                onClick={async () => {
                  const { generateWordDocument } = await import('@/lib/document')
                  const docData = {
                    contractType: aiData?.contractType || 'commercial',
                    stance: stance,
                    overview: aiData?.overview || riskStats,
                    risks: aiData?.findings || [],
                    revisedContract: aiData?.revisedContract,
                    summary: 'AI智能审查完成'
                  }
                  await generateWordDocument(docData)
                }}
                className="btn-primary flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                生成修改稿
              </button>
            )}
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">合同审查报告</h1>
          <p className="text-gray-600">
            {dataSource === 'ai' && aiData?.contractType ? aiData.contractType : reportData?.overview.contractType} · {stance === 'party_a' ? '甲方' : stance === 'party_b' ? '乙方' : '第三方'}视角 | 审查日期：{new Date().toLocaleDateString('zh-CN')}
            {dataSource === 'ai' && <span className="ml-2 text-green-600">(AI审查)</span>}
          </p>
        </div>

        {/* Overview Card */}
        <div className="card mb-6">
          <button 
            onClick={() => toggleSection('overview')}
            className="w-full flex items-center justify-between mb-4"
          >
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary-600" />
              审查概览
            </h2>
            {expandedSections.includes('overview') ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>
          
          {expandedSections.includes('overview') && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">审查视角</p>
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                  {stance === 'party_a' ? '甲方' : stance === 'party_b' ? '乙方' : '第三方'}
                </span>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">总体风险</p>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getOverallRiskBadge(riskStats.overallRisk)}`}>
                  {riskStats.overallRisk === 'high' ? '高风险' : riskStats.overallRisk === 'medium' ? '中风险' : '低风险'}
                </span>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <p className="text-sm text-red-600 mb-1">高风险</p>
                <p className="text-2xl font-bold text-red-700">{riskStats.highRisk}</p>
              </div>
              <div className="bg-warning-50 rounded-lg p-4 text-center">
                <p className="text-sm text-warning-600 mb-1">中风险</p>
                <p className="text-2xl font-bold text-warning-700">{riskStats.mediumRisk}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-sm text-green-600 mb-1">低风险</p>
                <p className="text-2xl font-bold text-green-700">{riskStats.lowRisk}</p>
              </div>
            </div>
          )}
        </div>

        {/* Risk Details */}
        <div className="card mb-6">
          <button 
            onClick={() => toggleSection('risks')}
            className="w-full flex items-center justify-between mb-4"
          >
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning-500" />
              风险详情
            </h2>
            {expandedSections.includes('risks') ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {expandedSections.includes('risks') && (
            <div className="space-y-4">
              {(dataSource === 'ai' && aiData?.findings ? aiData.findings : (reportData?.risks || [])).map((risk: any, idx: number) => (
                <div key={risk.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleRisk(risk.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full bg-${getRiskColor(risk.level || risk.type)}-500`}></span>
                      <span className="font-medium text-gray-900">{risk.title}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium bg-${getRiskColor(risk.level || risk.type)}-100 text-${getRiskColor(risk.level || risk.type)}-700`}>
                        {(risk.level || risk.type) === 'high' ? '高风险' : (risk.level || risk.type) === 'medium' ? '中风险' : '低风险'}
                      </span>
                    </div>
                    {expandedRisks.includes(risk.id || idx) ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  
                  {expandedRisks.includes(risk.id || idx) && (() => {
                    const relatedLaws = findLegalReferences([risk.category, risk.title])
                    return (
                    <div className="px-4 pb-4 border-t border-gray-100 pt-4 space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">条款原文</p>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{risk.clause}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">问题分析</p>
                        <p className="text-sm text-gray-600">{risk.analysis}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">修改建议</p>
                        <p className="text-sm text-gray-600">{risk.suggestion}</p>
                      </div>
                      
                      {/* 法律条款引用 - 内嵌到每个风险点 */}
                      {relatedLaws.length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                          <p className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-1">
                            <BookOpen className="w-4 h-4" />
                            法律依据
                          </p>
                          {relatedLaws.slice(0, 2).map((law: any) => (
                            <div key={law.id} className="text-sm mb-2 last:mb-0">
                              <p className="font-medium text-blue-700">{law.lawName} {law.article}</p>
                              <p className="text-blue-600 text-xs">{law.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-400">
                        条款位置：{risk.location} | 类别：{risk.category}
                      </div>
                    </div>
                  )})()}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modification Suggestions */}
        <div className="card mb-6">
          <button 
            onClick={() => toggleSection('modifications')}
            className="w-full flex items-center justify-between mb-4"
          >
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-primary-600" />
              修改建议
            </h2>
            {expandedSections.includes('modifications') ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {expandedSections.includes('modifications') && (
            <div className="space-y-6">
              {dataSource === 'ai' && aiData?.findings ? (
                <div className="text-gray-600">
                  <p>AI审查已在上方显示详细风险点和修改建议</p>
                </div>
              ) : (
              <>
              <div>
                <h3 className="font-medium text-red-700 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  必须修改
                </h3>
                <ul className="space-y-2">
                  {(reportData?.modifications?.required || []).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-700">
                      <span className="text-red-500 mt-1">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-warning-700 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  建议修改
                </h3>
                <ul className="space-y-2">
                  {(reportData?.modifications?.recommended || []).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-700">
                      <span className="text-warning-500 mt-1">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-green-700 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  可选优化
                </h3>
                <ul className="space-y-2">
                  {(reportData?.modifications?.optional || []).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-700">
                      <span className="text-green-500 mt-1">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              </>
              )}
            </div>
          )}
        </div>

        {/* Legal References */}
        {relatedLaws.length > 0 && (
          <div className="card mb-6">
            <button 
              onClick={() => toggleSection('legal')}
              className="w-full flex items-center justify-between mb-4"
            >
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary-600" />
                相关法律法规引用
              </h2>
              {expandedSections.includes('legal') ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {expandedSections.includes('legal') && (
              <div className="space-y-4">
                {relatedLaws.map((law) => (
                  <div key={law.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{law.title}</h3>
                      <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded">
                        {law.lawName} {law.article}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{law.content}</p>
                    <div className="flex flex-wrap gap-1">
                      {law.keywords.slice(0, 3).map((kw, idx) => (
                        <span key={idx} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Summary */}
        <div className={`card ${stance === 'party_b' ? 'bg-red-50 border-red-200' : 'bg-primary-50 border-primary-200'}`}>
          <h2 className="text-xl font-bold text-gray-900 mb-4">总结与建议</h2>
          <div className="space-y-3">
            <p className="text-gray-700">
              {dataSource === 'ai' ? 'AI智能审查已完成，请查看上方风险详情' : reportData?.summary}
            </p>
            <div className="flex flex-wrap gap-2">
              <span className={`px-3 py-1 rounded-full text-sm ${stance === 'party_b' ? 'bg-red-100 text-red-700' : 'bg-white border border-primary-200 text-primary-700'}`}>
                {stance === 'party_b' ? '强烈建议暂不签署' : stance === 'party_a' ? '建议修改后签署' : '建议关注'}
              </span>
              <span className="px-3 py-1 bg-white border border-primary-200 rounded-full text-sm text-primary-700">
                重点关注违约责任条款
              </span>
              <span className="px-3 py-1 bg-white border border-primary-200 rounded-full text-sm text-primary-700">
                建议咨询专业律师
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ReportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    }>
      <ReportContent />
    </Suspense>
  )
}
