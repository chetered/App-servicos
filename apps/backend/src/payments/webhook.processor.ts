import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';

@Processor('payments')
export class WebhookProcessor {
  private readonly logger = new Logger(WebhookProcessor.name);

  @Process('retry-webhook')
  async retryWebhook(job: Job) {
    this.logger.log(`Retrying webhook for job ${job.id}`);
    // Implement retry logic
  }
}
