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
  logoUrl?: string;
  eventImageUrl?: string;
  visualAssets: string[];
  primaryTargetAudience: string;
  secondaryAudiences: string[];
  channels: string[]; // ['Instagram', 'Facebook', 'Email']
  tone: string;
  postCount: number;
  budget: string;
  goals: string;
}

export interface Sponsor {
  name: string;
  logoUrl?: string;
}

export interface PromoPost {
  id: string;
  interval: string; // "4 weeks before", etc.
  channel: string; // From channels list
  content: string;
  suggestedImageUrl?: string;
  scheduledDate: string;
  scheduledTime: string;
}

export interface CampaignResult {
  marketingPlan: string;
  posts: PromoPost[];
}

export interface PromotionSchedule {
  eventId: string;
  posts: PromoPost[];
}

export interface BedrockRequestData {
  event: EventDetails;
  demo?: boolean;
}

export interface BedrockResponseData {
  marketingPlan: string;
  posts: PromoPost[];
}
