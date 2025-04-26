import { z } from "zod";

const listDetailsSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().max(255),
  public: z.boolean().default(false).optional(),
});

const itemSchema = z.object({
  name: z.string().min(2).max(50),
  description: z
    .string()
    .max(500)
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  url: z
    .union([z.string().url(), z.literal("")])
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
});

export { listDetailsSchema, itemSchema };
