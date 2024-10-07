import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { getModel } from "./model";
import { BASE_MODEL } from "@/constants";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { codeBlock } from "common-tags";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { SearchResult, searchWeb } from "./web-search";
import { PromptTemplate } from "@langchain/core/prompts";

const searchWebTool = tool(
  async ({ queries }) => {
    console.log(queries);
    const result = await queries.reduce<Promise<SearchResult>>(
      async (acc, query) => {
        const res = await acc;
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const results = await searchWeb(query, {
          limit: 5,
        });
        return [...res.flat(), ...results.flat()];
      },
      Promise.resolve([])
    );
    return {
      results: result,
    };
  },
  {
    name: "search_web",
    description: "Call to search the web.",
    schema: z.object({
      queries: z.array(z.string()).describe("Queries to search the web for."),
    }),
  }
);

const systemMessage = new SystemMessage(codeBlock`
Begin by enclosing all thoughts within <thinking> tags, exploring multiple angles and approaches.
Break down the solution into clear steps within <step> tags. Start with a 20-step budget, requesting more for complex problems if needed.
Use <count> tags after each step to show the remaining budget. Stop when reaching 0.
Continuously adjust your reasoning based on intermediate results and reflections, adapting your strategy as you progress.
Regularly evaluate progress using <reflection> tags. Be critical and honest about your reasoning process.
Assign a quality score between 0.0 and 1.0 using <reward> tags after each reflection. Use this to guide your approach:

0.8+: Continue current approach
0.5-0.7: Consider minor adjustments
Below 0.5: Seriously consider backtracking and trying a different approach

If unsure or if reward score is low, backtrack and try a different approach, explaining your decision within <thinking> tags.
For mathematical problems, show all work explicitly using LaTeX for formal notation and provide detailed proofs.
Explore multiple solutions individually if possible, comparing approaches in reflections.
Use thoughts as a scratchpad, writing out all calculations and reasoning explicitly.
Synthesize the final answer within <answer> tags, providing a clear, concise summary.
Conclude with a final reflection on the overall solution, discussing effectiveness, challenges, and solutions. Assign a final reward score.
At the end, provide a final answer as JSON with the following structure in one line:
{ "answer": string; "reflection": string; "reward": number;}`);

const schema = z.object({
  answer: z.string(),
  reflection: z.string(),
  reward: z.number(),
});

type AgentResult = z.infer<typeof schema>;
async function extractAgentResult(result: string): Promise<AgentResult> {
  const model = await getModel({
    model: BASE_MODEL,
    temperature: 0,
  });
  const template = PromptTemplate.fromTemplate(`
  Extract Agent Result from the following output.

  <result>
  {result}
  </result>
  `);
  const modelWithSchema = template.pipe(model.withStructuredOutput(schema));
  return modelWithSchema.invoke({ result });
}

async function invokeAgent(message: string): Promise<AgentResult> {
  const agentModel = await getModel({
    model: BASE_MODEL,
    maxConcurrency: 1,
    maxRetries: 0,
    temperature: 0,
  });
  const agent = createReactAgent({
    llm: agentModel,
    tools: [searchWebTool],
    messageModifier: (messages) => {
      return [systemMessage, ...messages];
    },
  });
  const agentNextState = await agent.invoke({
    messages: [new HumanMessage(message)],
  });
  const result =
    agentNextState.messages[agentNextState.messages.length - 1].content;
  return extractAgentResult(result);
}

export { invokeAgent };
