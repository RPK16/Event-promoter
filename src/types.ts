export interface EventDetails {
  id: string;
  companyName: string;
  eventName: string;
  eventDescription: string;
  location: string;
  startDate: string;
  endDate: string;
  ticketPrices: string;
  sponsors: Sponsor[];
  visualAssets: string[];
  primaryTargetAudience: string;
  secondaryAudiences: string[];
  channels: string[]; // ['Instagram', 'Facebook', 'Email']
  tone: string;
  postCount: number;
  budget: string;
}

export interface Sponsor {
  name: string;
  logoUrl?: string;
}

export interface PromoPost {
  id: string;
  interval: string;
  channel: string;
  content: string;
  visualSuggestion?: string;
  scheduledDate: string;
  scheduledTime: string;
}

export interface GenerationMetrics {
  totalMs?: number;
  loadMs?: number;
  promptEvalMs?: number;
  responseEvalMs?: number;
  promptEvalCount?: number;
  responseEvalCount?: number;
}

export interface CampaignResult {
  marketingPlan: string;
  posts: PromoPost[];
  modelId?: string;
  generationTimeMs?: number;
  generationMetrics?: GenerationMetrics;
}

export interface PromotionSchedule {
  eventId: string;
  posts: PromoPost[];
}

export interface OllamaModelInfo {
  name?: string;
  size?: string;
  modifiedAt?: string;
  digest?: string;
  family?: string;
  parameterSize?: string;
  quantizationLevel?: string;
}

export interface OllamaModelStatus {
  name: string;
  available: boolean;
  info: OllamaModelInfo | null;
}

export interface OllamaConfigStatus {
  ollamaAvailable: boolean;
  modelAvailable: boolean;
  baseUrl: string;
  modelId: string;
  modelInfo: OllamaModelInfo | null;
  models: OllamaModelStatus[];
}

export interface GeneratePostsRequestData {
  event: EventDetails;
  model?: string;
}

export interface GeneratePostsErrorData {
  error: string;
}
