import { IsString, IsOptional, IsUUID } from 'class-validator';

export class UpdateAlertaDto {
  @IsUUID()
  id: string;

  @IsString()
  estado: string;

  @IsUUID()
  operadorId: string;

  @IsString()
  @IsOptional()
  notas?: string;

  @IsString()
  @IsOptional()
  comentarioCierre?: string;

  @IsString()
  @IsOptional()
  evidenciaUrls?: string;
}
