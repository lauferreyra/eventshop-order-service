import { Module } from '@nestjs/common';

import { RabbitmqService } from './rabbitmq.service.js';

import { RabbitmqTopologyService } from './rabbitmq-topology.service.js';

@Module({
  providers: [
    RabbitmqService,
    RabbitmqTopologyService,
  ],

  exports: [
    RabbitmqService,
  ],
})
export class RabbitmqModule {}