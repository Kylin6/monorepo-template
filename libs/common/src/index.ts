export const QUEUE_NAMES = {
  EXAMPLE: 'example_queue',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

