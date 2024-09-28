import { getDB } from "@/lib/database/client";
import { schema } from "@/lib/database/schema";
import { NewTemplateParams, Template, toTemplate } from "@/models/template";
import { eq, desc } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { nanoid } from "nanoid";
import { z } from "zod";

export const getTemplates = async (): Promise<Template[]> => {
  const db = await getDB();
  const templates = await db
    .select()
    .from(schema.templates)
    .orderBy(desc(schema.templates.title));
  return templates.map(toTemplate);
};

export const getTemplateById = async (id: string): Promise<Template | null> => {
  const db = await getDB();
  const templates = await db
    .select()
    .from(schema.templates)
    .where(eq(schema.templates.id, id));
  return templates.map(toTemplate)[0] ?? null;
};


export const createTemplate = async (
  template: NewTemplateParams
): Promise<Template[]> => {
  const db = await getDB();
  const newTemplate = await db
    .insert(schema.templates)
    .values({
      ...template,
      id: nanoid(),
    })
    .returning();
  return newTemplate.map(toTemplate);
};

export const deleteTemplate = async (id: string) => {
  const db = await getDB();
  await db.delete(schema.templates).where(eq(schema.templates.id, id));
};

const updateTemplateSchema = createInsertSchema(schema.templates).omit({
  createdAt: true,
  updatedAt: true,
  originalTemplate: true,
  icon: true,
  type: true,
});

export type UpdateTemplateParams = z.infer<typeof updateTemplateSchema>;
export const updateTemplate = async (params: UpdateTemplateParams) => {
  const { error } = updateTemplateSchema.safeParse(params);
  if (error) {
    throw new Error(error.message);
  }
  const db = await getDB();
  const [template] = await db
    .update(schema.templates)
    .set(params)
    .where(eq(schema.templates.id, params.id))
    .returning();
  return template;
};

export const resetTemplate = async (templateId: string) => {
  const db = await getDB();
  const [template] = await db
    .select()
    .from(schema.templates)
    .where(eq(schema.templates.id, templateId));

  if (!template || !template.originalTemplate) {
    throw new Error("Template not found");
  }
  const original = template.originalTemplate as NewTemplateParams;
  const [updated] = await db
    .update(schema.templates)
    .set(original)
    .where(eq(schema.templates.id, templateId))
    .returning();
  return toTemplate(updated);
};
