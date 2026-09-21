import { Link, createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { format, parseISO } from "date-fns"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { ErrorScreen } from "@/components/common/screens"
import { PageHeader } from "@/components/layout/page-header"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { ChartConfig } from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { healthQueryOptions } from "@/features/health/api"
import { statsQueryOptions } from "@/features/stats/queries"
import { initials, userLabel } from "@/features/users/schemas"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/_app/admin/")({
  component: Dashboard,
})

const chartConfig = {
  count: { label: "Signups", color: "var(--chart-2)" },
} satisfies ChartConfig

function Dashboard() {
  const stats = useQuery(statsQueryOptions)

  if (stats.isError) {
    return (
      <ErrorScreen error={stats.error} reset={() => void stats.refetch()} />
    )
  }

  const s = stats.data
  const last7 = s?.signups.slice(-7).reduce((n, d) => n + d.count, 0)
  const last30 = s?.signups.reduce((n, d) => n + d.count, 0)

  const cards: [string, number | undefined][] = [
    ["Total users", s?.users.total],
    ["Administrators", s?.users.admins],
    ["Active", s?.users.active],
    ["Deactivated", s?.users.inactive],
    ["Unverified emails", s?.users.unverified],
    ["New (7 d)", last7],
    ["New (30 d)", last30],
  ]

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Dashboard"
        description={
          s?.truncatedAt
            ? `Based on the most recent ${s.truncatedAt.toLocaleString()} users.`
            : undefined
        }
        actions={
          <Link
            to="/admin/users"
            className={buttonVariants({ variant: "outline" })}
          >
            View all users
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([label, value]) => (
          <Card key={label} size="sm">
            <CardHeader>
              <CardDescription>{label}</CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {value === undefined ? (
                  <Skeleton className="h-7 w-12" />
                ) : (
                  value.toLocaleString()
                )}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
        <SystemStatus />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Signups, last 30 days</CardTitle>
          </CardHeader>
          <CardContent>
            {s ? (
              <ChartContainer config={chartConfig} className="h-56 w-full">
                <BarChart data={s.signups}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    minTickGap={24}
                    tickFormatter={(d: string) => format(parseISO(d), "MMM d")}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" />
                </BarChart>
              </ChartContainer>
            ) : (
              <Skeleton className="h-56 w-full" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent signups</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {s
              ? s.recent.map((u) => (
                  <Link
                    key={u.id}
                    to="/admin/users/$userId"
                    params={{ userId: u.id }}
                    className="flex items-center gap-2 hover:underline"
                  >
                    <Avatar size="sm">
                      <AvatarFallback>{initials(u)}</AvatarFallback>
                    </Avatar>
                    <span className="truncate">{userLabel(u)}</span>
                  </Link>
                ))
              : Array.from({ length: 5 }, (_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function SystemStatus() {
  const { data } = useQuery(healthQueryOptions)
  const state = !data
    ? { text: "Checking…", dot: "bg-muted-foreground" }
    : !data.live
      ? { text: "Down", dot: "bg-destructive" }
      : data.ready
        ? { text: "Ready", dot: "bg-emerald-500" }
        : { text: "Database unavailable", dot: "bg-amber-500" }
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>System status</CardDescription>
        <CardTitle className="flex items-center gap-2 text-base">
          <span className={cn("size-2 rounded-full", state.dot)} aria-hidden />
          {state.text}
        </CardTitle>
      </CardHeader>
    </Card>
  )
}
