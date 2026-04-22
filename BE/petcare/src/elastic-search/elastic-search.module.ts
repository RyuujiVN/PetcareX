import { Module } from '@nestjs/common';
import { ElasticsearchModule } from '@nestjs/elasticsearch';

@Module({
  imports: [
    ElasticsearchModule.registerAsync({
      useFactory: () => ({
        node: process.env.ELASTIC_SEARCH_NODE,
        maxRetries: 3,
        requestTimeout: 60000,
        auth: {
          apiKey: process.env.ELASTIC_SEARCH_API_KEY as string,
        },
        serverMode: 'serverless',
      }),
    }),
  ],
  exports: [ElasticsearchModule],
})
export class ElasticSearchModule {}
