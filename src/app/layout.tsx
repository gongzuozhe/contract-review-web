import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '合同审查 - AI 智能合同风险分析',
  description: '专业的 AI 合同审查工具，帮助您识别合同风险、提供修改建议',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-800 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-xl font-bold text-gray-900">合同审查</span>
              </div>
              <nav className="flex items-center gap-6">
                <a href="/" className="text-gray-600 hover:text-primary-600 transition-colors">首页</a>
                <a href="#features" className="text-gray-600 hover:text-primary-600 transition-colors">功能</a>
                <a href="/settings" className="text-gray-600 hover:text-primary-600 transition-colors">设置</a>
              </nav>
            </div>
          </div>
        </header>
        <main>{children}</main>
        <footer className="bg-white border-t border-gray-200 mt-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <p className="text-center text-gray-500 text-sm">
              © 2026 合同审查工具 - AI 智能合同风险分析
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
