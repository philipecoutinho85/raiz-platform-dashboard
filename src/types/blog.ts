export interface BlogPost {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featured_image_url: string | null;
  featured_image_alt: string | null;
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  published_at: string | null;
  scheduled_at: string | null;
  
  // SEO Fields
  meta_title: string | null;
  meta_description: string | null;
  focus_keyword: string | null;
  canonical_url: string | null;
  
  // Open Graph / Social
  og_title: string | null;
  og_description: string | null;
  og_image_url: string | null;
  twitter_title: string | null;
  twitter_description: string | null;
  twitter_image_url: string | null;
  
  // Categories and Tags
  category: string | null;
  tags: string[];
  
  // Reading stats
  word_count: number;
  reading_time_minutes: number;
  
  // SEO Score (0-100)
  seo_score: number;
  readability_score: number;
  
  created_at: string;
  updated_at: string;
}

export interface BlogPostVersion {
  id: string;
  post_id: string;
  version_number: number;
  title: string;
  content: string;
  meta_title: string | null;
  meta_description: string | null;
  focus_keyword: string | null;
  created_at: string;
  created_by: string;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  meta_title: string | null;
  meta_description: string | null;
  parent_id: string | null;
  order_index: number;
  created_at: string;
}

export interface BlogSnippet {
  id: string;
  name: string;
  slug: string;
  content: string;
  description: string | null;
  category: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface SEOChecklistItem {
  id: string;
  label: string;
  description: string;
  passed: boolean;
  weight: number;
}

export interface SEOAnalysis {
  score: number;
  readabilityScore: number;
  items: SEOChecklistItem[];
  suggestions: string[];
}
