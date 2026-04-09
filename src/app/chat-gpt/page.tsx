'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Bot, User, Trash2, Loader2, Sparkles, Database, BarChart2, FileSpreadsheet, Download } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { toPng } from 'html-to-image'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp?: number
}

const COLORS = ['#2e7d32', '#3f7bdc', '#f9a825', '#e53935', '#0288d1', '#7b1fa2'];

export default function ChatGPTPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isExporting, setIsExporting] = useState<number | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem('chat_gpt_session')
    if (saved) {
      try {
        setMessages(JSON.parse(saved))
      } catch (e) {
        console.error("Failed to load session", e)
      }
    } else {
        setMessages([])
    }
  }, [])

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chat_gpt_session', JSON.stringify(messages))
    }
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    const userMsg: Message = { role: 'user', content: input, timestamp: Date.now() }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput('')
    setIsLoading(true)
    try {
      const response = await fetch('/api/chat-gpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
      })
      const data = await response.json()
      if (!response.ok) {
        const errorMessage =
          typeof data?.error === 'string' && data.error.trim()
            ? data.error
            : 'ไม่สามารถเชื่อมต่อบริการ AI ได้ในขณะนี้'
        throw new Error(errorMessage)
      }
      // Fix: Some responses might be nested or have different structures
      const content = data.content || data.text || "No response received.";
      setMessages(prev => [...prev, { role: 'assistant', content, timestamp: Date.now() }])
    } catch (err) {
      console.error(err)
      const errorMessage = err instanceof Error && err.message
        ? err.message
        : "ขออภัยครับ เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์"
      setMessages(prev => [...prev, { role: 'assistant', content: errorMessage, timestamp: Date.now() }])
    } finally {
      setIsLoading(false)
    }
  }

  const exportToExcel = async (messageIndex: number) => {
    const msg = messages[messageIndex]
    if (!msg) return

    setIsExporting(messageIndex)
    try {
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('HDC Data Analysis')

      // 1. Find table data in markdown
      const tableMatch = msg.content.match(/\|(.+)\|.*\n\|[-:| ]+\|\n((\|.+\|.*\n)+)/)
      if (tableMatch) {
          const headers = tableMatch[1].split('|').map(h => h.trim()).filter(h => h)
          const rows = tableMatch[2].trim().split('\n').map(r => r.split('|').map(c => c.trim()).filter(c => c))
          
          worksheet.addRow(headers)
          rows.forEach(r => worksheet.addRow(r))
          
          // Style headers
          worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
          worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E7D32' } }
          worksheet.columns = headers.map(() => ({ width: 25 }))
      }

      // 2. Add Chart image if exists
      const chartNode = document.getElementById(`chart-${messageIndex}`)
      if (chartNode) {
        const dataUrl = await toPng(chartNode, { backgroundColor: 'white' })
        const imageId = workbook.addImage({
          base64: dataUrl,
          extension: 'png',
        })
        worksheet.addImage(imageId, {
          tl: { col: 0, row: (worksheet.rowCount || 0) + 2 },
          ext: { width: 600, height: 400 }
        })
      }

      const buffer = await workbook.xlsx.writeBuffer()
      saveAs(new Blob([buffer]), `HDC_Analysis_${Date.now()}.xlsx`)
    } catch (err) {
      console.error("Export failed", err)
    } finally {
      setIsExporting(null)
    }
  }

  const renderChart = (jsonStr: string, index: number) => {
    try {
      const config = JSON.parse(jsonStr)
      const { type, title, data } = config
      const chartId = `chart-${index}`

      const ChartWrapper = ({ children }: { children: React.ReactNode }) => (
        <div id={chartId} style={{ height: 320, width: '100%', margin: '15px 0', background: 'white', padding: '15px', borderRadius: '12px', border: '1px solid var(--border)', position: 'relative' }}>
          <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '12px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart2 size={16} color="var(--accent)" /> {title}
          </div>
          <ResponsiveContainer width="100%" height="85%">
            {children as any}
          </ResponsiveContainer>
        </div>
      )

      if (type === 'bar') return <ChartWrapper><BarChart data={data}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" /><XAxis dataKey="name" fontSize={11} /><YAxis fontSize={11} /><Tooltip /><Bar dataKey="value" fill="var(--accent)" radius={[4, 4, 0, 0]} /></BarChart></ChartWrapper>
      if (type === 'line') return <ChartWrapper><LineChart data={data}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" /><XAxis dataKey="name" fontSize={11} /><YAxis fontSize={11} /><Tooltip /><Line type="monotone" dataKey="value" stroke="var(--action-secondary)" strokeWidth={2} dot={{ r: 4 }} /></LineChart></ChartWrapper>
      if (type === 'pie') return <ChartWrapper><PieChart><Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={{ fontSize: 10 }}>{data.map((e: any, i: number) => (<Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />))}</Pie><Tooltip /><Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} /></PieChart></ChartWrapper>
      return null
    } catch (e) { return <pre style={{ fontSize: '10px', color: 'red' }}>{jsonStr}</pre> }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxWidth: '1000px', margin: '0 auto', background: 'var(--bg-secondary)', borderRadius: '24px', boxShadow: 'var(--shadow-lg)', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
      <div style={{ padding: '18px 24px', background: 'linear-gradient(90deg, #f1f8e9, #ffffff)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #2e7d32, #43a047)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 12px rgba(46, 125, 50, 0.2)' }}>
            <Sparkles size={22} fill="white" />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>Chat GPT (OpenAI)<span style={{ fontSize: '10px', padding: '2px 8px', background: 'var(--bg-active)', borderRadius: '10px', fontWeight: 500 }}>BETA</span></div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>วิเคราะห์ข้อมูลและช่วยเหลือการใช้งาน HDC ด้วย GPT</div>
          </div>
        </div>
        <button onClick={() => { localStorage.removeItem('chat_gpt_session'); setMessages([])}} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px', borderRadius: '10px', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }} onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#ef4444'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}><Trash2 size={16} /> ล้างการสนทนา</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: '12px', maxWidth: '100%', animation: 'fadeIn 0.3s ease forwards' }}>
            {msg.role === 'assistant' && (<div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--bg-active)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', flexShrink: 0, marginTop: '4px' }}><Bot size={18} /></div>)}
            <div style={{ maxWidth: '85%', padding: '14px 18px', borderRadius: msg.role === 'user' ? '20px 4px 20px 20px' : '4px 20px 20px 20px', background: msg.role === 'user' ? 'linear-gradient(135deg, #1f3d7a, #3f7bdc)' : 'white', color: msg.role === 'user' ? 'white' : 'var(--text-primary)', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: msg.role === 'user' ? 'none' : '1px solid var(--border-light)', lineHeight: 1.6, fontSize: '14px', position: 'relative' }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                  table: ({node, ...props}) => <div style={{ overflowX: 'auto', margin: '12px 0' }}><table className="chat-table" {...props} /></div>,
                  code: ({node, inline, className, children, ...props}: any) => {
                    const match = /language-(\w+)/.exec(className || '')
                    if (!inline && match && match[1] === 'chart') return renderChart(String(children).replace(/\n$/, ''), i)
                    return <code className={className} style={{ background: msg.role === 'user' ? 'rgba(255,255,255,0.1)' : '#f3f4f6', padding: '2px 4px', borderRadius: '4px' }} {...props}>{children}</code>
                  }
                }}>{msg.content}</ReactMarkdown>
              
              {msg.role === 'assistant' && (msg.content.includes('|') || msg.content.includes('```chart')) && (
                <button 
                  onClick={() => exportToExcel(i)}
                  disabled={isExporting === i}
                  style={{ 
                    marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', 
                    padding: '6px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border)',
                    borderRadius: '8px', fontSize: '12px', cursor: 'pointer', color: 'var(--accent)',
                    fontWeight: 600, transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-primary)'}
                >
                  {isExporting === i ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
                  ส่งออกเป็น Excel และ กราฟ
                </button>
              )}
            </div>
            {msg.role === 'user' && (<div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--action-highlight)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--action-primary)', flexShrink: 0, marginTop: '4px' }}><User size={18} /></div>)}
          </div>
        ))}
        {isLoading && (<div style={{ display: 'flex', gap: '12px', animation: 'fadeIn 0.3s ease forwards' }}><div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--bg-active)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', flexShrink: 0 }}><Bot size={18} /></div><div style={{ padding: '14px 24px', borderRadius: '4px 20px 20px 20px', background: 'white', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '13px' }}><Loader2 size={16} className="animate-spin" />กำลังประมวลผลคำตอบ...</div></div>)}
        {messages.length === 0 && !isLoading && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 40px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              {[
                { icon: <Database size={18} />, text: "สรุปจำนวนประชากรรายหน่วยงาน พร้อมกราฟแท่ง", prompt: "ขอสรุปจำนวนประชากรรายหน่วยงาน (รพ.สต.) ทุกแห่งในระบบดาต้าเซ็นเตอร์ พร้อมกราฟแท่ง" },
                { icon: <User size={18} />, text: "วิเคราะห์สัดส่วนเพศประชากร กราฟวงกลม", prompt: "สรุปยอดประชากรแยกตามเพศทั้งหมดในอำเภอวัดโบสถ์ และแสดงเป็นกราฟวงกลม" },
                { icon: <BarChart2 size={18} />, text: "5 อันดับหน่วยงานที่มีประชากรมากที่สุด", prompt: "แสดงรายชื่อหน่วยงาน 5 อันดับแรกที่มีจำนวนประชากรมากที่สุด พร้อมยอดรวมประชากร" },
                { icon: <FileSpreadsheet size={18} />, text: "สรุปจำนวนประชากรแยกตามกลุ่มอายุ", prompt: "สรุปจำนวนประชากรแยกตามช่วงอายุ 0-15 ปี, 16-60 ปี และ 60 ปีขึ้นไป ว่ามีกี่คน" }
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInput(item.prompt);
                    // Trigger send by providing the input directly to a version of handleSend that can take it, 
                    // but since handleSend is already defined, we'll just wait for state update.
                    // 200ms is safer for state propagation
                    setTimeout(() => {
                        const btn = document.getElementById('send-button');
                        btn?.click();
                    }, 200);
                  }}
                  style={{
                    padding: '24px', background: 'white', border: '1px solid var(--border)',
                    borderRadius: '20px', textAlign: 'left', cursor: 'pointer',
                    transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'white'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <div style={{ color: 'var(--accent)', background: 'var(--bg-active)', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{item.text}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>คลิกเพื่อเริ่มวิเคราะห์ทันที</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <div style={{ padding: '24px', borderTop: '1px solid var(--border-light)', background: 'white' }}>
        <div style={{ display: 'flex', gap: '12px', background: '#f8fafc', padding: '6px', borderRadius: '16px', border: '1px solid var(--border)', transition: 'border-color 0.2s' }} onFocusCapture={e => e.currentTarget.style.borderColor = 'var(--accent)'} onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--border)'}>
            <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}} placeholder="ถามข้อมูลที่คุณสนใจ..." style={{ flex: 1, border: 'none', background: 'transparent', padding: '12px 16px', resize: 'none', fontSize: '14px', height: '48px', outline: 'none', color: 'var(--text-primary)' }} />
            <button 
              id="send-button"
              onClick={handleSend}
 disabled={!input.trim() || isLoading} style={{ width: '48px', height: '48px', borderRadius: '12px', background: !input.trim() || isLoading ? 'var(--border)' : 'var(--accent)', border: 'none', color: 'white', cursor: !input.trim() || isLoading ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', boxShadow: !input.trim() || isLoading ? 'none' : '0 4px 12px rgba(46, 125, 50, 0.2)' }}>{isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}</button>
        </div>
        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}><span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Database size={10} /> ดึงข้อมูลผ่าน db-cli</span><span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FileSpreadsheet size={10} /> ส่งออก Excel พร้อมกราฟ</span></div>
      </div>
    </div>
  )
}
