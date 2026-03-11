import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationDto {
  @ApiPropertyOptional({ description: 'Cursor para paginação (ID do último item)' })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class PaginatedResponse<T> {
  data: T[];
  meta: {
    total?: number;
    nextCursor?: string;
    hasMore: boolean;
    limit: number;
  };

  constructor(data: T[], meta: PaginatedResponse<T>['meta']) {
    this.data = data;
    this.meta = meta;
  }
}
