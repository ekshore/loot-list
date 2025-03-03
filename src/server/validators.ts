import { z } from "zod";

const listDetailsSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().max(255),
});

const newItemSchema = z.object({
  name: z.string().min(5).max(50),
  description: z.string().max(255),
});

export { listDetailsSchema, newItemSchema };
