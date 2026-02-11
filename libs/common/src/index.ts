export const QUEUE_NAMES = {
  EXAMPLE: "example_queue",
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

export { BaseController, type CurrentUserInfo } from "./base.controller";
export { IResponseShape, ErrorCode } from "./response.interface";
export {
  IOperationLogger,
  OPERATION_LOGGER,
} from "./operation-logger.interface";
