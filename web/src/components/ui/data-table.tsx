"use client"

import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
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
import { ChevronFirst, ChevronLast, ChevronLeftIcon, ChevronRightIcon, Loader2Icon } from "lucide-react"
import { ClassNameValue } from "tailwind-merge"
import { useState } from "react"
import { Input } from "./input"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { useSidebar } from "./sidebar"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  isLoading?: boolean
  enablePagination?: boolean
  filtering?: {
    enableFiltering: boolean
    field: string
    placeholder?: string
    className?: ClassNameValue
  }
  emptyMessage?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading,
  enablePagination,
  filtering,
  emptyMessage = "Nenhum dado encontrado"
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),

    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),

    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),

    state: {
      sorting,
      columnFilters
    }
  })

  const { state: sideBarState } = useSidebar()

  return (
    <div className={cn("rounded-md border relative w-full transition-all", sideBarState === "expanded" ? "max-w-[calc(100vw-18rem)]" : "md:max-w-[calc(100vw-5rem)]")}>
      {filtering?.enableFiltering && (
        <div className={cn("flex items-center justify-center sm:justify-end space-x-2 px-1 py-1 mb-4 sm:w-72 lg:w-96 sm:ml-auto sm:px-4 sm:pt-2 sm:pb-0", filtering.className)}>
          <Input
            placeholder={filtering.placeholder}
            value={(table.getColumn(filtering.field)?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn(filtering.field)?.setFilterValue(event.target.value)
            }
          />
        </div>
      )}
      <Table className="">
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
      {enablePagination && (
        <div className="flex items-center justify-center sm:justify-end space-x-2 p-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.firstPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronFirst />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRightIcon />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.lastPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronLast />
          </Button>
        </div>
      )}
    </div>
  )
}
