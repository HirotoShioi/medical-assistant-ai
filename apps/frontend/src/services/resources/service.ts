import { generateEmbedding } from "@/lib/ai/embeddings";
import { NewResourceParams } from "@/models";
import { insertResourceSchema } from "@/lib/database/schema";
import { schema } from "@/lib/database/schema";
import { getDB } from "@/lib/database/client";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { desc, eq, inArray } from "drizzle-orm";
import { getModel } from "@/lib/ai/model";
import { BASE_MODEL } from "@/constants";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { HumanMessage } from "@langchain/core/messages";
import { codeBlock } from "common-tags";

// https://www.anthropic.com/news/contextual-retrieval
async function situateContext(
  document: string,
  chunk: string
): Promise<string> {
  const model = await getModel({
    model: BASE_MODEL,
    temperature: 0,
  });
  // We're trying to hit the cache by providing same context on the prefix
  const message = new HumanMessage({
    content: [
      {
        type: "text",
        text: codeBlock`
          <document>
          ${document}
          </document>

          Here is the chunk we want to situate within the whole document
        `,
      },
      {
        type: "text",
        text: codeBlock`
          <chunk>
          ${chunk}
          </chunk>
        `,
      },
      {
        type: "text",
        text: "Please give a short succinct context to situate this chunk within the overall document for the purposes of improving search retrieval of the chunk. Answer only with the succinct context and nothing else.",
      },
    ],
  });
  const chain = model.pipe(new StringOutputParser());
  const context = await chain.invoke([message]);
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

async function generateSummary(input: string): Promise<string> {
  const model = await getModel({
    model: BASE_MODEL,
    temperature: 0,
  });
  const message = new HumanMessage({
    content: [
      {
        type: "text",
        text: codeBlock`
          <document>
          ${input}
          </document>
        `,
      },
      {
        type: "text",
        text: "Please generate a summary of the following document. The summary should be a concise and clear overview of the document's content. The summary should be in a single paragraph and should not exceed 100 words.",
      },
    ],
  });
  const chain = model.pipe(new StringOutputParser());
  const summary = await chain.invoke([message]);
  return summary;
}

export const embedResource = async (
  input: Omit<NewResourceParams, "summary">
) => {
  const db = await getDB();
  try {
    const { content, threadId, title, fileType } =
      insertResourceSchema.parse(input);
    const summary = await generateSummary(content);
    const [resource] = await db
      .insert(schema.resources)
      .values({
        content: content,
        summary: summary,
        threadId: threadId,
        title: title,
        fileType: fileType,
      })
      .returning();
    const processChunk = async (content: string, chunk: string) => {
      const situatedContext = await situateContext(content, chunk);
      const { embedding } = await generateEmbedding(situatedContext);
      await db.insert(schema.embeddings).values({
        resourceId: resource.id,
        content: situatedContext,
        embedding: embedding,
        threadId: threadId,
      });
    };
    const chunks = await generateChunks(content);
    // Remaining chunks are processed in parallel
    await Promise.all(chunks.map((chunk) => processChunk(content, chunk)));
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

export const getResourceByIds = async (ids: string[]) => {
  const db = await getDB();
  return db
    .select()
    .from(schema.resources)
    .where(inArray(schema.resources.id, ids));
};
