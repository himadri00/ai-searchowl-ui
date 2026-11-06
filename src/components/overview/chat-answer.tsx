import type { ReactNode } from 'react'

type Para = { lines: string[]; cites: string[]; lead: boolean }
type Block =
  | { type: 'p'; para: Para }
  | { type: 'h'; text: string }
  | { type: 'ol'; items: Para[][] }
  | { type: 'ul'; items: Para[][] }
  | { type: 'table'; headers: string[]; rows: string[][] }

export function ChatAnswer({ text }: { text: string }) {
  const blocks = parseAnswer(text)
  if (!blocks.length) return null
  return (
    <div className="text-[16px] leading-7 text-[#0d0d0d]">
      {blocks.map((block, index) => {
        if (block.type === 'h') {
          return <h3 key={index} className="mt-6 text-[20px] font-semibold leading-7 tracking-tight first:mt-0">{inline(block.text)}</h3>
        }
        if (block.type === 'table') return <AnswerTable key={index} headers={block.headers} rows={block.rows} />
        if (block.type === 'ol' || block.type === 'ul') {
          const List = block.type === 'ol' ? 'ol' : 'ul'
          return (
            <List key={index} className={block.type === 'ol' ? 'mt-4 list-decimal space-y-4 pl-6' : 'mt-4 list-disc space-y-3 pl-6'}>
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} className="pl-1">
                  {item.map((para, paraIndex) => (
                    <p key={paraIndex} className={paraIndex === 0 ? '' : 'mt-2'}>
                      <ParaText para={para} title={paraIndex === 0} />
                    </p>
                  ))}
                </li>
              ))}
            </List>
          )
        }
        return (
          <p key={index} className="mt-4 first:mt-0">
            <ParaText para={block.para} title={false} />
          </p>
        )
      })}
    </div>
  )
}

function ParaText({ para, title }: { para: Para; title: boolean }) {
  return (
    <>
      {para.lines.map((line, index) => (
        <span key={index}>
          {index > 0 ? <br /> : null}
          {para.lead || (title && index === 0) ? <span className="font-semibold">{formatLine(line)}</span> : formatLine(line)}
        </span>
      ))}
      {para.cites.map((cite, citeIndex) => (
        <span key={`${cite}-${citeIndex}`} className="ml-1.5 inline-flex translate-y-[-1px] items-center rounded-full bg-[#f4f4f4] px-2 py-0.5 align-middle text-[12px] leading-4 text-[#5d5d5d]">{cite}</span>
      ))}
    </>
  )
}

function AnswerTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="mt-4 overflow-x-auto rounded-xl border border-[#ececec]">
      <table className="w-full border-collapse text-left text-[14px] leading-6">
        <thead>
          <tr className="bg-[#f7f7f8]">
            {headers.map((header, headerIndex) => (
              <th key={headerIndex} className="px-3 py-2 font-medium">{inline(header)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-t border-[#ececec]">
              {headers.map((_, cell) => (
                <td key={cell} className="px-3 py-2 align-top">{inline(row[cell] ?? '')}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function formatLine(text: string) {
  const label = text.match(/^([^:]{2,40}):\s+(\S.*)$/)
  if (!label || label[1].includes('http')) return inline(text)
  return (
    <>
      <span className="font-semibold">{inline(label[1])}:</span> {inline(label[2])}
    </>
  )
}

function inline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) return <strong key={index} className="font-semibold">{part.slice(2, -2)}</strong>
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) return <code key={index} className="rounded bg-[#f4f4f4] px-1 py-0.5 text-[0.92em]">{part.slice(1, -1)}</code>
    return <span key={index}>{part}</span>
  })
}

export function parseAnswer(text: string): Block[] {
  const chunks = text.replace(/\r\n/g, '\n').trim().split(/\n{2,}/)
  const blocks: Block[] = []
  let list: { type: 'ol' | 'ul'; items: Para[][] } | null = null

  const flush = () => {
    if (!list) return
    blocks.push(list)
    list = null
  }

  for (const chunk of chunks) {
    const lines = chunk.split('\n').map((line) => line.trim()).filter(Boolean)
    if (!lines.length) continue
    if (lines.every((line) => line.startsWith('|'))) {
      flush()
      const table = parseTable(lines)
      if (table) blocks.push(table)
      continue
    }
    const numbered = lines[0].match(/^\d+\.\s+(.*)$/)
    const bulleted = lines.every((line) => /^[-*]\s+/.test(line))
    if (numbered) {
      if (!list || list.type !== 'ol') {
        flush()
        list = { type: 'ol', items: [] }
      }
      list.items.push([makePara([numbered[1], ...lines.slice(1)], false)])
      continue
    }
    if (bulleted) {
      flush()
      blocks.push({
        type: 'ul',
        items: lines.map((line) => [makePara([line.replace(/^[-*]\s+/, '')], false)]),
      })
      continue
    }
    if (isHeading(lines)) {
      flush()
      blocks.push({ type: 'h', text: lines[0].replace(/^#{1,3}\s+/, '') })
      continue
    }
    if (isCitation(lines[0]) && lines.length === 1) {
      attachCite(blocks, list, lines[0])
      continue
    }
    const para = makePara(lines, isLead(lines))
    if (list && list.items.length) {
      list.items[list.items.length - 1].push(para)
      continue
    }
    blocks.push({ type: 'p', para })
  }
  flush()
  return blocks
}

function makePara(lines: string[], lead: boolean): Para {
  const body = [...lines]
  const cites: string[] = []
  while (body.length > 1 && isCitation(body[body.length - 1])) cites.unshift(body.pop() as string)
  return { lines: body, cites, lead }
}

function attachCite(blocks: Block[], list: { items: Para[][] } | null, cite: string) {
  if (list && list.items.length) {
    const item = list.items[list.items.length - 1]
    const para = item[item.length - 1]
    if (para && !para.cites.includes(cite)) para.cites.push(cite)
    return
  }
  const last = blocks[blocks.length - 1]
  if (last?.type === 'p' && !last.para.cites.includes(cite)) last.para.cites.push(cite)
}

function isCitation(line: string) {
  const text = line.trim()
  if (!text || text.length > 28 || /[?]/.test(text) || text.endsWith(':')) return false
  if (/^\+\s*\d+$/.test(text)) return true
  const words = text.split(/\s+/)
  if (words.length > 2 || /[.!]$/.test(text)) return false
  return words.length === 1 || text.length <= 22
}

function isLead(lines: string[]) {
  return lines.length === 1 && /:\s*$/.test(lines[0]) && lines[0].length < 100
}

function isHeading(lines: string[]) {
  if (lines.length !== 1) return false
  const text = lines[0].replace(/^#{1,3}\s+/, '').trim()
  if (text.length < 12 || text.length > 90 || /[.!]$/.test(text) || isCitation(text) || isLead(lines)) return false
  const words = text.replace(/[?:]/g, '').split(/\s+/).filter(Boolean)
  return words.length >= 3 || text.endsWith('?')
}

function parseTable(lines: string[]): Block | null {
  const body = lines.filter((line) => !/^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line))
  if (body.length < 2) return null
  const headers = splitRow(body[0])
  const rows = body.slice(1).map(splitRow)
  if (!headers.length) return null
  return { type: 'table', headers, rows }
}

function splitRow(line: string) {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim())
}
