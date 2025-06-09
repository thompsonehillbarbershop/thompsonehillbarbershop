import axiosClient from "@/lib/axios"
import { NextResponse } from 'next/server'

export async function GET() {

  const response = await axiosClient.get(`/export-csv`, {
    responseType: 'arraybuffer',
  })

  const blob = new Blob([response.data], { type: 'application/zip' })

  return new NextResponse(blob, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="thompson_export.zip"',
    },
  })
}
