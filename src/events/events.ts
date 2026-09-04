export interface InventoryReservedEnvelope {
  eventId: string;
  eventType: 'inventory.reserved';
  version: number;
  occurredAt: string;
  correlationId: string;

  data: {
    orderId: string;
    quantity: number;
    unitPrice: number;
  };
}

export interface InventoryRejectedEnvelope {
  eventId: string;
  eventType: 'inventory.rejected';
  version: number;
  occurredAt: string;
  correlationId: string;

  data: {
    orderId: string;
    quantity: number;
    reason: string;
  };
}