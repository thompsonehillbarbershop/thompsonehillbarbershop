"use client"

import { useSearchParams } from 'next/navigation'

export default function CustomerRegisterForm() {
  const searchParams = useSearchParams()

  const search = searchParams.get('tel')

  return (
    <div>Registro de cliente tel = {search}</div>
  )
}
