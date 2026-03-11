'use client';

import { clsx } from 'clsx';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

interface Props<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  keyExtractor: (row: T) => string;
}

export function DataTable<T>({
  columns, data, isLoading, emptyMessage = 'Nenhum registro', onRowClick, keyExtractor,
}: Props<T>) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="animate-pulse">
          {Array(5).fill(null).map((_, i) => (
            <div key={i} className="flex gap-4 p-4 border-b border-gray-50">
              {columns.map((_, j) => (
                <div key={j} className="h-4 bg-gray-100 rounded flex-1" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={clsx(
                    'px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap',
                    col.headerClassName
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-12 text-gray-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={keyExtractor(row)}
                  className={clsx(
                    'border-b border-gray-50 last:border-0 transition-colors',
                    onRowClick && 'cursor-pointer hover:bg-gray-50'
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <td
                      key={String(col.key)}
                      className={clsx('px-4 py-3 text-gray-700', col.className)}
                    >
                      {col.render
                        ? col.render(row)
                        : String((row as any)[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────────

interface PaginationProps {
  page: number;
  total: number;
  limit: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, total, limit, onChange }: PaginationProps) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between py-3 px-1">
      <p className="text-sm text-gray-500">
        {(page - 1) * limit + 1}–{Math.min(page * limit, total)} de {total} registros
      </p>
      <div className="flex gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
        >
          Anterior
        </button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
          return (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={clsx(
                'w-9 h-9 text-sm rounded-lg border transition-colors',
                p === page
                  ? 'bg-violet-600 text-white border-violet-600'
                  : 'border-gray-200 hover:bg-gray-50'
              )}
            >
              {p}
            </button>
          );
        })}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
        >
          Próxima
        </button>
      </div>
    </div>
  );
}
