import { IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { TransactionType, TransactionStatus } from '../../transactions/enums/transaction.enum';

export class TransactionFilterDto extends PaginationDto {
    @ApiPropertyOptional({ enum: TransactionType })
    @IsOptional()
    @IsEnum(TransactionType)
    type?: TransactionType;

    @ApiPropertyOptional({ enum: TransactionStatus })
    @IsOptional()
    @IsEnum(TransactionStatus)
    status?: TransactionStatus;

    @ApiPropertyOptional({ type: Date, description: 'Start date for filtering' })
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @ApiPropertyOptional({ type: Date, description: 'End date for filtering' })
    @IsOptional()
    @IsDateString()
    endDate?: string;
}
