import Image from 'next/image';
import Link from 'next/link';
import { ditscfLogoImage } from '@/lib/site-content';
import { cn } from '@/lib/utils';

export function BrandLockup({
  href = '/',
  size = 'default',
  className,
}: {
  href?: string;
  size?: 'default' | 'large';
  className?: string;
}) {
  return (
    <Link href={href} className={cn('flex items-center gap-3', className)}>
      <Image
        src={ditscfLogoImage}
        alt="DITSCF Logo"
        className={cn('w-auto object-contain', size === 'large' ? 'h-12' : 'h-10')}
        priority
      />
      <span>
        <strong
          className={cn(
            'block font-bold tracking-wide text-sidebar-primary',
            size === 'large' ? 'text-xl' : 'text-sm',
          )}
        >
          DITSCF
        </strong>
        <small
          className={cn(
            'text-sidebar-foreground/65',
            size === 'large' ? 'text-sm' : 'hidden text-xs sm:block',
          )}
        >
          One Family For Gospel
        </small>
      </span>
    </Link>
  );
}
