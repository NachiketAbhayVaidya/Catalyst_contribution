import { useMemo, useState } from "react"
import { toast } from "sonner"
import { FileBarChart, Download, RotateCcw, ArrowUp, ArrowDown, Search } from "lucide-react"

import { useFetch } from "@/hooks/use-fetch"
import { getReportOptions, generateReport, exportReportCsv } from "@/api/reports"
import { formatDate, formatDateTime, typeLabel } from "@/lib/format"

import { PageHeader } from "@/components/shared/PageHeader"
import { EmptyState } from "@/components/shared/EmptyState"
import { ErrorState } from "@/components/shared/ErrorState"
import { StatCard } from "@/components/shared/StatCard"
import { StatusDot } from "@/components/shared/StatusDot"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const ANY = "__ANY__" // Select can't hold an empty-string value, so "no filter" needs a sentinel.

const EMPTY_FILTERS = {
  from: "",
  to: "",
  courseId: "",
  teamId: "",
  activityType: "",
  source: "",
  status: "",
  mandatory: "",
  minScore: "",
  maxScore: "",
  minXp: "",
  maxXp: "",
  search: "",
}

// Strips blanks so the URL only carries filters the admin actually set.
function toQuery(reportType, filters, { page, limit, sortBy, sortDir }) {
  const query = { type: reportType, page, limit, sortDir }
  if (sortBy) query.sortBy = sortBy
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) query[key] = value
  })
  return query
}

function formatCell(value, format) {
  if (value === null || value === undefined || value === "") return "—"
  switch (format) {
    case "date":
      return formatDate(value)
    case "datetime":
      return formatDateTime(value)
    case "number":
      return Number(value).toLocaleString()
    case "percent":
      return `${value}%`
    case "score":
      return `${value}/100`
    case "signed":
      return `${Number(value) > 0 ? "+" : ""}${Number(value).toLocaleString()}`
    case "type":
      return typeLabel(value)
    default:
      return String(value)
  }
}

function SummaryValue({ value, format }) {
  if (value === null || value === undefined) return "—"
  if (format === "percent") return `${value}%`
  if (format === "score") return `${value}/100`
  return Number(value).toLocaleString()
}

// One <fieldset>-ish block per filter, rendered only when the selected report
// declares it — the backend's catalog drives this, so a filter is never shown
// for a report that would ignore it.
function FilterField({ label, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

export default function AdminReportsPage() {
  const { data: optionsRes, loading: optionsLoading, error: optionsError, refetch: refetchOptions } = useFetch(
    () => getReportOptions(),
    []
  )
  const options = optionsRes?.data

  const [reportType, setReportType] = useState("STUDENT_PERFORMANCE")
  const [draft, setDraft] = useState(EMPTY_FILTERS)
  // Filters only take effect on "Generate", so typing never fires a request.
  const [applied, setApplied] = useState(EMPTY_FILTERS)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(25)
  const [sort, setSort] = useState({ by: "", dir: "desc" })
  const [exporting, setExporting] = useState(false)

  const report = useMemo(
    () => options?.reports?.find((r) => r.type === reportType),
    [options, reportType]
  )
  const shows = (filter) => !!report?.filters?.includes(filter)

  const query = useMemo(
    () => toQuery(reportType, applied, { page, limit, sortBy: sort.by, sortDir: sort.dir }),
    [reportType, applied, page, limit, sort]
  )

  const { data, loading, error, refetch } = useFetch(
    () => generateReport(query),
    [JSON.stringify(query)]
  )

  const columns = data?.data?.columns ?? []
  const rows = data?.data?.rows ?? []
  const summary = data?.data?.summary ?? []
  const pagination = data?.pagination

  // Switching reports resets everything — the previous report's filters and
  // sort key mostly don't exist on the new one.
  function changeReport(next) {
    setReportType(next)
    setDraft(EMPTY_FILTERS)
    setApplied(EMPTY_FILTERS)
    setSort({ by: "", dir: "desc" })
    setPage(1)
  }

  function apply() {
    setPage(1)
    setApplied(draft)
  }

  function reset() {
    setDraft(EMPTY_FILTERS)
    setApplied(EMPTY_FILTERS)
    setSort({ by: "", dir: "desc" })
    setPage(1)
  }

  function toggleSort(key) {
    setPage(1)
    setSort((s) => (s.by === key ? { by: key, dir: s.dir === "asc" ? "desc" : "asc" } : { by: key, dir: "desc" }))
  }

  async function handleExport() {
    setExporting(true)
    try {
      // Export the applied filters, not the draft — what you see is what you
      // get — but without the paging, which the export ignores anyway.
      const exportQuery = { ...query }
      delete exportQuery.page
      delete exportQuery.limit
      const { filename, truncatedAt } = await exportReportCsv(exportQuery)
      if (truncatedAt) {
        toast.warning(`Export capped at ${truncatedAt.toLocaleString()} rows. Narrow the filters for the full set.`)
      } else {
        toast.success(`Downloaded ${filename}`)
      }
    } catch (err) {
      toast.error(err.message || "Couldn't export the report.")
    } finally {
      setExporting(false)
    }
  }

  const set = (key) => (value) => setDraft((d) => ({ ...d, [key]: value }))
  const setFromEvent = (key) => (e) => setDraft((d) => ({ ...d, [key]: e.target.value }))
  const selectValue = (key) => (draft[key] === "" ? ANY : draft[key])
  const onSelect = (key) => (v) => set(key)(v === ANY ? "" : v)

  const activeFilterCount = Object.values(applied).filter((v) => v !== "").length

  if (optionsError) return <ErrorState message={optionsError.message} onRetry={refetchOptions} />

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Build a filtered report across students, submissions, activities and the XP ledger — then export it."
        action={
          <Button onClick={handleExport} disabled={exporting || loading || rows.length === 0}>
            <Download className="size-3.5" strokeWidth={1.75} />
            {exporting ? "Exporting…" : "Download CSV"}
          </Button>
        }
      />

      {/* ---- Report picker ---- */}
      <div className="mb-4 flex flex-wrap gap-2">
        {optionsLoading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-9 w-44" />)
          : options.reports.map((r) => (
              <Button
                key={r.type}
                size="sm"
                variant={r.type === reportType ? "default" : "outline"}
                onClick={() => changeReport(r.type)}
              >
                {r.label}
              </Button>
            ))}
      </div>

      {report && <p className="mb-4 text-[13px] text-muted-foreground">{report.description}</p>}

      {/* ---- Filter panel ---- */}
      <Card className="mb-6">
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {shows("dateRange") && (
              <>
                <FilterField label="From">
                  <Input type="date" value={draft.from} onChange={setFromEvent("from")} max={draft.to || undefined} />
                </FilterField>
                <FilterField label="To">
                  <Input type="date" value={draft.to} onChange={setFromEvent("to")} min={draft.from || undefined} />
                </FilterField>
              </>
            )}

            {shows("course") && (
              <FilterField label="Course">
                <Select value={selectValue("courseId")} onValueChange={onSelect("courseId")}>
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {(v) => (v === ANY ? "All courses" : options.courses.find((c) => c.id === v)?.title || "All courses")}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY}>All courses</SelectItem>
                    {options.courses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FilterField>
            )}

            {shows("team") && (
              <FilterField label="Team">
                <Select value={selectValue("teamId")} onValueChange={onSelect("teamId")}>
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {(v) => (v === ANY ? "All teams" : options.teams.find((t) => t.id === v)?.name || "All teams")}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY}>All teams</SelectItem>
                    {options.teams.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FilterField>
            )}

            {shows("activityType") && (
              <FilterField label="Activity type">
                <Select value={selectValue("activityType")} onValueChange={onSelect("activityType")}>
                  <SelectTrigger className="w-full">
                    <SelectValue>{(v) => (v === ANY ? "All types" : typeLabel(v))}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY}>All types</SelectItem>
                    {options.activityTypes.map((t) => (
                      <SelectItem key={t} value={t}>
                        {typeLabel(t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FilterField>
            )}

            {shows("source") && (
              <FilterField label="XP source">
                <Select value={selectValue("source")} onValueChange={onSelect("source")}>
                  <SelectTrigger className="w-full">
                    <SelectValue>{(v) => (v === ANY ? "All sources" : typeLabel(v))}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY}>All sources</SelectItem>
                    {options.xpSources.map((s) => (
                      <SelectItem key={s} value={s}>
                        {typeLabel(s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FilterField>
            )}

            {shows("status") && report.statusOptions.length > 0 && (
              <FilterField label="Status">
                <Select value={selectValue("status")} onValueChange={onSelect("status")}>
                  <SelectTrigger className="w-full">
                    <SelectValue>{(v) => (v === ANY ? "Any status" : typeLabel(v))}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY}>Any status</SelectItem>
                    {report.statusOptions.map((s) => (
                      <SelectItem key={s} value={s}>
                        {typeLabel(s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FilterField>
            )}

            {shows("mandatory") && (
              <FilterField label="Mandatory">
                <Select value={selectValue("mandatory")} onValueChange={onSelect("mandatory")}>
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {(v) => (v === ANY ? "Any" : v === "true" ? "Mandatory only" : "Optional only")}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY}>Any</SelectItem>
                    <SelectItem value="true">Mandatory only</SelectItem>
                    <SelectItem value="false">Optional only</SelectItem>
                  </SelectContent>
                </Select>
              </FilterField>
            )}

            {shows("scoreRange") && (
              <>
                <FilterField label="Min score">
                  <Input type="number" min={0} max={100} placeholder="0" value={draft.minScore} onChange={setFromEvent("minScore")} />
                </FilterField>
                <FilterField label="Max score">
                  <Input type="number" min={0} max={100} placeholder="100" value={draft.maxScore} onChange={setFromEvent("maxScore")} />
                </FilterField>
              </>
            )}

            {shows("xpRange") && (
              <>
                <FilterField label="Min XP">
                  <Input type="number" min={0} placeholder="0" value={draft.minXp} onChange={setFromEvent("minXp")} />
                </FilterField>
                <FilterField label="Max XP">
                  <Input type="number" min={0} placeholder="Any" value={draft.maxXp} onChange={setFromEvent("maxXp")} />
                </FilterField>
              </>
            )}

            {shows("search") && (
              <FilterField label="Search">
                <div className="relative">
                  <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" strokeWidth={1.75} />
                  <Input
                    className="pl-8"
                    placeholder="Name, email or title…"
                    value={draft.search}
                    onChange={setFromEvent("search")}
                    onKeyDown={(e) => e.key === "Enter" && apply()}
                  />
                </div>
              </FilterField>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
            <Button size="sm" onClick={apply} disabled={loading}>
              Generate report
            </Button>
            <Button size="sm" variant="outline" onClick={reset} disabled={activeFilterCount === 0 && !sort.by}>
              <RotateCcw className="size-3.5" strokeWidth={1.75} />
              Reset
            </Button>
            {activeFilterCount > 0 && (
              <Badge variant="secondary">
                {activeFilterCount} filter{activeFilterCount === 1 ? "" : "s"} applied
              </Badge>
            )}
            {data?.data?.generatedAt && (
              <span className="ml-auto text-xs text-muted-foreground">
                Generated {formatDateTime(data.data.generatedAt)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ---- Summary tiles ---- */}
      {(loading || summary.length > 0) && (
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => <StatCard key={i} loading />)
            : summary.map((s, i) => (
                <StatCard
                  key={s.label}
                  label={s.label}
                  value={<SummaryValue value={s.value} format={s.format} />}
                  primary={i === 0}
                />
              ))}
        </div>
      )}

      {/* ---- Results ---- */}
      {error ? (
        <ErrorState message={error.message} onRetry={refetch} />
      ) : (
        <Card className="p-0">
          <CardContent className="px-0 py-0">
            {loading ? (
              <div className="space-y-3 px-6 py-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : rows.length === 0 ? (
              <EmptyState
                icon={FileBarChart}
                title="No matching records"
                description="No rows match these filters. Try widening the date range or clearing a filter."
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.map((col) => (
                        <TableHead key={col.key} className={col.format === "text" ? "" : "text-right"}>
                          {col.sortable ? (
                            <button
                              type="button"
                              onClick={() => toggleSort(col.key)}
                              className="inline-flex items-center gap-1 hover:text-foreground"
                            >
                              {col.label}
                              {sort.by === col.key &&
                                (sort.dir === "asc" ? (
                                  <ArrowUp className="size-3" strokeWidth={2} />
                                ) : (
                                  <ArrowDown className="size-3" strokeWidth={2} />
                                ))}
                            </button>
                          ) : (
                            col.label
                          )}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, i) => (
                      <TableRow key={row.id ?? i}>
                        {columns.map((col) => (
                          <TableCell
                            key={col.key}
                            className={
                              col.format === "text"
                                ? "max-w-[220px] truncate"
                                : "text-right tabular-nums whitespace-nowrap"
                            }
                          >
                            {col.format === "badge" && row[col.key] ? (
                              <StatusDot status={row[col.key]} label={typeLabel(row[col.key])} />
                            ) : (
                              formatCell(row[col.key], col.format)
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ---- Pagination ---- */}
      {pagination && pagination.total > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1}–
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total.toLocaleString()}
          </p>
          <div className="flex items-center gap-2">
            <Select
              value={String(limit)}
              onValueChange={(v) => {
                setLimit(Number(v))
                setPage(1)
              }}
            >
              <SelectTrigger className="w-28">
                <SelectValue>{(v) => `${v} / page`}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {["25", "50", "100", "200"].map((n) => (
                  <SelectItem key={n} value={n}>
                    {n} / page
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" disabled={pagination.page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <span className="text-xs text-muted-foreground tabular-nums">
              {pagination.page} / {pagination.totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
