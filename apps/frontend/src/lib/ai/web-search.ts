import { fetchAuthSession } from "aws-amplify/auth";
import { z } from "zod";

const schema = z.array(
  z.object({
    link: z.string(),
    snippet: z.string(),
    title: z.string(),
  })
);

type SearchResult = z.infer<typeof schema>;
type SearchWebOptions = {
  limit?: number;
};
async function searchWeb(
  query: string,
  options?: SearchWebOptions
): Promise<SearchResult> {
  console.log(query);
  const session = await fetchAuthSession();
  if (!session.tokens?.idToken) {
    throw new Error("No session");
  }
  const url = new URL(`${import.meta.env.VITE_API_URL}/search`);
  url.searchParams.set("query", query);
  url.searchParams.set("limit", (options?.limit ?? 3).toString());
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${session.tokens.idToken.toString()}`,
    },
  });
  if (response.status !== 200) {
    return [];
  }
  const json = await response.json();
  const result = schema.safeParse(json);
  if (result.success) {
    return result.data;
  }
  return [];
}

export { searchWeb };
export type { SearchResult };
