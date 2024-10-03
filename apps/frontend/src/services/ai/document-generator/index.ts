import { generatePatientReferralDocument } from "./generate-patient-referral-document";

export type DocumentGenerator = (threadId: string) => Promise<string>;

export const documentGenerators: Record<string, DocumentGenerator> = {
  "patient-referral-document": generatePatientReferralDocument,
};
