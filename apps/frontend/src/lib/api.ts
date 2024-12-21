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

async function search(
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

async function searchWeb(
  queries: string[] | string,
  options?: SearchWebOptions
): Promise<SearchResult> {
  const queriesArray = Array.isArray(queries) ? queries : [queries];
  const result = await queriesArray.reduce<Promise<SearchResult>>(
    async (acc, query) => {
      const res = await acc;
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const results = await search(query, options);
      return [...res.flat(), ...results.flat()];
    },
    Promise.resolve([])
  );
  return result;
}

type Medicine = {
  query: string;
  medicineName: string;
  genericName: string;
  url: string;
};

async function searchMedicine(query: string): Promise<Medicine[]> {
  const url = new URL(`${import.meta.env.VITE_API_URL}/medicines`);
  const session = await fetchAuthSession();
  if (!session.tokens?.idToken) {
    throw new Error("No session");
  }
  url.searchParams.set("query", query);
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${session.tokens.idToken.toString()}`,
    },
  });
  if (response.status !== 200) {
    return [];
  }
  const json = (await response.json()) as {
    medicine_name: string;
    generic_name: string;
    url: string;
  }[];
  return json.map((medicine) => ({
    query,
    medicineName: medicine.medicine_name,
    genericName: medicine.generic_name,
    url: medicine.url,
  }));
}

export { searchWeb, searchMedicine };
export type { SearchResult, Medicine };
