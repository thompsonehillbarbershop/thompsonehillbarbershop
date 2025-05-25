import { z } from "@/lib/pt-zod"
export const updateServiceSchema = z.object({
  name: z.string().nonempty("Nome é obrigatório"),
  description: z.string().optional(),
  value: z.union([
    z.string({ message: "Valor inválido" })
      .refine((val) => /^(\d+([.,]\d*)?|\d*[.,]\d+)$/.test(val), {
        message: "Formato inválido. Use apenas números com . ou , como separador decimal."
      })
      .transform((val) => parseFloat(val.replace(",", ".")))
      .refine((val) => !isNaN(val) && val > 0, {
        message: "O valor precisa ser positivo e maior que zero"
      }),
    z.number().positive(),
  ]).optional(),
  promoValue: z.union([
    z.string({ message: "Valor inválido" })
      .refine((val) => /^(\d+([.,]\d*)?|\d*[.,]\d+)$/.test(val), {
        message: "Formato inválido. Use apenas números com . ou , como separador decimal."
      })
      .transform((val) => parseFloat(val.replace(",", ".")))
      .refine((val) => !isNaN(val) && val > 0, {
        message: "O valor precisa ser positivo e maior que zero"
      }),
    z.number().positive(),
  ]).optional(),
  promoEnabled: z.boolean().default(false).optional(),
  coverImage: z.string().optional(),
  imageContentType: z.string().optional()
})

export type UpdateServiceInput = z.infer<typeof updateServiceSchema>