// src/constants.ts
export const ORDER_STATUSES = {
  TO_SHIP: "to_ship",
  TO_RECEIVE: "to_receive",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export type OrderStatus = (typeof ORDER_STATUSES)[keyof typeof ORDER_STATUSES];
