import { baseMatrix, brands } from './overview'
import type { DimensionKey, MetricKey } from './types'
import { dimensionMembers } from './types'

function hash(value: string) {
  let h = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function transpose(grid: Array<Array<number | null>>) {
  const cols = grid[0]?.length ?? 0
  return Array.from({ length: cols }, (_, col) => grid.map((row) => row[col] ?? null))
}

function scaleCell(value: number | null, metric: MetricKey, factor: number) {
  if (value === null) return null
  if (value === 0) return 0
  if (metric === 'position') {
    const next = Math.round((value + (1 - factor) * 2) * 10) / 10
    return Math.min(9.9, Math.max(1, next))
  }
  if (metric === 'sentiment') {
    return Math.max(1, Math.min(100, Math.round(value * (0.85 + factor * 0.15))))
  }
  return Math.round(value * factor * 10) / 10
}

function scaleGrid(grid: Array<Array<number | null>>, metric: MetricKey, factor: number) {
  return grid.map((row) => row.map((cell) => scaleCell(cell, metric, factor)))
}

function generatedCell(metric: MetricKey, rowId: string, colId: string, brandId: string): number | null {
  const seed = hash(`${brandId}:${metric}:${rowId}:${colId}`)
  if (seed % 7 === 0) return null
  if (metric === 'position') return Math.round((1 + (seed % 70) / 10) * 10) / 10
  if (metric === 'sentiment') return 45 + (seed % 25)
  if (seed % 5 === 0) return 0
  if (metric === 'sov') return Math.round(((seed % 400) / 10) * 10) / 10
  return Math.round(((seed % 280) / 10) * 10) / 10
}

export function membersFor(dimension: DimensionKey, brandId: string) {
  if (dimension === 'brands') {
    const brand = brands.find((item) => item.id === brandId) ?? brands[0]
    return brand.competitors.map((item) => item.id)
  }
  return dimensionMembers[dimension]
}

export function matrixGrid(metric: MetricKey, x: DimensionKey, y: DimensionKey, brandId: string) {
  const brand = brands.find((item) => item.id === brandId) ?? brands[0]
  const cols = membersFor(x, brandId)
  const rows = membersFor(y, brandId)

  if (x === y) {
    return { cols, rows, cells: [] as Array<Array<number | null>>, sameAxis: true }
  }

  const tagTopic =
    (x === 'topics' && y === 'tags') || (x === 'tags' && y === 'topics')

  if (tagTopic) {
    const scaled = scaleGrid(baseMatrix[metric], metric, brand.matrixScale)
    const grid = x === 'topics' ? scaled : transpose(scaled)
    return { cols, rows, cells: grid, sameAxis: false }
  }

  const cells = rows.map((rowId) => cols.map((colId) => generatedCell(metric, rowId, colId, brandId)))
  return { cols, rows, cells, sameAxis: false }
}
