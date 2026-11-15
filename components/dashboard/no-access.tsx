import Link from 'next/link';
import { dashboardCardClassName } from '@/components/dashboard/dashboard-page';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const DEFAULT_MESSAGE =
  "Your current responsibilities don't include this page.";

/** Shown when the UI rules or an API 403 refuse a page. Never signs the user out. */
export function NoAccess({ message = DEFAULT_MESSAGE }: { message?: string }) {
  return (
    <Card className={cn('mx-auto max-w-xl p-6', dashboardCardClassName)}>
      <h1 className='text-xl font-bold text-foreground'>
        You don&apos;t have access to this page
      </h1>
      <p className='mt-2 text-muted-foreground'>{message}</p>
      <Button asChild size='sm' className='mt-5'>
        <Link href='/dashboard/home'>Back to home</Link>
      </Button>
    </Card>
  );
}
