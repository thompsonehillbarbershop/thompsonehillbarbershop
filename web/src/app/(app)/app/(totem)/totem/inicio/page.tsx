import PhoneForm from "@/components/totem/phone-form"
import React from 'react'

export default function TotemHomePage() {
  return (
    <div className="flex-1 h-full flex flex-col gap-4 sm:gap-8 items-center justify-start w-full">
      <h1 className="text-3xl sm:text-4xl text-center font-semibold leading-relaxed font-spectral tracking-wide">Seja bem vindo à <br /> <strong className="text-primary text-4xl sm:text-5xl">THOMPSON & HILL</strong></h1>
      <p className="text-xl sm:text-2xl text-center text-foreground/90 font-spectral tracking-wide">Digite seu <strong className="text-primary/90">telefone</strong> <br />para iniciar o atendimento</p>
      <PhoneForm />
    </div>
  )
}
