import { Module } from '@nestjs/common';

import { RabbitmqService } from './rabbitmq.service.js';

import { RabbitmqTopologyService } from './rabbitmq-topology.service.js';

import { RabbitmqOutboxService } from './rabbitmq-outbox.service.js';


@Module({
  providers: [
    RabbitmqService,
    RabbitmqTopologyService,
    RabbitmqOutboxService
  ],

  exports: [
    RabbitmqService,
  ],
})
export class RabbitmqModule {}