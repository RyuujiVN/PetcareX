import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { CLINIC_INDEX, ClinicIndexMapping } from './clinic.index';
import { Clinic } from './entities/clinic.entity';
import { FilterPagination } from 'src/common/types/pagination.type';

export type ClinicSortBy = 'distance' | 'rating';

export type FilterNearClinic = FilterPagination & {
  lat: number;
  lon: number;
  sortBy?: ClinicSortBy;
};

@Injectable()
export class ClinicSearchService implements OnModuleInit {
  private readonly logger = new Logger(ClinicSearchService.name);
  constructor(private readonly elasticSearchService: ElasticsearchService) {}

  async onModuleInit() {
    await this.ensureIndex();
  }

  async ensureIndex() {
    const existIndex = await this.elasticSearchService.indices.exists({
      index: CLINIC_INDEX,
    });

    if (!existIndex) {
      await this.elasticSearchService.indices.create(ClinicIndexMapping as any);

      this.logger.log(`Created index: ${CLINIC_INDEX}`);
    }
  }

  private buildSort(options: FilterNearClinic): any[] {
    const geoSort = {
      _geo_distance: {
        location: { lat: options.lat, lon: options.lon },
        order: 'asc',
        unit: 'km',
      },
    };

    if (options.sortBy === 'rating') {
      return [{ avgRating: { order: 'desc' } }, geoSort];
    }

    return [geoSort];
  }

  async searchClinics(options: FilterNearClinic) {
    const hasKeyword = options.search?.trim();
    const sort = this.buildSort(options);

    let clinicDocuments: any;

    if (hasKeyword) {
      clinicDocuments = await this.elasticSearchService.search({
        index: CLINIC_INDEX,
        from: options.page,
        size: options.limit,
        query: {
          bool: {
            must: {
              match: {
                name: {
                  query: hasKeyword,
                  fuzziness: 'AUTO',
                  minimum_should_match: '2<70%',
                },
              },
            },
            filter: [{ term: { deleted: false } }],
          },
        },
        sort,
      });
    } else {
      clinicDocuments = await this.elasticSearchService.search({
        index: CLINIC_INDEX,
        from: options.page,
        size: options.limit,
        query: {
          bool: {
            filter: [{ term: { deleted: false } }],
          },
        },
        sort,
      });
    }

    return clinicDocuments?.hits?.hits.map((hit: any) => ({
      ...hit._source,
    }));
  }

  // Tạo mới document
  async createClinic(clinic: Clinic) {
    await this.elasticSearchService.index({
      index: CLINIC_INDEX,
      id: clinic.id,
      document: {
        id: clinic.id,
        name: clinic.name,
        address: clinic.address,
        location: {
          lat: clinic.lat,
          lon: clinic.lon,
        },
        avatarUrl: clinic.avatarUrl,
        phone: clinic.phone,
        avgRating: clinic.avgRating,
        totalReviews: clinic.totalReviews,
        openingTime: clinic.openingTime,
        closingTime: clinic.closingTime,
        deleted: clinic.deleted,
      },
    });
  }

  // Chỉnh sửa document
  async updateClinic(clinic: Clinic) {
    await this.elasticSearchService.update({
      index: CLINIC_INDEX,
      id: clinic.id,
      doc: {
        id: clinic.id,
        name: clinic.name,
        address: clinic.address,
        location: {
          lat: clinic.lat,
          lon: clinic.lon,
        },
        avatarUrl: clinic.avatarUrl,
        phone: clinic.phone,
        avgRating: clinic.avgRating,
        totalReviews: clinic.totalReviews,
        openingTime: clinic.openingTime,
        closingTime: clinic.closingTime,
        deleted: clinic.deleted,
      },
    });
  }

  // Xoá document
  async deleteClinic(clinicId: string) {
    return await this.elasticSearchService.delete({
      index: CLINIC_INDEX,
      id: clinicId,
    });
  }
}
