import { z } from "@/lib/pt-zod"
import { EUserRole, EUserStatus } from "@/models/user"

export const updateUserSchema = z.object({
  name: z.string().nonempty("Nome é obrigatório").optional(),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres").optional(),
  role: z.nativeEnum(EUserRole).optional(),
  status: z.nativeEnum(EUserStatus).optional(),
  profileImage: z.string().optional(),
  profileImageContentType: z.string().optional()
})

export type UpdateUserInput = z.infer<typeof updateUserSchema>