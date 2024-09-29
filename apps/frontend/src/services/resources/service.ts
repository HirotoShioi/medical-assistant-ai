import { generateEmbedding } from "@/lib/ai/embeddings";
import { NewResourceParams } from "@/models";
import { insertResourceSchema } from "@/lib/database/schema";
import { schema } from "@/lib/database/schema";
import { getDB } from "@/lib/database/client";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { desc, eq } from "drizzle-orm";
import { getModel } from "@/lib/ai/model";
import { BASE_MODEL } from "@/constants";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

// https://www.anthropic.com/news/contextual-retrieval
async function situateContext(
  document: string,
  chunk: string
): Promise<string> {
  const model = await getModel({
    model: BASE_MODEL,
    temperature: 0,
  });
  const prompt = PromptTemplate.fromTemplate(`
    <document>
    {document}
    </document>
    
    Here is the chunk we want to situate within the whole document

    <chunk>
    {chunk}
    </chunk>

    Please give a short succinct context to situate this chunk within the overall document for the purposes of improving search retrieval of the chunk.
    Answer only with the succinct context and nothing else.
  `);
  const chain = prompt.pipe(model).pipe(new StringOutputParser());
  const context = await chain.invoke({ document, chunk });
  return `${chunk}\n\n${context}`;
}

async function generateChunks(input: string): Promise<string[]> {
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  const chunks = await textSplitter.createDocuments([input]);
  return chunks.map((chunk) => chunk.pageContent);
}

export const embedResource = async (input: NewResourceParams) => {
  const db = await getDB();
  try {
    const { content, threadId, title, fileType } =
      insertResourceSchema.parse(input);
    const chunks = await generateChunks(content);
    const [document] = await db
      .insert(schema.resources)
      .values({
        content: content,
        threadId: threadId,
        title: title,
        fileType: fileType,
      })
      .returning();
    await Promise.all(
      chunks.map(async (chunk) => {
        const situatedContext = await situateContext(content, chunk);
        const { embedding } = await generateEmbedding(situatedContext);
        await db.insert(schema.embeddings).values({
          documentId: document.id,
          content: situatedContext,
          embedding: embedding,
          threadId: threadId,
        });
      })
    );
    return "Resource successfully created.";
  } catch (e) {
    if (e instanceof Error)
      return e.message.length > 0 ? e.message : "Error, please try again.";
  }
};

export async function deleteResourceById(id: string) {
  const db = await getDB();
  await db.delete(schema.resources).where(eq(schema.resources.id, id));
  await db
    .delete(schema.embeddings)
    .where(eq(schema.embeddings.resourceId, id));
}

export const getResourcesByThreadId = async (threadId: string) => {
  const db = await getDB();
  return db
    .select()
    .from(schema.resources)
    .where(eq(schema.resources.threadId, threadId))
    .orderBy(desc(schema.resources.createdAt));
};
