import { IsOptional, IsString, IsArray } from 'class-validator';

export class ReconocerAlertaDto {
  @IsString()
  @IsOptional()
  notas?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  evidenciaUrls?: string[];
}
