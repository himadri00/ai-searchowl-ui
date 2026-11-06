import { getRequestConfig } from 'next-intl/server'
import fs from 'fs'
import path from 'path'
import { routing } from './config'

const parseJsonFile = (filePath: string, content: string): Record<string, unknown> => {
  const normalizedContent = content.replace(/^\uFEFF/, '').trim()
  if (!normalizedContent) return {}

  try {
    const parsed = JSON.parse(normalizedContent)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>
    }
    return {}
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`Invalid JSON in ${filePath}: ${message}`)
    return {}
  }
}

const loadMessages = (dir: string): Record<string, unknown> => {
  const messages: Record<string, unknown> = {}
  if (!fs.existsSync(dir)) return messages

  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    if (item.isDirectory()) {
      const nested = loadMessages(path.join(dir, item.name))
      const current = messages[item.name]
      messages[item.name] = {
        ...(current && typeof current === 'object' ? (current as Record<string, unknown>) : {}),
        ...nested,
      }
    } else if (item.name.endsWith('.json')) {
      const key = path.basename(item.name, '.json')
      const filePath = path.join(dir, item.name)
      const fileMessages = parseJsonFile(filePath, fs.readFileSync(filePath, 'utf8'))
      const current = messages[key]
      messages[key] = {
        ...(current && typeof current === 'object' ? (current as Record<string, unknown>) : {}),
        ...fileMessages,
      }
    }
  }

  return messages
}

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale
  if (!locale || !routing.locales.includes(locale as (typeof routing.locales)[number])) {
    locale = routing.defaultLocale
  }

  const messages = loadMessages(path.resolve(process.cwd(), 'messages', locale))
  return { locale, messages }
})
