import { ThreadSettings } from "@/models";

export interface DocumentGenerator {
  generatorId: string;
  generateDocument: (
    threadId: string,
    settings: ThreadSettings
  ) => Promise<string>;
}
