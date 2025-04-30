import CustomerRegisterForm from "@/components/totem/customer-register-form"
import React from 'react'

export default function CustomerRegisterPage() {
  return (
    <div className="flex-1 h-full flex flex-col gap-4 sm:gap-8 items-center justify-start w-full">
      <CustomerRegisterForm />
    </div>
  )
}
