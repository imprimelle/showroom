import { supabase } from './supabase/client';

export interface ShowcaseProduct {
  id: string;
  name: string;
  slug: string;
  main_image_url: string | null;
  gallery_images: { url: string; alt: string }[];
  variants: { id: string; sku: string; name: string; price: number; attributes?: Record<string, string> }[];
  is_published: boolean;
  showcase: {
    short_description?: string;
    highlights?: string[];
    category?: string;
    delivery_time?: string;
    usage?: string;
    popularity?: number;
    seo?: { title?: string; description?: string };
  };
  description?: string;
}

export async function getPublishedProducts(): Promise<ShowcaseProduct[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_published', true)
    .order('showcase->popularity', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getProductBySlug(slug: string): Promise<ShowcaseProduct | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) return null;
  return data;
}
