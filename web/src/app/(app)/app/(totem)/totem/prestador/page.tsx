"use client"

import React from 'react'
import AttendantsPageContents from "./_components/contents"

export default function AttendantsPage() {
  return (
    <div className="flex-1 h-full flex flex-col gap-4 sm:gap-8 items-center justify-start w-full">
      <AttendantsPageContents />
    </div>
  )
}
