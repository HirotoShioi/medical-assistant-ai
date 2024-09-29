import { generateEmbedding } from "@/lib/ai/embeddings";
import { NewDocumentParams } from "@/models";
import { insertDocumentSchema } from "@/lib/database/schema";
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

export const embedDocument = async (input: NewDocumentParams) => {
  const db = await getDB();
  try {
    const { content, threadId, title, fileType } =
      insertDocumentSchema.parse(input);
    const chunks = await generateChunks(content);
    const [document] = await db
      .insert(schema.documents)
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
    return "Document successfully created.";
  } catch (e) {
    if (e instanceof Error)
      return e.message.length > 0 ? e.message : "Error, please try again.";
  }
};

export async function deleteDocumentById(id: string) {
  const db = await getDB();
  await db.delete(schema.documents).where(eq(schema.documents.id, id));
  await db
    .delete(schema.embeddings)
    .where(eq(schema.embeddings.documentId, id));
}

export const getDocumentsByThreadId = async (threadId: string) => {
  const db = await getDB();
  return db
    .select()
    .from(schema.documents)
    .where(eq(schema.documents.threadId, threadId))
    .orderBy(desc(schema.documents.createdAt));
};
