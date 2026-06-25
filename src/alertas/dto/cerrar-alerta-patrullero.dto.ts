import { IsString, IsOptional, IsUUID, IsArray } from 'class-validator';

export class CerrarAlertaPatrulleroDto {
  @IsString()
  @IsOptional()
  estado?: string;

  @IsString()
  @IsOptional()
  comentarioCierre?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  evidenciaUrls?: string[];

  @IsString()
  @IsOptional()
  notas?: string;
}
