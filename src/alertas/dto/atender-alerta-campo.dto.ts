import { IsArray, IsOptional, IsString } from 'class-validator';

export class AtenderAlertaCampoDto {
  @IsString()
  comentarioCierre: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  evidenciaUrls?: string[];
}
