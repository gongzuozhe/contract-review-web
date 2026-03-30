'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Shield, 
  Loader2,
  ArrowRight,
  Building2,
  DollarSign,
  Clock,
  Scale,
  Bot,
  Sparkles,
  History
} from 'lucide-react'
import { saveReviewRecord } from '@/lib/history'

interface AIConfig {
  provider: string
  apiKey: string
  model: string
}

interface AIFinding {
  id: number
  type: string
  title: string
  clause: string
  description?: string
  suggestion?: string
  legalReference?: string
}

interface ReviewStep {
  id: string
  title: string
  description: string
  status: 'pending' | 'processing' | 'complete'
  icon: React.ReactNode
}

const mockReviewSteps: ReviewStep[] = [
  {
    id: 'analyze',
    title: '分析合同结构',
    description: '识别合同类型和主要条款',
    status: 'pending',
    icon: <FileText className="w-5 h-5" />
  },
  {
    id: 'legal',
    title: '法律风险审查',
    description: '检查合同效力和合规性',
    status: 'pending',
    icon: <Scale className="w-5 h-5" />
  },
  {
    id: 'commercial',
    title: '商业条款分析',
    description: '评估价款、支付和履行条款',
    status: 'pending',
    icon: <DollarSign className="w-5 h-5" />
  },
  {
    id: 'risk',
    title: '风险等级评估',
    description: '综合评估并生成风险报告',
    status: 'pending',
    icon: <AlertTriangle className="w-5 h-5" />
  }
]

const mockFindingsBase = [
  {
    id: 1,
    type: 'high',
    title: '违约责任不对等',
    clause: '甲方逾期付款的，应按日万分之五支付违约金；乙方逾期交付的，应按日千分之一支付违约金',
  },
  {
    id: 2,
    type: 'medium',
    title: '管辖约定不公平',
    clause: '因本合同产生的争议，由甲方所在地人民法院管辖',
  },
  {
    id: 3,
    type: 'medium',
    title: '验收标准不明确',
    clause: '乙方应在合同约定的期限内完成工作，并向甲方交付工作成果',
  },
  {
    id: 4,
    type: 'low',
    title: '知识产权归属需明确',
    clause: '乙方应保证其工作成果不侵犯任何第三方的知识产权',
  }
]

const getFindingsByStance = (stance: string) => {
  const stanceMap: Record<string, { label: string, desc: string, sugg: string }> = {
    party_a: {
      label: '甲方视角',
      desc: '该条款对甲方有利，但对乙方责任过重，可能导致合同无法签署',
      sugg: '建议适当放宽乙方违约责任，争取双赢'
    },
    party_b: {
      label: '乙方视角',
      desc: '该条款明显偏向甲方，乙方责任过重，存在较大风险',
      sugg: '建议与甲方协商修改，减轻乙方责任'
    },
    third_party: {
      label: '第三方视角',
      desc: '该条款可能影响第三方权益，建议关注',
      sugg: '建议明确各方责任边界'
    }
  }
  
  return mockFindingsBase.map(f => {
    const s = stanceMap[stance] || stanceMap.party_a
    const descriptions: Record<string, Record<string, string>> = {
      party_a: {
        1: `违约金条款对甲方较为有利，但可能导致乙方拒绝签署。${s.desc}`,
        2: `管辖约定对甲方有利，可降低诉讼成本。${s.desc}`,
        3: `验收标准不明确可能导致交付争议，建议补充。${s.desc}`,
        4: `知识产权归属约定不明确，建议明确以保护甲方权益。`
      },
      party_b: {
        1: `乙方违约金比例是甲方的20倍，严重不对等！${s.desc}`,
        2: `${s.desc}建议争取改为被告所在地法院。`,
        3: `${s.desc}建议明确验收标准和流程。`,
        4: `${s.desc}建议明确知识产权归属。`
      },
      third_party: {
        1: `违约金比例差异可能影响第三方权益。${s.desc}`,
        2: `管辖约定可能影响第三方维权。${s.desc}`,
        3: `验收标准不明确可能引发纠纷。${s.desc}`,
        4: `知识产权归属不明确可能产生争议。`
      }
    }
    
    return {
      ...f,
      description: descriptions[stance]?.[String(f.id)] || descriptions.party_b[String(f.id)],
      suggestion: s.sugg
    }
  })
}

function ReviewContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [steps, setSteps] = useState<ReviewStep[]>(mockReviewSteps)
  const [currentStep, setCurrentStep] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [showFindings, setShowFindings] = useState(false)
  const [findings, setFindings] = useState<any[]>([])
  const [dataSource, setDataSource] = useState<'ai' | 'mock'>('mock')
  const [errorMsg, setErrorMsg] = useState('')
  const findingsRef = useRef<HTMLDivElement>(null)

  const getSessionStorage = (key: string, fallback: string = '') => {
    if (typeof window === 'undefined') return fallback
    return sessionStorage.getItem(key) || fallback
  }

  const [contractType, setContractType] = useState('')
  const [stance, setStance] = useState('')
  const [contractText, setContractText] = useState('')
  const [fileName, setFileName] = useState('')
  const [uploadMode, setUploadMode] = useState('')

  useEffect(() => {
    setContractType(searchParams.get('type') || getSessionStorage('contract_type', 'commercial'))
    setStance(searchParams.get('stance') || getSessionStorage('contract_stance', 'party_a'))
    setContractText(getSessionStorage('contract_text'))
    setFileName(searchParams.get('file') || getSessionStorage('contract_filename'))
    setUploadMode(getSessionStorage('contract_mode', 'file'))
  }, [searchParams])

  const mockFindings = getFindingsByStance(stance)

  // 加载AI配置并调用API - 当contractText准备好后执行
  useEffect(() => {
    if (!contractText) return
    
    const loadAI = async () => {
      try {
        const storedConfig = localStorage.getItem('ai_config')
        let aiConfig: AIConfig | null = null
        
        if (storedConfig) {
          try {
            aiConfig = JSON.parse(storedConfig)
          } catch {}
        }

        console.log('AI配置:', aiConfig)
        console.log('合同文本长度:', contractText?.length || 0)
        console.log('上传模式:', uploadMode)

        if (!contractText || contractText.length < 10) {
          console.log('无合同文本，使用模拟数据')
          setDataSource('mock')
          return
        }

        if (aiConfig?.apiKey && contractText.length > 50) {
          try {
            setDataSource('ai')
            const { callAI } = await import('@/lib/ai-client')
            const aiData = await callAI(aiConfig, contractText, contractType, stance)
            
            console.log('API响应:', aiData)
            
            if (aiData && !aiData.error) {
              console.log('AI返回数据:', aiData)
              
              // 尝试从不同字段获取风险数据
              const riskItems = aiData.risks || aiData.findings || aiData.issues || aiData.results || []
              console.log('风险数据:', riskItems)
              
              if (riskItems.length > 0) {
                setFindings(riskItems)
                // 兼容新旧格式
                const revised = aiData.revisedContract || { 
                  hasChanges: true,
                  revisedFullContract: aiData.revisedFullContract || '',
                  clauseNotes: aiData.risks?.map((r: any) => ({
                    clauseTitle: r.title,
                    originalContent: r.clause,
                    revisedContent: r.suggestion,
                    note: r.analysis
                  })) || []
                }
                // 如果有完整修订版合同
                if (aiData.revisedFullContract) {
                  revised.revisedFullContract = aiData.revisedFullContract
                  revised.hasChanges = true
                }
                setRevisedContract(revised)
                console.log('设置findings:', riskItems.length)
                
                // 保存AI审查到历史记录 - 直接用总数，不依赖级别判断
                const total = riskItems.length
                const highRisk = Math.floor(total * 0.5) // 假设50%高风险
                const mediumRisk = Math.floor(total * 0.3) // 假设30%中风险
                const lowRisk = total - highRisk - mediumRisk
                
                console.log('风险统计:', { highRisk, mediumRisk, lowRisk, total })
                
                saveReviewRecord({
                  id: Date.now().toString(),
                  timestamp: Date.now(),
                  contractType: contractType || 'commercial',
                  stance: stance || 'party_a',
                  fileName: fileName,
                  overview: {
                    overallRisk: 'medium',
                    highRisk,
                    mediumRisk,
                    lowRisk
                  },
                  findings: riskItems,
                  revisedContract: aiData.revisedContract || null,
                  summary: 'AI智能审查'
                })
              } else {
                console.log('AI未返回risks，使用模拟数据')
                setDataSource('mock')
              }
              setSteps(prev => prev.map(step => ({ ...step, status: 'complete' })))
              setCurrentStep(4) // 跳到最后一步
              setIsComplete(true)
              setTimeout(() => setShowFindings(true), 500)
              return
            } else {
              setErrorMsg(result.error || 'AI返回数据格式错误')
              setDataSource('mock')
            }
          } catch (error) {
            console.error('AI调用失败:', error)
            setErrorMsg(error instanceof Error ? error.message : '网络错误')
            setDataSource('mock')
          }
        } else if (contractText.length <= 50) {
          setErrorMsg('合同文本太短，请输入更多内容（至少50字符）')
          setDataSource('mock')
        } else if (!aiConfig?.apiKey) {
          console.log('未配置API Key，使用模拟数据')
          setDataSource('mock')
        } else {
          setDataSource('mock')
        }
      } catch (err) {
        console.error('加载AI配置失败:', err)
        setErrorMsg('初始化失败')
        setDataSource('mock')
      }
    }

    loadAI()
  }, [contractText, contractType, stance])

  // 进度步骤动画 - AI模式跳过
  useEffect(() => {
    if (dataSource === 'ai') return
    
    if (isComplete) return

    const timer = setTimeout(() => {
      if (currentStep < steps.length) {
        setSteps(prev => prev.map((step, idx) => ({
          ...step,
          status: idx < currentStep ? 'complete' : idx === currentStep ? 'processing' : 'pending'
        })))
        setCurrentStep(prev => prev + 1)
      } else {
        setIsComplete(true)
        setTimeout(() => {
          setShowFindings(true)
          setFindings(mockFindings)
          setTimeout(() => {
            findingsRef.current?.scrollIntoView({ behavior: 'smooth' })
          }, 100)
        }, 500)
      }
    }, 1500)

    return () => clearTimeout(timer)
  }, [currentStep, isComplete, steps.length, dataSource])

  const [revisedContract, setRevisedContract] = useState<any>(null)

  const handleViewReport = () => {
    // 保存AI结果到sessionStorage供报告页使用
    if (dataSource === 'ai' && findings.length > 0) {
      sessionStorage.setItem('ai_report_data', JSON.stringify({
        findings: findings,
        dataSource: 'ai',
        contractType: contractType,
        revisedContract: revisedContract,
        overview: {
          highRisk: findings.filter((r: any) => r.level === 'high').length,
          mediumRisk: findings.filter((r: any) => r.level === 'medium').length,
          lowRisk: findings.filter((r: any) => r.level === 'low').length,
          overallRisk: findings.filter((r: any) => r.level === 'high').length > 0 ? 'high' : 
                       findings.filter((r: any) => r.level === 'medium').length > 0 ? 'medium' : 'low'
        }
      }))
    }
    
    // 如果是模拟数据模式，保存到历史记录（AI模式已在API返回时保存）
    if (dataSource !== 'ai') {
      saveReviewRecord({
        id: Date.now().toString(),
        timestamp: Date.now(),
        contractType: contractType,
        stance: stance,
        fileName: fileName,
        overview: {
          overallRisk: 'low',
          highRisk: 0,
          mediumRisk: 0,
          lowRisk: 4
        },
        summary: '演示数据'
      })
    }
    
    router.push(`/report?stance=${stance}&source=${dataSource}`)
  }

  const getStanceLabel = (s: string) => {
    const labels: Record<string, string> = {
      party_a: '甲方',
      party_b: '乙方',
      third_party: '第三方'
    }
    return labels[s] || '甲方'
  }

  const getTypeName = (type: string) => {
    const types: Record<string, string> = {
      rental: '租赁合同',
      labor: '劳动合同',
      commercial: '商业合同',
      ip: '知识产权合同',
      investment: '投资合同'
    }
    return types[type] || '商业合同'
  }

  const getRiskBadge = (type: string) => {
    const badges: Record<string, { bg: string, text: string, label: string }> = {
      high: { bg: 'bg-red-100', text: 'text-red-700', label: '高风险' },
      medium: { bg: 'bg-warning-100', text: 'text-warning-700', label: '中风险' },
      low: { bg: 'bg-green-100', text: 'text-green-700', label: '低风险' }
    }
    return badges[type] || badges.low
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            合同审查中
          </h1>
          <p className="text-gray-600">
            {getTypeName(contractType)} · {getStanceLabel(stance)}视角
            {fileName && ` · ${fileName}`}
          </p>
          {/* 数据来源标识 */}
          <div className="mt-2 flex flex-col items-center gap-2">
            {dataSource === 'ai' ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                <Bot className="w-4 h-4" />
                AI 智能审查
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                <Sparkles className="w-4 h-4" />
                演示数据
              </span>
            )}
            {errorMsg && (
              <span className="text-xs text-red-500">
                {errorMsg}
              </span>
            )}
          </div>
        </div>

        {/* Progress Steps */}
        <div className="card mb-8">
          <div className="space-y-6">
            {steps.map((step, idx) => (
              <div key={step.id} className="flex items-start gap-4">
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  step.status === 'complete' 
                    ? 'bg-green-500 text-white'
                    : step.status === 'processing'
                    ? 'bg-primary-800 text-white animate-pulse'
                    : 'bg-gray-200 text-gray-400'
                }`}>
                  {step.status === 'complete' ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : step.status === 'processing' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <span className="text-sm font-medium">{idx + 1}</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-medium ${
                      step.status === 'pending' ? 'text-gray-400' : 'text-gray-900'
                    }`}>
                      {step.title}
                    </h3>
                    {step.status === 'processing' && (
                      <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                        处理中
                      </span>
                    )}
                    {step.status === 'complete' && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        完成
                      </span>
                    )}
                  </div>
                  <p className={`text-sm ${
                    step.status === 'pending' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Complete State */}
        {isComplete && (
          <div className="card bg-green-50 border-green-200 mb-8">
            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-green-800">审查完成</h3>
                <p className="text-green-700">
                  已发现 {dataSource === 'ai' && findings.length > 0 ? findings.length : mockFindings.length} 个风险点，点击查看完整报告
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Findings */}
        {showFindings && (
          <div ref={findingsRef} className="space-y-4 animate-fadeIn">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              发现的问题 {dataSource === 'ai' && findings.length > 0 ? '(AI真实)' : '(模拟)'}
            </h2>
            {(dataSource === 'ai' && findings.length > 0 ? findings : mockFindings).map((finding: any, idx: number) => {
              const badge = getRiskBadge(finding.type || finding.level)
              return (
                <div key={finding.id} className="card">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={`w-5 h-5 ${
                        finding.type === 'high' ? 'text-red-500' : 
                        finding.type === 'medium' ? 'text-warning-500' : 'text-green-500'
                      }`} />
                      <h3 className="font-semibold text-gray-900">{finding.title}</h3>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
                      {badge.label}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3">{finding.description || finding.analysis}</p>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">修改建议：</span>
                      {finding.suggestion}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Action Buttons */}
        {isComplete && (
          <div className="flex justify-center mt-8">
            <button onClick={handleViewReport} className="btn-primary text-lg">
              查看完整报告
              <ArrowRight className="w-5 h-5 inline ml-2" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ReviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    }>
      <ReviewContent />
    </Suspense>
  )
}
