import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contractText, contractType, stance, mode, aiConfig } = body

    if (!contractText && mode !== 'file') {
      return NextResponse.json(
        { error: '请提供合同内容' },
        { status: 400 }
      )
    }

    // 优先使用客户端传递的配置，否则使用服务器环境变量
    const provider = aiConfig?.provider || process.env.AI_PROVIDER || 'openai'
    const apiKey = aiConfig?.apiKey || getApiKeyForProvider(provider)
    const model = aiConfig?.model || getModelForProvider(provider)

    if (!apiKey) {
      return NextResponse.json(
        { error: '请先在设置页面配置 API Key' },
        { status: 400 }
      )
    }

    // 构建系统提示词
    const systemPrompt = buildSystemPrompt(contractType, stance)
    
    // 构建用户提示词
    const userPrompt = buildUserPrompt(contractText, contractType, stance)

    // 调用 AI
    const aiResponse = await callAI(provider, apiKey, model, systemPrompt, userPrompt)

    return NextResponse.json({
      success: true,
      data: aiResponse
    })
  } catch (error) {
    console.error('AI Review Error:', error)
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    return NextResponse.json(
      { error: `审查失败: ${errorMessage}` },
      { status: 500 }
    )
  }
}

function getApiKeyForProvider(provider: string): string | undefined {
  switch (provider) {
    case 'openai': return process.env.OPENAI_API_KEY
    case 'claude': return process.env.CLAUDE_API_KEY
    case 'zhipu': return process.env.ZHIPU_API_KEY
    case 'baidu': return process.env.BAIDU_API_KEY
    case 'aliyun': return process.env.ALIYUN_API_KEY
    case 'tencent': return process.env.TENCENT_API_KEY
    case 'moonshot': return process.env.MOONSHOT_API_KEY
    case 'siliconflow': return process.env.SILICONFLOW_API_KEY
    case 'openrouter': return process.env.OPENROUTER_API_KEY
    default: return process.env.CUSTOM_API_KEY
  }
}

function getApiUrlForProvider(provider: string): string {
  switch (provider) {
    case 'openai': return 'https://api.openai.com/v1/chat/completions'
    case 'claude': return '' // Claude uses different API
    case 'zhipu': return 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
    case 'baidu': return 'https://qianfan.baidubce.com/v2/chat/completion'
    case 'aliyun': return 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'
    case 'tencent': return 'https://hunyuan.tencentcloudapi.com/v2/chat/completion'
    case 'moonshot': return 'https://api.moonshot.cn/v1/chat/completions'
    case 'siliconflow': return 'https://api.siliconflow.cn/v1/chat/completions'
    case 'openrouter': return 'https://openrouter.ai/api/v1/chat/completions'
    default: return ''
  }
}

function getModelForProvider(provider: string): string {
  switch (provider) {
    case 'openai': return process.env.OPENAI_MODEL || 'gpt-4o-mini'
    case 'claude': return process.env.CLAUDE_MODEL || 'claude-3-haiku-20240307'
    case 'zhipu': return process.env.ZHIPU_MODEL || 'glm-4-flash'
    case 'baidu': return process.env.BAIDU_MODEL || 'ernie-4.0-8k'
    case 'aliyun': return process.env.ALIYUN_MODEL || 'qwen-turbo'
    case 'tencent': return process.env.TENCENT_MODEL || 'hunyuan-pro'
    case 'moonshot': return process.env.MOONSHOT_MODEL || 'moonshot-v1-8k'
    case 'siliconflow': return process.env.SILICONFLOW_MODEL || 'Qwen/Qwen2-7B-Instruct'
    case 'openrouter': return process.env.OPENROUTER_MODEL || 'anthropic/claude-3-haiku'
    default: return 'custom'
  }
}

function buildSystemPrompt(contractType: string, stance: string): string {
  const stanceInstructions: Record<string, string> = {
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

  const stanceInstruction = stanceInstructions[stance] || stanceInstructions.neutral

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
  "revisedFullContract": "【完整修订版合同】：将原合同的修改之处用【修订：原内容→新内容 | 批注：修改原因】格式标注。例如：【修订：违约责任条款缺失→建议补充违约金条款 | 批注：明确违约责任有助于保护守约方权益】。请输出完整合同文本，所有修改处都用这种格式标注。"
}`
}

function buildUserPrompt(contractText: string, contractType: string, stance: string): string {
  const stanceLabel: Record<string, string> = {
    party_a: '甲方',
    party_b: '乙方',
    third_party: '第三方',
    neutral: '中性'
  }

  return `请审查以下${contractType}合同（${stanceLabel[stance] || '中性'}视角）：

${contractText}

请根据选择的立场进行深入分析，并引用相关法律法规条款。`
}

async function callAI(provider: string, apiKey: string, model: string, systemPrompt: string, userPrompt: string): Promise<any> {
  if (provider === 'openai' || provider === 'siliconflow' || provider === 'openrouter') {
    return callOpenAICompatible(provider, apiKey, model, systemPrompt, userPrompt)
  } else if (provider === 'claude') {
    return callClaude(apiKey, model, systemPrompt, userPrompt)
  } else if (provider === 'zhipu') {
    return callZhipu(apiKey, model, systemPrompt, userPrompt)
  } else if (provider === 'baidu') {
    return callBaidu(apiKey, model, systemPrompt, userPrompt)
  } else if (provider === 'aliyun') {
    return callAliyun(apiKey, model, systemPrompt, userPrompt)
  } else if (provider === 'tencent') {
    return callTencent(apiKey, model, systemPrompt, userPrompt)
  } else if (provider === 'moonshot') {
    return callMoonshot(apiKey, model, systemPrompt, userPrompt)
  } else {
    return callCustomAPI(systemPrompt, userPrompt)
  }
}

async function callOpenAI(apiKey: string, model: string, systemPrompt: string, userPrompt: string): Promise<any> {
  if (!apiKey) {
    throw new Error('OpenAI API Key 未配置')
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI API Error: ${error}`)
  }

  const data = await response.json()
  const content = data.choices[0].message.content
  
  try {
    return JSON.parse(content)
  } catch {
    // 如果 JSON 解析失败，返回原始内容
    return { raw: content, error: 'JSON解析失败' }
  }
}

async function callClaude(apiKey: string, model: string, systemPrompt: string, userPrompt: string): Promise<any> {
  if (!apiKey) {
    throw new Error('Claude API Key 未配置')
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Claude API Error: ${error}`)
  }

  const data = await response.json()
  const content = data.content[0].text
  
  try {
    return JSON.parse(content)
  } catch {
    return { raw: content, error: 'JSON解析失败' }
  }
}

async function callCustomAPI(systemPrompt: string, userPrompt: string): Promise<any> {
  const apiUrl = process.env.CUSTOM_API_URL
  const apiKey = process.env.CUSTOM_API_KEY
  
  if (!apiUrl) {
    throw new Error('Custom API URL 未配置')
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {})
    },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Custom API Error: ${error}`)
  }

  const data = await response.json()
  return data
}

async function callZhipu(apiKey: string, model: string, systemPrompt: string, userPrompt: string): Promise<any> {
  if (!apiKey) {
    throw new Error('智谱AI API Key 未配置')
  }

  const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`智谱AI API Error: ${error}`)
  }

  const data = await response.json()
  const content = data.choices[0].message.content
  
  try {
    return JSON.parse(content)
  } catch {
    return { raw: content, error: 'JSON解析失败' }
  }
}

// 兼容 OpenAI API 的服务商调用
async function callOpenAICompatible(provider: string, apiKey: string, model: string, systemPrompt: string, userPrompt: string): Promise<any> {
  if (!apiKey) {
    throw new Error('API Key 未配置')
  }

  const apiUrl = getApiUrlForProvider(provider)
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }

  // 不同服务商的认证方式
  if (provider === 'siliconflow') {
    headers['Authorization'] = `Bearer ${apiKey}`
  } else if (provider === 'openrouter') {
    headers['Authorization'] = `Bearer ${apiKey}`
    headers['HTTP-Referer'] = 'https://contract-review.local'
  } else {
    headers['Authorization'] = `Bearer ${apiKey}`
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`API Error (${provider}): ${error}`)
  }

  const data = await response.json()
  const content = data.choices[0].message.content
  
  try {
    return JSON.parse(content)
  } catch {
    return { raw: content, error: 'JSON解析失败' }
  }
}

// 百度文心一言
async function callBaidu(apiKey: string, model: string, systemPrompt: string, userPrompt: string): Promise<any> {
  if (!apiKey) {
    throw new Error('百度API Key 未配置')
  }

  const response = await fetch('https://qianfan.baidubce.com/v2/chat/completion', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`百度API Error: ${error}`)
  }

  const data = await response.json()
  const content = data.choices[0].message.content
  
  try {
    return JSON.parse(content)
  } catch {
    return { raw: content, error: 'JSON解析失败' }
  }
}

// 阿里云通义千问
async function callAliyun(apiKey: string, model: string, systemPrompt: string, userPrompt: string): Promise<any> {
  if (!apiKey) {
    throw new Error('阿里云API Key 未配置')
  }

  const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`阿里云API Error: ${error}`)
  }

  const data = await response.json()
  const content = data.choices[0].message.content
  
  try {
    return JSON.parse(content)
  } catch {
    return { raw: content, error: 'JSON解析失败' }
  }
}

// 腾讯混元
async function callTencent(apiKey: string, model: string, systemPrompt: string, userPrompt: string): Promise<any> {
  if (!apiKey) {
    throw new Error('腾讯API Key 未配置')
  }

  const response = await fetch('https://hunyuan.tencentcloudapi.com/v2/chat/completion', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`腾讯API Error: ${error}`)
  }

  const data = await response.json()
  const content = data.choices[0].message.content
  
  try {
    return JSON.parse(content)
  } catch {
    return { raw: content, error: 'JSON解析失败' }
  }
}

// 月之暗面 Moonshot
async function callMoonshot(apiKey: string, model: string, systemPrompt: string, userPrompt: string): Promise<any> {
  if (!apiKey) {
    throw new Error('Moonshot API Key 未配置')
  }

  const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Moonshot API Error: ${error}`)
  }

  const data = await response.json()
  const content = data.choices[0].message.content
  
  try {
    return JSON.parse(content)
  } catch {
    return { raw: content, error: 'JSON解析失败' }
  }
}
