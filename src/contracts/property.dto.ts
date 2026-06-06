import { z } from 'zod';
import {
  LISTING_KINDS,
  PROPERTY_TYPES,
  type ListingKind,
  type PropertyStatus,
  type PropertyType,
} from './enums';
import type { ContactCapabilities } from './contact.dto';

/** GeoJSON point: [longitude, latitude]. */
export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number];
}

export interface PropertyMedia {
  id: string;
  url: string;
  kind: 'image' | 'video' | 'floorplan';
  width?: number;
  height?: number;
}

/** Lightweight shape used in listing grids/cards. */
export interface PropertySummary {
  id: string;
  slug: string;
  title: string;
  type: PropertyType;
  listingKind: ListingKind;
  status: PropertyStatus;
  price: number;
  currency: string;
  bedrooms?: number;
  bathrooms?: number;
  areaSqft?: number;
  locality: string;
  city: string;
  /** ISO 3166-1 alpha-2 country code — drives currency, dialing code, etc. */
  country: string;
  thumbnail: string;
  isFeatured: boolean;
  location: GeoPoint;
  /** Channel capabilities so cards can render the contact cluster directly. */
  contactCapabilities: ContactCapabilities;
  /** Owner id — included so listing cards can hide self-contact UI. */
  ownerId: string;
}

/** Full property detail. */
export interface Property extends PropertySummary {
  description: string;
  amenities: string[];
  media: PropertyMedia[];
  yearBuilt?: number;
  agentId?: string;
  createdAt: string;
  updatedAt: string;
}

/** Listing filter + sort + pagination query. All optional. */
export const propertyFiltersSchema = z.object({
  q: z.string().optional(),
  type: z.enum(PROPERTY_TYPES).optional(),
  listingKind: z.enum(LISTING_KINDS).optional(),
  city: z.string().optional(),
  /**
   * ISO 3166-1 alpha-2 country code. When present the backend doesn't
   * hard-filter on it — it sorts the country's listings to the top, then
   * surfaces the rest. Sent uppercase.
   */
  country: z
    .string()
    .length(2)
    .transform((v) => v.toUpperCase())
    .optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  bedrooms: z.coerce.number().int().min(0).optional(),
  isFeatured: z.coerce.boolean().optional(),
  sort: z.enum(['-createdAt', 'createdAt', 'price', '-price']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(60).default(24),
});
export type PropertyFilters = z.infer<typeof propertyFiltersSchema>;

/** Create/update payload. */
export const createPropertySchema = z.object({
  title: z.string().min(6).max(140),
  description: z.string().min(30).max(4000),
  type: z.enum(PROPERTY_TYPES),
  listingKind: z.enum(LISTING_KINDS),
  price: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().int().min(0).optional(),
  areaSqft: z.number().positive().optional(),
  locality: z.string().min(2),
  city: z.string().min(2),
  /** ISO 3166-1 alpha-2 country code. Uppercased on send. */
  country: z
    .string()
    .length(2)
    .transform((v) => v.toUpperCase())
    .default('US'),
  amenities: z.array(z.string()).default([]),
  location: z.object({
    type: z.literal('Point'),
    coordinates: z.tuple([z.number(), z.number()]),
  }),
  media: z
    .array(
      z.object({
        url: z.string().min(1).max(500),
        kind: z.enum(['image', 'video', 'floorplan']).default('image'),
      }),
    )
    .max(20)
    .optional(),
});
export type CreatePropertyDto = z.infer<typeof createPropertySchema>;

/** Map viewport query — bbox is [west, south, east, north]. */
export interface PropertyMapQuery {
  bbox: [number, number, number, number];
  type?: PropertyType;
}
