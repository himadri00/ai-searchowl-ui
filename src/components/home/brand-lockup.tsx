import { Link } from '@/i18n/routing'
import { AiSearchMark } from '@/components/shell/brand-mark'
import { cn } from '@/lib/cn'

/** Same editorial mark and name as the home navbar. */
export function BrandLockup({
  onDark = false,
  className,
}: {
  onDark?: boolean
  className?: string
}) {
  return (
    <Link
      href="/"
      className={cn(
        'inline-flex items-center gap-2.5 text-[16px] font-extrabold tracking-[-0.02em]',
        onDark ? 'text-white' : 'text-[#171512]',
        className,
      )}
    >
      <AiSearchMark size={32} />
      AiSearchOwl
    </Link>
  )
}
