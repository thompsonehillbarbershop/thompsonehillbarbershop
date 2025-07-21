"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { DeleteIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { ClassNameValue } from "tailwind-merge"

type KeyboardType = "qwerty" | "numpad"

interface VirtualKeyboardProps {
  layout?: KeyboardType
  enableToggle?: boolean
  onKeyPress: (key: string) => void
  className?: ClassNameValue
}

export function VirtualKeyboard({
  layout = "qwerty",
  enableToggle = false,
  onKeyPress,
  className
}: VirtualKeyboardProps) {
  const [keyboardType, setKeyboardType] = useState<KeyboardType>(layout)

  useEffect(() => {
    setKeyboardType(layout)
  }, [layout])

  const layouts = {
    qwerty: [
      ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
      ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
      ["Z", "X", "C", "V", "B", "N", "M"],
      [" ", "BACKSPACE"],
    ],
    numpad: [
      ["1", "2", "3"],
      ["4", "5", "6"],
      ["7", "8", "9"],
      ["0", "BACKSPACE"],
    ],
  }

  const currentLayout = layouts[keyboardType]

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {enableToggle && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            className="text-xl md:text-3xl px-4 py-2 min-w-[58px] md:min-w-[72px] min-h-[48px] md:min-h-[64px]"
            onClick={() =>
              setKeyboardType((prev) => (prev === "qwerty" ? "numpad" : "qwerty"))
            }
          >
            {keyboardType === "qwerty" ? "123" : "ABC"}
          </Button>
        </div>
      )}

      {currentLayout.map((row, rowIndex) => (
        <div key={rowIndex} className="flex justify-center gap-2">
          {row.map((key) => (
            <Button
              key={key}
              type="button"
              variant={key === "BACKSPACE" ? "destructive" : "secondary"}
              className={cn(
                "px-4 py-2",
                keyboardType === "numpad"
                  ? "min-w-[72px] md:min-w-[96px] min-h-[64px] md:min-h-[80px] text-2xl md:text-4xl"
                  : "min-w-[58px] md:min-w-[72px] min-h-[48px] md:min-h-[64px] text-xl md:text-3xl"
              )}
              onClick={() => onKeyPress(key)}
            >
              {key === "BACKSPACE" ? <DeleteIcon className="lg:size-10" /> : key === " " ? "Espaço" : key}
            </Button>
          ))}
        </div>
      ))}
    </div>
  )
}
