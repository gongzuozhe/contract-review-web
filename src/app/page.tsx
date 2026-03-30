'use client'

import { useState, useRef, useEffect } from 'react'
import { Upload, FileText, AlertTriangle, CheckCircle, Clock, Shield, History, Trash2, Eye } from 'lucide-react'
import Link from 'next/link'
import mammoth from 'mammoth'
import { getReviewHistory, deleteReviewRecord, ReviewRecord } from '@/lib/history'

const contractTypes = [
  { id: 'rental', name: '租赁合同', icon: '🏠' },
  { id: 'labor', name: '劳动合同', icon: '💼' },
  { id: 'commercial', name: '商业合同', icon: '📋' },
  { id: 'ip', name: '知识产权', icon: '💡' },
  { id: 'investment', name: '投资合同', icon: '📈' },
]

const stances = [
  { id: 'party_a', name: '甲方', desc: '合同中主导权利的一方', color: 'blue' },
  { id: 'party_b', name: '乙方', desc: '合同中履约义务的一方', color: 'green' },
  { id: 'third_party', name: '第三方', desc: '合同关联的第三方', color: 'purple' },
]

export default function Home() {
  const [contractType, setContractType] = useState('commercial')
  const [stance, setStance] = useState('party_a')
  const [uploadMode, setUploadMode] = useState<'file' | 'text'>('file')
  const [contractText, setContractText] = useState('')
  const [fileName, setFileName] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [history, setHistory] = useState<ReviewRecord[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setHistory(getReviewHistory())
  }, [])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      setFileName(file.name)
      // 读取文件内容
      const text = await readFileAsText(file)
      if (text) {
        setContractText(text)
      }
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFileName(file.name)
      // 读取文件内容
      const text = await readFileAsText(file)
      if (text) {
        setContractText(text)
      }
    }
  }

  const readFileAsText = async (file: File): Promise<string> => {
    if (typeof window === 'undefined') return ''
    
    const ext = file.name.toLowerCase().split('.').pop()
    
    if (ext === 'docx') {
      try {
        const arrayBuffer = await file.arrayBuffer()
        const result = mammoth.extractRawText({ arrayBuffer })
        return (await result).value || ''
      } catch (e) {
        console.error('Docx parsing error:', e)
        return ''
      }
    }
    
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        resolve(e.target?.result as string || '')
      }
      reader.onerror = () => resolve('')
      reader.readAsText(file)
    })
  }

  const handleStartReview = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('contract_text', contractText.substring(0, 50000))
      sessionStorage.setItem('contract_type', contractType)
      sessionStorage.setItem('contract_stance', stance)
      sessionStorage.setItem('contract_filename', fileName)
      sessionStorage.setItem('contract_mode', uploadMode)
      
      // 保存原始文件二进制用于后续生成修改稿
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      if (fileInput?.files?.[0]) {
        const file = fileInput.files[0]
        if (file.name.endsWith('.docx')) {
          const reader = new FileReader()
          reader.onload = () => {
            sessionStorage.setItem('original_docx', (reader.result as string).split(',')[1] || '')
          }
          reader.readAsDataURL(file)
        }
      }
    }
    window.location.href = `/review?type=${contractType}&stance=${stance}&file=${encodeURIComponent(fileName)}`
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary-50 to-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            AI 智能合同审查
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            快速识别合同风险，提供专业修改建议，让合同签署更安心
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <div className="flex items-center gap-2 text-gray-600">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>智能风险识别</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>条款逐项分析</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>专业修改建议</span>
            </div>
          </div>
        </div>
      </section>

      {/* Upload Section */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">开始审查</h2>
          
          {/* Contract Type */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              选择合同类型
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {contractTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setContractType(type.id)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    contractType === type.id
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl block mb-1">{type.icon}</span>
                  <span className="text-sm font-medium">{type.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Stance Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              选择您的立场 <span className="text-gray-400 font-normal">（审查视角将基于所选立场调整）</span>
            </label>
            <div className="grid grid-cols-3 gap-4">
              {stances.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStance(s.id)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    stance === s.id
                      ? s.color === 'blue'
                        ? 'border-primary-600 bg-primary-50'
                        : s.color === 'green'
                        ? 'border-green-500 bg-green-50'
                        : 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-bold ${
                      stance === s.id
                        ? s.color === 'blue'
                          ? 'text-primary-700'
                          : s.color === 'green'
                          ? 'text-green-700'
                          : 'text-purple-700'
                        : 'text-gray-700'
                    }`}>{s.name}</span>
                    {stance === s.id && (
                      <CheckCircle className={`w-4 h-4 ${
                        s.color === 'blue' ? 'text-primary-600' : s.color === 'green' ? 'text-green-600' : 'text-purple-600'
                      }`} />
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Upload Mode Toggle */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setUploadMode('file')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                uploadMode === 'file'
                  ? 'bg-primary-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Upload className="w-4 h-4 inline mr-2" />
              文件上传
            </button>
            <button
              onClick={() => setUploadMode('text')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                uploadMode === 'text'
                  ? 'bg-primary-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              粘贴文本
            </button>
          </div>

          {/* File Upload Area */}
          {uploadMode === 'file' && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".txt,.md,.doc,.docx,.pdf"
                onChange={handleFileChange}
              />
              {fileName ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="w-8 h-8 text-primary-600" />
                  <span className="text-lg font-medium text-gray-700">{fileName}</span>
                </div>
              ) : (
                <>
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">
                    拖拽文件到这里，或 <span className="text-primary-600">点击上传</span>
                  </p>
                  <p className="text-sm text-gray-400">
                    支持 .txt, .md, .doc, .docx, .pdf
                  </p>
                </>
              )}
            </div>
          )}

          {/* Text Input Area */}
          {uploadMode === 'text' && (
            <div>
              <textarea
                value={contractText}
                onChange={(e) => setContractText(e.target.value)}
                placeholder="请粘贴合同文本内容..."
                className="input-field h-48 resize-none"
              />
              <p className="text-sm text-gray-400 mt-2">
                已输入 {contractText.length} 字符
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleStartReview}
            className="w-full btn-primary mt-6 text-lg"
            disabled={uploadMode === 'text' && contractText.length < 50}
          >
            <Shield className="w-5 h-5 inline mr-2" />
            开始 AI 审查
          </button>
        </div>
      </section>

      {/* History Section */}
      {history.length > 0 && (
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
          >
            <History className="w-5 h-5" />
            <span className="font-medium">审查历史记录</span>
            <span className="text-sm text-gray-500">({history.length})</span>
          </button>
          
          {showHistory && (
            <div className="mt-4 space-y-3">
              {history.slice(0, 10).map((record) => (
                <div key={record.id} className="card flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-900">
                        {record.contractType === 'rental' ? '租赁合同' : 
                         record.contractType === 'labor' ? '劳动合同' :
                         record.contractType === 'commercial' ? '商业合同' :
                         record.contractType === 'ip' ? '知识产权' : '投资合同'}
                      </span>
                      <span className="text-sm text-gray-500">
                        {record.stance === 'party_a' ? '甲方' : record.stance === 'party_b' ? '乙方' : '第三方'}视角
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        record.overview.overallRisk === 'high' ? 'bg-red-100 text-red-700' :
                        record.overview.overallRisk === 'medium' ? 'bg-warning-100 text-warning-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {record.overview.overallRisk === 'high' ? '高风险' : 
                         record.overview.overallRisk === 'medium' ? '中风险' : '低风险'}
                        ({record.overview.highRisk || 0}高/{record.overview.mediumRisk || 0}中/{record.overview.lowRisk || 0}低)
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(record.timestamp).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                    {record.fileName && (
                      <p className="text-sm text-gray-500 mt-1">{record.fileName}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        sessionStorage.setItem('ai_report_data', JSON.stringify({
                          findings: record.findings || [],
                          dataSource: record.summary === 'AI智能审查' ? 'ai' : 'mock',
                          contractType: record.contractType,
                          overview: record.overview,
                          revisedContract: record.revisedContract || null
                        }))
                        window.location.href = `/report?stance=${record.stance}&source=${record.summary === 'AI智能审查' ? 'ai' : 'mock'}&fromHistory=true`
                      }}
                      className="p-2 text-gray-400 hover:text-primary-600"
                      title="查看报告"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        deleteReviewRecord(record.id)
                        setHistory(getReviewHistory())
                      }}
                      className="p-2 text-gray-400 hover:text-red-600"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Features Section */}
      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          功能特点
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="card text-center">
            <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">风险识别</h3>
            <p className="text-gray-600">
              智能识别合同中的法律风险点，标注高、中、低风险等级
            </p>
          </div>
          <div className="card text-center">
            <div className="w-14 h-14 bg-warning-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Clock className="w-7 h-7 text-warning-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">高效快速</h3>
            <p className="text-gray-600">
              几秒钟内完成合同审查，快速生成详细的审查报告
            </p>
          </div>
          <div className="card text-center">
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">专业建议</h3>
            <p className="text-gray-600">
              提供具体的条款修改建议，帮助完善合同内容
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
