const API_URLS: Record<string, string> = {
  openai: 'https://api.openai.com/v1/chat/completions',
  claude: 'https://api.anthropic.com/v1/messages',
  zhipu: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
  baidu: 'https://qianfan.baidubce.com/v2/chat/completion',
  aliyun: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
  tencent: 'https://hunyuan.tencentcloudapi.com/v2/chat/completion',
  moonshot: 'https://api.moonshot.cn/v1/chat/completions',
  siliconflow: 'https://api.siliconflow.cn/v1/chat/completions',
  openrouter: 'https://openrouter.ai/api/v1/chat/completions'
}

const MODELS: Record<string, Record<string, string>> = {
  openai: { 'gpt-4o-mini': 'gpt-4o-mini', 'gpt-4o': 'gpt-4o', 'gpt-4-turbo': 'gpt-4-turbo' },
  claude: { 'claude-3-haiku-20240307': 'claude-3-haiku-20240307', 'claude-3-sonnet-20240229': 'claude-3-sonnet-20240229', 'claude-3-opus-20240229': 'claude-3-opus-20240229' },
  zhipu: { 'glm-4-flash': 'glm-4-flash', 'glm-4': 'glm-4', 'glm-4-plus': 'glm-4-plus', 'glm-3-turbo': 'glm-3-turbo' },
  baidu: { 'ernie-4.0-8k': 'ernie-4.0-8k', 'ernie-3.5-8k': 'ernie-3.5-8k', 'ernie-speed-8k': 'ernie-speed-8k' },
  aliyun: { 'qwen-turbo': 'qwen-turbo', 'qwen-plus': 'qwen-plus', 'qwen-max': 'qwen-max', 'qwen-long': 'qwen-long' },
  tencent: { 'hunyuan-pro': 'hunyuan-pro', 'hunyuan-standard': 'hunyuan-standard', 'hunyuan-lite': 'hunyuan-lite' },
  moonshot: { 'moonshot-v1-8k': 'moonshot-v1-8k', 'moonshot-v1-32k': 'moonshot-v1-32k', 'moonshot-v1-128k': 'moonshot-v1-128k' },
  siliconflow: { 'Qwen/Qwen2-7B-Instruct': 'Qwen/Qwen2-7B-Instruct', 'THUDM/glm4-9b-chat': 'THUDM/glm4-9b-chat', 'meta-llama/Meta-Llama-3.1-8B-Instruct': 'meta-llama/Meta-Llama-3.1-8B-Instruct', 'Qwen/Qwen2-72B-Instruct': 'Qwen/Qwen2-72B-Instruct' },
  openrouter: { 'anthropic/claude-3-haiku': 'anthropic/claude-3-haiku', 'openai/gpt-4o-mini': 'openai/gpt-4o-mini', 'google/gemini-pro-1.5': 'google/gemini-pro-1.5', 'meta-llama/llama-3.1-70b-instruct': 'meta-llama/llama-3.1-70b-instruct' }
}

export interface AIConfig {
  provider: string
  apiKey: string
  model: string
}

const DEFAULT_MODELS: Record<string, string> = {
  openai: 'gpt-4o-mini',
  claude: 'claude-3-haiku-20240307',
  zhipu: 'glm-4-flash',
  baidu: 'ernie-3.5-8k',
  aliyun: 'qwen-turbo',
  tencent: 'hunyuan-standard',
  moonshot: 'moonshot-v1-8k',
  siliconflow: 'Qwen/Qwen2-7B-Instruct',
  openrouter: 'anthropic/claude-3-haiku'
}

export async function callAI(config: AIConfig, contractText: string, contractType: string, stance: string): Promise<any> {
  const { provider, apiKey, model } = config
  
  if (!apiKey) {
    throw new Error('请先在设置页面配置 API Key')
  }

  const apiUrl = API_URLS[provider]
  if (!apiUrl) {
    throw new Error(`不支持的 AI 提供商: ${provider}`)
  }

  const selectedModel = model || DEFAULT_MODELS[provider]
  if (!selectedModel) {
    throw new Error('请在设置页面选择模型')
  }

  const systemPrompt = buildSystemPrompt(contractType, stance)
  const userPrompt = buildUserPrompt(contractText, contractType, stance)

  const requestBody = (provider: string, model: string) => {
    const base = { temperature: 0.3 }
    if (provider === 'claude') {
      return { model, max_tokens: 4000, system: systemPrompt, messages: [{ role: 'user', content: userPrompt }] }
    }
    const messages = [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }]
    if (provider === 'tencent') {
      return { ...base, model, messages }
    }
    return { ...base, model, messages, response_format: { type: 'json_object' } }
  }

  let response: Response

  const headers: Record<string, string> = {
    'Content-Type': 'application/json; charset=utf-8'
  }

  if (provider === 'claude') {
    headers['x-api-key'] = apiKey
    headers['anthropic-version'] = '2023-06-01'
    response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody(provider, selectedModel))
    })
  } else if (provider === 'openrouter') {
    headers['Authorization'] = `Bearer ${apiKey}`
    headers['HTTP-Referer'] = 'https://contract-review.netlify.app'
    headers['X-Title'] = 'Contract Review'
    response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody(provider, selectedModel))
    })
  } else {
    headers['Authorization'] = `Bearer ${apiKey}`
    response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody(provider, selectedModel))
    })
  }

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`API 错误: ${error}`)
  }

  const data = await response.json()
  let content = ''

  if (provider === 'claude') {
    content = data.content?.[0]?.text || ''
  } else {
    content = data.choices?.[0]?.message?.content || ''
  }

  try {
    return JSON.parse(content)
  } catch {
    return { raw: content, error: 'JSON解析失败' }
  }
}

function buildSystemPrompt(contractType: string, stance: string): string {
  const stances: Record<string, string> = {
    party_a: `你是一位专业合同审查律师。从甲方（委托方/雇主）的角度审查合同。
- 强调条款对甲方权益的保护程度
- 评估甲方面临的风险是否可控
- 使用技术性但温和的语言风格
- 建议争取双赢的修改方案`,
    party_b: `你是一位专业合同审查律师。从乙方（服务方/员工）的角度审查合同。
- 重点识别乙方承担的风险和责任
- 明确指出对乙方不利的条款
- 使用直接、警示的语言风格
- 对高风险条款使用"必须修改"、"严重风险"等措辞`,
    third_party: `你是一位专业合同审查律师。从第三方角度审查合同。
- 客观分析合同对第三方权益的潜在影响
- 明确各方的责任边界
- 使用客观、中立的语言风格
- 建议第三方适时介入的时机`,
    neutral: `你是一位专业合同审查律师。从中立角度审查合同。
- 客观分析各方的权利义务
- 评估法律风险和商业条款
- 使用专业、客观的语言风格`
  }

  const stanceInstruction = stances[stance] || stances.neutral

  return `${stanceInstruction}

请对合同进行审查，并生成可直接使用的修订版本。

输出JSON格式：
{
  "overview": {
    "contractType": "合同类型",
    "overallRisk": "high/medium/low",
    "highRisk": 数量,
    "mediumRisk": 数量,
    "lowRisk": 数量,
    "summary": "总体评估摘要"
  },
  "risks": [
    {
      "id": 1,
      "level": "high/medium/low",
      "category": "风险类别",
      "title": "风险标题",
      "clause": "相关条款原文",
      "analysis": "问题分析",
      "suggestion": "修改建议"
    }
  ],
  "revisedFullContract": "【完整修订版合同】"
}`
}

function buildUserPrompt(contractText: string, contractType: string, stance: string): string {
  const labels: Record<string, string> = {
    party_a: '甲方',
    party_b: '乙方',
    third_party: '第三方',
    neutral: '中性'
  }

  return `请审查以下${contractType}合同（${labels[stance] || '中性'}视角）：

${contractText}

请根据选择的立场进行深入分析，并引用相关法律法规条款。`
}
