"use client"

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Loader2Icon } from "lucide-react"
import { useSidebar } from "./sidebar"
import { cn } from "@/lib/utils"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  isLoading?: boolean
  emptyMessage?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  emptyMessage = "Nenhum dado encontrado"
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const { state: sideBarState } = useSidebar()

  return (
    <div className={cn("rounded-md border relative w-full transition-all", sideBarState === "expanded" ? "max-w-[calc(100vw-18rem)]" : "md:max-w-[calc(100vw-5rem)]")}>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        {isLoading ? (
          <TableBody>
            <TableRow>
              <TableCell colSpan={columns.length} className="w-full h-24 text-center">
                <div className="flex w-full justify-center items-center gap-4">
                  Carregando <Loader2Icon className="animate-spin" />
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        ) : (
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        )}
      </Table>
    </div>
  )
}
