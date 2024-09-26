import { getDB } from "@/lib/database/client";
import { schema } from "@/lib/database/schema";
import { NewTemplateParams, Template, toTemplate } from "@/models/template";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

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

export type UpdateTemplateParams = {
  templateId: string;
  title: string;
  overview: string;
  description: string;
  systemMessage: string;
  initialAssistantMessage: string;
  // パラメーターは今後追加してゆく
};

export const updateTemplate = async (params: UpdateTemplateParams) => {
  const db = await getDB();
  const [template] = await db
    .update(schema.templates)
    .set({
      title: params.title,
      overview: params.overview,
      description: params.description,
      systemMessage: params.systemMessage,
      initialAssistantMessage: params.initialAssistantMessage,
    })
    .where(eq(schema.templates.id, params.templateId))
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
