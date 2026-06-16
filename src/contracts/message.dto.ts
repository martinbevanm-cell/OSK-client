import { z } from 'zod';

export interface ThreadCounterpart {
  id: string;
  name: string;
  email: string;
  role: 'buyer' | 'seller' | 'agent' | 'admin';
  avatarUrl?: string;
  /** True when this person owns the listing the thread is about. */
  isOwner: boolean;
}

export interface ThreadProperty {
  id: string;
  slug: string;
  title: string;
  thumbnail: string;
}

export interface Thread {
  id: string;
  propertyId: string;
  ownerId: string;
  initiatorId: string;
  participants: string[];
  lastMessageAt: string;
  unread: number;
  createdAt: string;
  /** The OTHER participant from the viewer's POV. */
  counterpart?: ThreadCounterpart;
  property?: ThreadProperty;
}

export interface MessageAttachment {
  url: string;
  kind: 'image' | 'video';
  mimeType?: string;
  size?: number;
}

export interface Message {
  id: string;
  threadId: string;
  senderId: string;
  body: string;
  attachments?: MessageAttachment[];
  createdAt: string;
}

export const startThreadSchema = z.object({
  propertyId: z.string().min(1),
});
export type StartThreadDto = z.infer<typeof startThreadSchema>;

export const sendMessageSchema = z
  .object({
    body: z.string().max(4000).default(''),
    attachments: z
      .array(
        z.object({
          url: z.string().min(1).max(500),
          kind: z.enum(['image', 'video']),
          mimeType: z.string().max(80).optional(),
          size: z.number().int().min(0).optional(),
        }),
      )
      .max(6)
      .optional(),
  })
  .refine(
    (data) =>
      data.body.trim().length > 0 ||
      (data.attachments && data.attachments.length > 0),
    { message: 'Send some text or attach at least one file.', path: ['body'] },
  );
export type SendMessageDto = z.infer<typeof sendMessageSchema>;
