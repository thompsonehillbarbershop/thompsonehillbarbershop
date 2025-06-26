"use  client"

import React from 'react'
import ServicesPageContents from "./_components/contents"

export default function ServicesPage() {
  return (
    <div className="flex-1 h-full flex flex-col gap-4 sm:gap-8 items-center justify-start w-full">
      <ServicesPageContents />
    </div>
  )
}
