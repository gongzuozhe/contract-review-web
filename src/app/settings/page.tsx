'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Save, 
  Key, 
  CheckCircle, 
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react'

interface AIConfig {
  provider: string
  apiKey: string
  model: string
}

export default function SettingsPage() {
  const [config, setConfig] = useState<AIConfig>({
    provider: 'openai',
    apiKey: '',
    model: 'gpt-4o-mini'
  })
  const [showKey, setShowKey] = useState(false)
  const [saved, setSaved] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('ai_config')
    if (stored) {
      try {
        setConfig(JSON.parse(stored))
      } catch {}
    }
  }, [])

  const getPlaceholder = (provider: string) => {
    switch (provider) {
      case 'openai': return 'sk-...'
      case 'claude': return 'sk-ant-...'
      case 'zhipu': return '请输入智谱AI API Key'
      case 'baidu': return '请输入百度API Key (Access Token)'
      case 'aliyun': return '请输入阿里云DashScope API Key'
      case 'tencent': return '请输入腾讯云API Key (SecretId:SecretKey)'
      case 'moonshot': return '请输入Moonshot API Key'
      case 'siliconflow': return '请输入硅基流动 API Key'
      case 'openrouter': return '请输入OpenRouter API Key'
      default: return '请输入 API Key'
    }
  }

  const handleSave = () => {
    localStorage.setItem('ai_config', JSON.stringify(config))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    
    try {
      const { callAI } = await import('@/lib/ai-client')
      const result = await callAI(
        config,
        '测试合同：甲方租用乙方房屋，租金每月1000元。',
        '租赁合同',
        'neutral'
      )
      
      if (result && !result.error) {
        setTestResult({ success: true, message: 'API 连接成功！' })
      } else {
        setTestResult({ success: false, message: result?.error || 'API 调用失败' })
      }
    } catch (error) {
      setTestResult({ success: false, message: error instanceof Error ? error.message : '网络错误，请检查配置' })
    }
    
    setTesting(false)
  }

  const handleClear = () => {
    if (confirm('确定清除所有配置吗？')) {
      localStorage.removeItem('ai_config')
      localStorage.removeItem('contract_review_history')
      setConfig({ provider: 'openai', apiKey: '', model: 'gpt-4o-mini' })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4" />
            <span>返回首页</span>
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">设置</h1>
        <p className="text-gray-600 mb-8">配置 AI 审查功能</p>

        {/* AI Config */}
        <div className="card mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Key className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">AI API 配置</h2>
              <p className="text-sm text-gray-500">配置你的 AI 服务商 API Key</p>
            </div>
          </div>

          {/* Provider */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              AI 服务商
            </label>
            <select
              value={config.provider}
              onChange={(e) => setConfig({ ...config, provider: e.target.value, model: '' })}
              className="input-field"
            >
              <optgroup label="官方API">
                <option value="openai">OpenAI</option>
                <option value="claude">Claude (Anthropic)</option>
              </optgroup>
              <optgroup label="国内AI平台">
                <option value="zhipu">智谱AI (GLM)</option>
                <option value="baidu">百度文心一言 (ERNIE)</option>
                <option value="aliyun">阿里云通义千问 (Qwen)</option>
                <option value="tencent">腾讯混元</option>
                <option value="moonshot">月之暗面 (Moonshot)</option>
              </optgroup>
              <optgroup label="第三方API (兼容OpenAI)">
                <option value="siliconflow">硅基流动 (SiliconFlow)</option>
                <option value="openrouter">OpenRouter</option>
                <option value="custom">自定义 API</option>
              </optgroup>
            </select>
          </div>

          {/* API Key */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={config.apiKey}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                placeholder={getPlaceholder(config.provider)}
                className="input-field pr-10"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Model */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              模型
            </label>
            <select
              value={config.model}
              onChange={(e) => setConfig({ ...config, model: e.target.value })}
              className="input-field"
            >
              {config.provider === 'openai' && (
                <>
                  <option value="gpt-4o-mini">GPT-4o Mini (推荐)</option>
                  <option value="gpt-4o">GPT-4o</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                </>
              )}
              {config.provider === 'claude' && (
                <>
                  <option value="claude-3-haiku-20240307">Claude 3 Haiku (推荐)</option>
                  <option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option>
                  <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                </>
              )}
              {config.provider === 'zhipu' && (
                <>
                  <option value="glm-4.7-flash">GLM-4.7-Flash (推荐)</option>
                  <option value="glm-4-flash">GLM-4-Flash</option>
                  <option value="glm-4-vision-flash">GLM-4-Vision-Flash</option>
                  <option value="glm-4">GLM-4</option>
                  <option value="glm-4-plus">GLM-4-Plus</option>
                  <option value="glm-3-turbo">GLM-3-Turbo</option>
                </>
              )}
              {config.provider === 'baidu' && (
                <>
                  <option value="ernie-4.0-8k">文心大模型 4.0 (推荐)</option>
                  <option value="ernie-3.5-8k">文心大模型 3.5</option>
                  <option value="ernie-speed-8k">ernie-speed-8k</option>
                </>
              )}
              {config.provider === 'aliyun' && (
                <>
                  <option value="qwen-turbo">Qwen Turbo (推荐)</option>
                  <option value="qwen-plus">Qwen Plus</option>
                  <option value="qwen-max">Qwen Max</option>
                  <option value="qwen-long">Qwen Long (长文本)</option>
                </>
              )}
              {config.provider === 'tencent' && (
                <>
                  <option value="hunyuan-pro">混元-pro (推荐)</option>
                  <option value="hunyuan-standard">混元-standard</option>
                  <option value="hunyuan-lite">混元-lite</option>
                </>
              )}
              {config.provider === 'moonshot' && (
                <>
                  <option value="moonshot-v1-8k">Moonshot V1 8K (推荐)</option>
                  <option value="moonshot-v1-32k">Moonshot V1 32K</option>
                  <option value="moonshot-v1-128k">Moonshot V1 128K (长文本)</option>
                </>
              )}
              {config.provider === 'siliconflow' && (
                <>
                  <option value="Qwen/Qwen2-7B-Instruct">Qwen2-7B-Instruct (推荐)</option>
                  <option value="THUDM/glm4-9b-chat">GLM4-9B-Chat</option>
                  <option value="meta-llama/Meta-Llama-3.1-8B-Instruct">Llama 3.1 8B</option>
                  <option value="Qwen/Qwen2-72B-Instruct">Qwen2-72B-Instruct</option>
                </>
              )}
              {config.provider === 'openrouter' && (
                <>
                  <option value="anthropic/claude-3-haiku">Claude 3 Haiku (推荐)</option>
                  <option value="openai/gpt-4o-mini">GPT-4o Mini</option>
                  <option value="google/gemini-pro-1.5">Gemini Pro 1.5</option>
                  <option value="meta-llama/llama-3.1-70b-instruct">Llama 3.1 70B</option>
                </>
              )}
              {config.provider === 'custom' && (
                <option value="custom">自定义模型</option>
              )}
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={handleSave} className="btn-primary flex items-center gap-2">
              {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saved ? '已保存' : '保存配置'}
            </button>
            <button 
              onClick={handleTest} 
              disabled={testing || !config.apiKey}
              className="btn-secondary flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
              {testing ? '测试中...' : '测试连接'}
            </button>
          </div>

          {/* Test Result */}
          {testResult && (
            <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
              testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {testResult.success ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {testResult.message}
            </div>
          )}
        </div>

        {/* Clear Data */}
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">数据管理</h2>
          <p className="text-sm text-gray-600 mb-4">
            清除所有本地数据，包括审查历史记录和配置信息。
          </p>
          <button onClick={handleClear} className="text-red-600 hover:text-red-700 text-sm font-medium">
            清除所有数据
          </button>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-800 mb-2">使用说明</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• 配置 API Key 后即可使用 AI 审查功能</li>
            <li>• 未配置时系统使用模拟数据进行演示</li>
            <li>• 你的 API Key 仅保存在本地浏览器中，不会上传到服务器</li>
            <li>• 支持 OpenAI、Claude 或兼容 OpenAI API 的自定义服务商</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
