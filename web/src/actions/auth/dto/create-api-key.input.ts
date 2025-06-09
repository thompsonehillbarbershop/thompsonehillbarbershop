import { z } from "@/lib/pt-zod"

export const createApiKeySchema = z.object({
  name: z.string().nonempty("Nome é obrigatório")
})

export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>