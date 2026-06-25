import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdatePosicionDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitud: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitud: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  precisionM?: number;

  @IsOptional()
  @IsString()
  nombre?: string;
}
