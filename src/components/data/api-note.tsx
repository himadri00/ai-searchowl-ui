export function ApiNote({
  loading,
  error,
  shown,
  total,
}: {
  loading: boolean
  error: string | null
  shown?: number
  total?: number
}) {
  if (error) {
    return (
      <p role="status" className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] leading-5 text-rose-800">
        {error}
      </p>
    )
  }
  if (loading) {
    return <p role="status" className="mb-3 text-[13px] text-zinc-500">Loading this page.</p>
  }
  if (shown != null && total != null && total > shown) {
    return (
      <p role="status" className="mb-3 text-[13px] leading-5 text-zinc-600">
        Showing {shown} of {total}. Narrow the date range to see a smaller set.
      </p>
    )
  }
  return null
}
