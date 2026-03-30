export interface LegalReference {
  id: string
  category: string
  title: string
  lawName: string
  article: string
  content: string
  keywords: string[]
}

export const legalReferences: LegalReference[] = [
  // 民法典相关
  {
    id: 'mc-101',
    category: '合同效力',
    title: '合同无效的法定情形',
    lawName: '《民法典》',
    article: '第一百四十四条',
    content: '无民事行为能力人订立的合同无效。',
    keywords: ['无效', '民事行为能力', '限制民事行为能力']
  },
  {
    id: 'mc-102',
    category: '合同效力',
    title: '意思表示不真实的合同',
    lawName: '《民法典》',
    article: '第一百四十六条',
    content: '行为人与相对人以虚假的意思表示实施的民事法律行为无效。以虚假的意思表示隐藏的民事法律行为的效力，依照有关法律规定处理。',
    keywords: ['虚假', '意思表示', '欺诈', '胁迫']
  },
  {
    id: 'mc-103',
    category: '合同效力',
    title: '违反强制性规定的合同',
    lawName: '《民法典》',
    article: '第一百五十三条',
    content: '违反法律、行政法规的强制性规定的民事法律行为无效。但是，该强制性规定不导致该民事法律行为无效的除外。违背公序良俗的民事法律行为无效。',
    keywords: ['强制性规定', '公序良俗', '无效', '争议解决', '管辖']
  },
  {
    id: 'mc-104',
    category: '合同效力',
    title: '免责条款无效',
    lawName: '《民法典》',
    article: '第一百九十七条',
    content: '合同中的下列免责条款无效：（一）造成对方人身损害的；（二）因故意或者重大过失造成对方财产损失的。',
    keywords: ['免责条款', '人身损害', '重大过失']
  },
  {
    id: 'mc-201',
    category: '合同履行',
    title: '合同履行的原则',
    lawName: '《民法典》',
    article: '第五百零九条',
    content: '当事人应当按照约定全面履行自己的义务。当事人应当遵循诚信原则，根据合同的性质、目的和交易习惯履行通知、协助、保密等义务。',
    keywords: ['全面履行', '诚信原则', '附随义务']
  },
  {
    id: 'mc-202',
    category: '合同履行',
    title: '合同履行期限约定不明',
    lawName: '《民法典》',
    article: '第五百一十一条',
    content: '履行期限不明确的，债务人可以随时履行，债权人也可以随时请求履行，但是应当给对方必要的准备时间。',
    keywords: ['履行期限', '随时履行', '准备时间']
  },
  {
    id: 'mc-203',
    category: '合同履行',
    title: '验收标准约定不明',
    lawName: '《民法典》',
    article: '第五百一十条',
    content: '合同生效后，当事人就质量、价款或者报酬、履行地点等内容没有约定或者约定不明确的，可以协议补充；不能达成补充协议的，按照合同相关条款或者交易习惯确定。',
    keywords: ['验收标准', '质量', '协议补充', '交易习惯']
  },
  {
    id: 'mc-301',
    category: '违约责任',
    title: '违约金过高或过低的调整',
    lawName: '《民法典》',
    article: '第五百八十五条',
    content: '当事人可以约定一方违约时应当根据违约情况向对方支付一定数额的违约金，也可以约定因违约产生的损失赔偿额的计算方法。约定的违约金低于造成的损失的，人民法院或者仲裁机构可以根据当事人的请求予以增加；约定的违约金过分高于造成的损失的，人民法院或者仲裁机构可以根据当事人的请求予以适当减少。',
    keywords: ['违约金', '过高', '过低', '调整', '违约责任', '违约']
  },
  {
    id: 'mc-302',
    category: '违约责任',
    title: '违约金的限制',
    lawName: '《民法典》',
    article: '第五百八十五条第二款',
    content: '约定的违约金过分高于造成的损失的，人民法院或者仲裁机构可以根据当事人的请求予以适当减少。',
    keywords: ['违约金', '过分高于', '适当减少']
  },
  {
    id: 'mc-303',
    category: '违约责任',
    title: '不可抗力',
    lawName: '《民法典》',
    article: '第一百八十条',
    content: '因不可抗力不能履行民事义务的，不承担民事责任。法律另有规定的，依照其规定。不可抗力是不能预见、不能避免且不能克服的客观情况。',
    keywords: ['不可抗力', '免责', '客观情况']
  },
  {
    id: 'mc-304',
    category: '违约责任',
    title: '损害赔偿范围',
    lawName: '《民法典》',
    article: '第五百八十四条',
    content: '当事人一方不履行合同义务或者履行合同义务不符合约定，造成对方损失的，损失赔偿额应当相当于因违约所造成的损失，包括合同履行后可以获得的利益；但是，不得超过违约一方订立合同时预见到或者应当预见到的因违约可能造成的损失。',
    keywords: ['损害赔偿', '可得利益', '预见规则']
  },
  {
    id: 'mc-401',
    category: '知识产权',
    title: '委托作品的著作权归属',
    lawName: '《著作权法》',
    article: '第十九条',
    content: '受委托创作的作品，著作权的归属由委托人和受托人通过合同约定。合同未作明确约定或者没有订立合同的，著作权属于受托人。',
    keywords: ['委托作品', '著作权归属', '合同约定']
  },
  {
    id: 'mc-402',
    category: '知识产权',
    title: '职务作品的著作权归属',
    lawName: '《著作权法》',
    article: '第十八条',
    content: '自然人为完成法人或者非法人组织工作任务所创作的作品是职务作品，著作权由作者享有，但法人或者非法人组织有权在其业务范围内优先使用。',
    keywords: ['职务作品', '著作权归属', '优先使用']
  },
  {
    id: 'mc-403',
    category: '知识产权',
    title: '技术合同成果归属',
    lawName: '《民法典》',
    article: '第八百五十一条',
    content: '技术合同是当事人就技术开发、转让、许可、咨询或者服务订立的确立相互之间权利和义务的合同。合同标的为当事人订立合同时尚未掌握的产品、工艺、材料及其系统等技术方案。',
    keywords: ['技术合同', '成果归属', '专利申请']
  },
  {
    id: 'lc-101',
    category: '劳动争议',
    title: '劳动合同的效力',
    lawName: '《劳动合同法》',
    article: '第二十六条',
    content: '下列劳动合同无效或者部分无效：（一）以欺诈、胁迫的手段或者乘人之危，使对方在违背真实意思的情况下订立或者变更劳动合同的；（二）用人单位免除自己的法定责任、排除劳动者权利的；（三）违反法律、行政法规强制性规定的。',
    keywords: ['劳动合同无效', '欺诈', '胁迫', '排除劳动者权利']
  },
  {
    id: 'lc-102',
    category: '劳动争议',
    title: '竞业限制',
    lawName: '《劳动合同法》',
    article: '第二十三条',
    content: '用人单位与劳动者可以在劳动合同中约定保守用人单位的商业秘密和与知识产权相关的保密事项。对负有保密义务的劳动者，用人单位可以在劳动合同或者保密协议中与劳动者约定竞业限制条款，并约定在解除或者终止劳动合同后，在竞业限制期限内按月给予劳动者经济补偿。劳动者违反竞业限制约定的，应当按照约定向用人单位支付违约金。',
    keywords: ['竞业限制', '经济补偿', '违约金']
  },
  {
    id: 'lc-103',
    category: '劳动争议',
    title: '竞业限制期限',
    lawName: '《劳动合同法》',
    article: '第二十四条',
    content: '竞业限制的人员限于用人单位的高级管理人员、高级技术人员和其他负有保密义务的人员。竞业限制期限不得超过二年。',
    keywords: ['竞业限制', '期限', '二年', '高级管理人员']
  },
  {
    id: 'lc-104',
    category: '劳动争议',
    title: '经济补偿金',
    lawName: '《劳动合同法》',
    article: '第四十六条',
    content: '有下列情形之一的，用人单位应当向劳动者支付经济补偿：（一）劳动者依照本法第三十八条规定解除劳动合同的；（二）用人单位依照本法第三十六条规定向劳动者提出解除劳动合同并与劳动者协商一致解除劳动合同的；（三）用人单位依照本法第四十条规定解除劳动合同的；（四）用人单位依照本法第四十一条第一款规定解除劳动合同的；...',
    keywords: ['经济补偿金', '解除劳动合同', '支付条件']
  },
  {
    id: 'zl-101',
    category: '租赁合同',
    title: '租赁期限',
    lawName: '《民法典》',
    article: '第七百零五条',
    content: '租赁期限不得超过二十年。超过二十年的，超过部分无效。租赁期限届满，当事人可以续订租赁合同；但是，约定的租赁期限自续订之日起不得超过二十年。',
    keywords: ['租赁期限', '二十年', '续订']
  },
  {
    id: 'zl-102',
    category: '租赁合同',
    title: '租赁物维修',
    lawName: '《民法典》',
    article: '第七百一十三条',
    content: '承租人在租赁物需要维修时可以请求出租人在合理期限内维修。出租人未履行维修义务的，承租人可以自行维修，维修费用由出租人负担。因维修租赁物影响承租人使用的，应当相应减少租金或者延长租期。',
    keywords: ['维修义务', '出租人', '维修费用']
  },
  {
    id: 'zl-103',
    category: '租赁合同',
    title: '租金支付期限',
    lawName: '《民法曲》',
    article: '第七百二十一条',
    content: '承租人应当按照约定的期限支付租金。对支付期限没有约定或者约定不明确，依据本法第五百一十条的规定仍不能确定，租赁期限不满一年的，应当在租赁期限届满时支付；租赁期限一年以上的，应当在每届满一年时支付，剩余期限不满一年的，应当在租赁期限届满时支付。',
    keywords: ['租金支付', '期限', '届满']
  },
  {
    id: 'tz-101',
    category: '投资合同',
    title: '股东出资义务',
    lawName: '《公司法》',
    article: '第二十八条',
    content: '股东应当按期足额缴纳公司章程中规定的各自所认缴的出资额。股东以货币出资的，应当将货币出资足额存入有限责任公司在银行开设的账户；以非货币财产出资的，应当依法办理其财产权的转移手续。',
    keywords: ['股东出资', '足额缴纳', '出资义务']
  },
  {
    id: 'tz-102',
    category: '投资合同',
    title: '股权回购',
    lawName: '《公司法》',
    article: '第七十四条',
    content: '有下列情形之一的，对股东会该项决议投反对票的股东可以请求公司按照合理的价格收购其股权：（一）公司连续五年不向股东分配利润，而公司该五年连续盈利，并且符合本法规定的分配利润条件的；（二）公司合并、分立、转让主要财产的；（三）公司章程规定的营业期限届满或者章程规定的其他解散事由出现，股东会会议通过决议修改章程使公司存续的。',
    keywords: ['股权回购', '收购请求权', '解散事由']
  }
]

export function findLegalReferences(keywords: string[]): LegalReference[] {
  const results: LegalReference[] = []
  const keywordLower = keywords.map(k => k.toLowerCase())
  
  for (const ref of legalReferences) {
    for (const kw of keywordLower) {
      if (ref.keywords.some(keyword => keyword.toLowerCase().includes(kw))) {
        results.push(ref)
        break
      }
    }
  }
  
  // 如果没有匹配，添加通用的违约责任和违约金相关条款
  if (results.length === 0) {
    const defaultRefs = legalReferences.filter(r => 
      r.category === '违约责任' || r.title.includes('违约金')
    )
    return defaultRefs.slice(0, 3)
  }
  
  return results.slice(0, 6) // 最多返回6条
}

export function getReferencesByCategory(category: string): LegalReference[] {
  return legalReferences.filter(ref => ref.category === category)
}
