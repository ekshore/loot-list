import { z } from "zod";

const listDetailsSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().max(255),
});

const itemSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().max(255),
});

export { listDetailsSchema, itemSchema };
