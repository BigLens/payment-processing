import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getRoot() {
    return {
      name: 'Payment Processing API',
      version: '1.0.0',
      endpoints: {
        health: '/health',
      },
    };
  }

  getHealth() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
