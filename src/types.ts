export type ItemType = 'image' | 'text';

export interface TierItem {
  id: string;
  type: ItemType;
  name: string;
  imageDataUrl?: string;
  imagePanX?: number;
  imagePanY?: number;
  imageZoom?: number;
}

export interface TierRow {
  id: string;
  label: string;
  color: string;
  items: TierItem[];
}

export interface AppState {
  tiers: TierRow[];
  unranked: TierItem[];
}
