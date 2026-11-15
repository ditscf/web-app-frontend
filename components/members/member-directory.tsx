'use client';

import { useCallback, useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { useCurrentActor } from '@/components/auth/current-actor-provider';
import { EmptyState, ErrorState, LoadingState } from '@/components/dashboard/async-state';
import {
  DashboardPage,
  dashboardCardClassName,
} from '@/components/dashboard/dashboard-page';
import { NoAccess } from '@/components/dashboard/no-access';
import { PageHeader } from '@/components/dashboard/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getUserFacingMessage, toApiError } from '@/lib/api/errors';
import {
  getMemberSummary,
  listMembers,
  type MemberDirectoryFilters,
  type MemberDirectoryList,
  type MemberDirectoryOnboarded,
  type MemberDirectoryStatus,
  type MemberDirectorySummary,
} from '@/lib/api/members';
import { canViewMemberDirectory } from '@/lib/auth/access';
import { cn } from '@/lib/utils';

const STATUS_ALL = 'all';
const ONBOARDED_ALL = 'all';

const countChartConfig = {
  count: {
    label: 'Members',
    color: 'var(--accent)',
  },
} satisfies ChartConfig;

type LoadState =
  | { status: 'loading' }
  | {
      status: 'ready';
      list: MemberDirectoryList;
      summary: MemberDirectorySummary;
    }
  | { status: 'error'; message: string }
  | { status: 'forbidden'; message: string };

export function MemberDirectory() {
  const actor = useCurrentActor();
  const isAllowed = canViewMemberDirectory(actor);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(STATUS_ALL);
  const [onboardedFilter, setOnboardedFilter] = useState<string>(ONBOARDED_ALL);
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedQ(searchInput.trim());
    }, 300);
    return () => window.clearTimeout(handle);
  }, [searchInput]);

  const filters: MemberDirectoryFilters = {
    q: debouncedQ || undefined,
    status:
      statusFilter === STATUS_ALL
        ? undefined
        : (statusFilter as MemberDirectoryStatus),
    onboarded:
      onboardedFilter === ONBOARDED_ALL
        ? undefined
        : (onboardedFilter as MemberDirectoryOnboarded),
  };

  const reload = useCallback(() => {
    setState({ status: 'loading' });
    Promise.all([listMembers(filters), getMemberSummary(filters)])
      .then(([list, summary]) => setState({ status: 'ready', list, summary }))
      .catch((error: unknown) => {
        const apiError = toApiError(error);
        if (apiError.kind === 'unauthenticated') return;
        if (apiError.kind === 'forbidden') {
          setState({ status: 'forbidden', message: apiError.message });
          return;
        }
        setState({ status: 'error', message: getUserFacingMessage(error) });
      });
    // filters identity: depend on the three filter values, not the object.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional filter fields
  }, [debouncedQ, statusFilter, onboardedFilter]);

  useEffect(() => {
    if (!isAllowed) return;
    reload();
  }, [isAllowed, reload]);

  if (!isAllowed) return <NoAccess />;
  if (state.status === 'forbidden') return <NoAccess message={state.message} />;

  const members = state.status === 'ready' ? state.list.members : [];
  const summary = state.status === 'ready' ? state.summary : null;

  const statusChartData =
    summary?.byStatus.map((row) => ({
      label: row.status === 'ACTIVE' ? 'Active' : 'Associate',
      count: row.count,
    })) ?? [];
  const onboardedChartData =
    summary?.byOnboarded.map((row) => ({
      label: row.onboarded ? 'Onboarded' : 'Not onboarded',
      count: row.count,
    })) ?? [];
  const yearChartData =
    summary?.byYearOfStudy.map((row) => ({
      label: row.yearOfStudy,
      count: row.count,
    })) ?? [];

  return (
    <DashboardPage>
      <PageHeader
        eyebrow="Members"
        title="Fellowship directory"
        description="Names and Fellowship IDs for Active Members and Associates. Search, filter, and composition counts for top officers."
      />

      <Card className={cn(dashboardCardClassName)}>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold tracking-normal normal-case">
            Search and filters
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="grid gap-2 sm:col-span-1">
            <Label htmlFor="member-search">Search</Label>
            <Input
              id="member-search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Name or Fellowship ID"
              autoComplete="off"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="member-status">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger id="member-status" className="w-full">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={STATUS_ALL}>All statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="ASSOCIATE">Associate</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="member-onboarded">Onboarding</Label>
            <Select value={onboardedFilter} onValueChange={setOnboardedFilter}>
              <SelectTrigger id="member-onboarded" className="w-full">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ONBOARDED_ALL}>All</SelectItem>
                <SelectItem value="true">Onboarded</SelectItem>
                <SelectItem value="false">Not onboarded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {state.status === 'error' ? <ErrorState message={state.message} /> : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <CompositionChart
          title="By status"
          data={statusChartData}
          isLoading={state.status === 'loading'}
        />
        <CompositionChart
          title="By onboarding"
          data={onboardedChartData}
          isLoading={state.status === 'loading'}
        />
        <CompositionChart
          title="By year of study"
          data={yearChartData}
          isLoading={state.status === 'loading'}
        />
      </div>

      <Card className={cn(dashboardCardClassName)}>
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
          <CardTitle className="text-base font-semibold tracking-normal normal-case">
            Directory
          </CardTitle>
          {summary ? (
            <p className="text-sm text-muted-foreground">
              {summary.total} {summary.total === 1 ? 'member' : 'members'}
            </p>
          ) : null}
        </CardHeader>
        <CardContent>
          {state.status === 'loading' ? (
            <LoadingState label="Loading members" />
          ) : members.length === 0 ? (
            <EmptyState
              title="No members match"
              description="Try a different name, Fellowship ID, or filter."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Fellowship ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.personId}>
                    <TableCell className="font-medium">
                      {member.firstName} {member.lastName}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {member.fellowshipId}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </DashboardPage>
  );
}

function CompositionChart({
  title,
  data,
  isLoading,
}: {
  title: string;
  data: { label: string; count: number }[];
  isLoading: boolean;
}) {
  return (
    <Card className={cn(dashboardCardClassName)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data for this filter.</p>
        ) : (
          <ChartContainer config={countChartConfig} className="aspect-4/3 w-full">
            <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                interval={0}
                angle={data.length > 4 ? -25 : 0}
                textAnchor={data.length > 4 ? 'end' : 'middle'}
                height={data.length > 4 ? 60 : 30}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                width={32}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={0} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
