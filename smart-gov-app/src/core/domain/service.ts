export type ServiceStep = {
  id: string;
  title: string;
  description?: string;
};

export type Service = {
  id: string;
  name: string;
  category: string;
  description: string;
  // Frontend-only placeholder for local images (mock app).
  imageKey?: 'promo_digital' | 'promo_citizen' | 'promo_services';
  requiredDocuments: string[];
  fees: number;
  estimatedProcessingTimeMinutes: number;
  steps: ServiceStep[];
  isEnabled: boolean;
};
