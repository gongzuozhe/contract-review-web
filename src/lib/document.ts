import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, WidthType, Table, TableRow, TableCell, BorderStyle } from 'docx'
import { saveAs } from 'file-saver'

export interface RiskItem {
  id: number
  level: string
  category: string
  title: string
  clause: string
  analysis?: string
  suggestion?: string
}

export interface ClauseNote {
  clauseTitle: string
  originalContent: string
  revisedContent: string
  note: string
}

export interface ReviewData {
  contractType: string
  stance: string
  overview: {
    overallRisk: string
    highRisk: number
    mediumRisk: number
    lowRisk: number
    summary?: string
  }
  risks: RiskItem[]
  revisedContract?: {
    hasChanges: boolean
    clauseNotes?: ClauseNote[]
    revisedFullContract?: string
  }
  summary?: string
}

export async function generateWordDocument(data: ReviewData): Promise<void> {
  const children: Paragraph[] = []

  // 标题
  children.push(
    new Paragraph({
      text: '合同审查报告（含修改批注）',
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 }
    })
  )

  // 基本信息
  children.push(
    new Paragraph({
      text: '一、基本信息',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 }
    })
  )

  const stanceLabel = data.stance === 'party_a' ? '甲方' : data.stance === 'party_b' ? '乙方' : '第三方'
  const riskLabel = data.overview.overallRisk === 'high' ? '高风险' : data.overview.overallRisk === 'medium' ? '中风险' : '低风险'

  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: '审查视角：', bold: true }),
        new TextRun(stanceLabel),
        new TextRun({ text: '    总体风险：', bold: true, break: 1 }),
        new TextRun({ text: riskLabel, color: getRiskColor(data.overview.overallRisk), bold: true })
      ],
      spacing: { after: 200 }
    })
  )

  // 风险统计
  children.push(
    new Paragraph({
      text: '二、风险概览',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 }
    })
  )

  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: `高风险：${data.overview.highRisk} 项    `, bold: true, color: 'DC2626' }),
        new TextRun({ text: `中风险：${data.overview.mediumRisk} 项    `, bold: true, color: 'D97706' }),
        new TextRun({ text: `低风险：${data.overview.lowRisk} 项`, bold: true, color: '16A34A' })
      ],
      spacing: { after: 300 }
    })
  )

  // 风险详情
  if (data.risks && data.risks.length > 0) {
    children.push(
      new Paragraph({
        text: '三、风险详情',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      })
    )

    for (const risk of data.risks) {
      const riskColor = getRiskColor(risk.level)
      const riskLevelText = risk.level === 'high' ? '【高风险】' : risk.level === 'medium' ? '【中风险】' : '【低风险】'

      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: riskLevelText, bold: true, color: riskColor }),
            new TextRun({ text: ` ${risk.title}`, bold: true })
          ],
          spacing: { before: 200, after: 100 }
        })
      )

      if (risk.clause) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: '原文：', bold: true }),
              new TextRun(risk.clause)
            ],
            indent: { left: 720 },
            spacing: { after: 100 }
          })
        )
      }

      if (risk.analysis) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: '分析：', bold: true }),
              new TextRun(risk.analysis)
            ],
            indent: { left: 720 },
            spacing: { after: 100 }
          })
        )
      }

      if (risk.suggestion) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: '修改建议：', bold: true }),
              new TextRun(risk.suggestion)
            ],
            indent: { left: 720 },
            spacing: { after: 200 }
          })
        )
      }
    }
  }

  // 完整修订版合同
  if (data.revisedContract?.revisedFullContract) {
    children.push(
      new Paragraph({
        text: '四、完整修订版合同',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      })
    )

    children.push(
      new Paragraph({
        text: '（注：修改处已用【修订：...】格式标注，红色为修改内容，【批注：】后为修改原因）',
        spacing: { after: 200 }
      })
    )

    // 解析修订内容，分段显示
    const revisedText = data.revisedContract.revisedFullContract
    const lines = revisedText.split('\n')
    
    for (const line of lines) {
      if (line.trim()) {
        // 检测是否为修订行（包含【修订：）
        if (line.includes('【修订：')) {
          // 尝试分离原文和修改内容
          const match = line.match(/【修订：([^→]+)→([^｜]+)｜?【批注：([^】]+)?】?/)
          if (match) {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({ text: `[删除]${match[1]}`, color: '999999' }), // 原文删除
                  new TextRun({ text: ' → ', color: 'CC0000', bold: true }),
                  new TextRun({ text: match[2], color: 'CC0000', bold: true }), // 新内容
                  match[3] ? new TextRun({ text: ` 【批注：${match[3]}】`, color: '008000', italics: true }) : null,
                ].filter(Boolean) as TextRun[],
                spacing: { after: 100 }
              })
            )
          } else {
            // 无法解析，按原样显示
            children.push(
              new Paragraph({
                text: line,
                spacing: { after: 100 }
              })
            )
          }
        } else {
          // 普通文本
          children.push(
            new Paragraph({
              text: line,
              spacing: { after: 100 }
            })
          )
        }
      }
    }
  }

  // 总结
  if (data.summary) {
    children.push(
      new Paragraph({
        text: data.revisedContract ? '五、总结' : '四、总结',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      })
    )

    children.push(
      new Paragraph({
        text: data.summary,
        spacing: { after: 200 }
      })
    )
  }

  // 创建文档
  const doc = new Document({
    sections: [{
      properties: {},
      children: children
    }]
  })

  // 生成并下载
  const blob = await Packer.toBlob(doc)
  saveAs(blob, `合同审查报告_含批注_${Date.now()}.docx`)
}

function getContractTypeName(type: string): string {
  const names: Record<string, string> = {
    rental: '租赁合同',
    labor: '劳动合同',
    commercial: '商业合同',
    ip: '知识产权合同',
    investment: '投资合同'
  }
  return names[type] || '商业合同'
}

function getRiskColor(level: string): string {
  switch (level) {
    case 'high': return 'DC2626'
    case 'medium': return 'D97706'
    default: return '16A34A'
  }
}
