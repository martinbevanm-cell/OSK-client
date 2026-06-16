import { z } from 'zod';

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface Review {
  id: string;
  propertyId: string;
  authorId: string;
  rating: number;
  title?: string;
  body: string;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
}

export const createReviewSchema = z.object({
  propertyId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  body: z
    .string()
    .min(10, 'Tell us a little more — at least 10 characters.')
    .max(2000),
});
export type CreateReviewDto = z.infer<typeof createReviewSchema>;
