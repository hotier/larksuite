'use client';

/** 文件列表（云文档 / 在线表格）加载骨架屏：模拟表格头部 + 若干行占位 */
export function FileListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="rounded-xl bg-white border border-neutral-200 overflow-x-auto">
      {/* Header */}
      <div className="flex items-center h-10 px-5 gap-4 text-xs font-medium text-neutral-400 bg-neutral-50 border-b border-neutral-100 min-w-[640px]">
        <span className="flex-1 min-w-0">名称</span>
        <span className="w-[140px]">创建人</span>
        <span className="w-[280px] hidden xl:block">链接</span>
        <span className="w-[110px] text-right">创建时间</span>
        <span className="w-[72px]" />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center px-5 py-3 gap-4 border-b border-neutral-50 last:border-b-0 min-w-[640px]"
        >
          <div className="flex-1 min-w-0 flex items-center gap-2.5">
            <div className="w-4 h-4 rounded bg-neutral-200 animate-pulse" />
            <div className="h-4 w-40 rounded bg-neutral-200 animate-pulse" />
          </div>
          <div className="w-[140px] h-3 rounded bg-neutral-200 animate-pulse" />
          <div className="w-[280px] hidden xl:block h-3 rounded bg-neutral-200 animate-pulse" />
          <div className="w-[110px] h-3 rounded bg-neutral-200 animate-pulse" />
          <div className="w-[72px] h-4 rounded bg-neutral-200 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

/** 多维表格：数据表列表加载骨架屏 */
export function TableListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="p-5 rounded-lg border border-neutral-200 bg-white"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-neutral-200 animate-pulse" />
            <div className="flex-1 space-y-2.5">
              <div className="h-3.5 w-2/3 rounded bg-neutral-200 animate-pulse" />
              <div className="h-3 w-1/3 rounded bg-neutral-200 animate-pulse" />
            </div>
          </div>
          <div className="mt-4 h-2.5 w-full rounded bg-neutral-200 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

/** 多维表格：记录列表加载骨架屏（表头 + 若干行） */
export function RecordListSkeleton({ cols = 4, rows = 8 }: { cols?: number; rows?: number }) {
  return (
    <div className="rounded-xl bg-white border border-neutral-200 overflow-hidden">
      <div className="flex items-center h-10 px-5 gap-4 bg-neutral-50 border-b border-neutral-100">
        {Array.from({ length: cols }).map((_, c) => (
          <div key={c} className="h-3 flex-1 rounded bg-neutral-200 animate-pulse" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="flex items-center px-5 py-3 gap-4 border-b border-neutral-50 last:border-b-0"
        >
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="h-3.5 flex-1 rounded bg-neutral-200 animate-pulse" />
          ))}
        </div>
      ))}
    </div>
  );
}
