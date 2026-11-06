import { Link } from '@/i18n/routing'
import { OwlMark } from '@/components/home/owl-mark'
import { cn } from '@/lib/cn'

/** Same owl tile and name as the home navbar. */
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
        'inline-flex items-center gap-2.5 text-[16px] font-semibold tracking-tight',
        onDark ? 'text-white' : 'text-[#171512]',
        className,
      )}
    >
      <OwlMark ring={onDark} />
      AiSearchOwl
    </Link>
  )
}
