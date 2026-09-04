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

export interface PaymentCompletedEnvelope {
  eventId: string;
  eventType: 'payment.completed';
  version: number;
  occurredAt: string;
  correlationId: string;
  data: {
    orderId: string;
  };
}

export interface PaymentFailedEnvelope {
  eventId: string;
  eventType: 'payment.failed';
  version: number;
  occurredAt: string;
  correlationId: string;
  data: {
    orderId: string;
    reason: string;
  };
}