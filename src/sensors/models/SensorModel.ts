import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { Tables, Enums } from '../../types/supabase';

type SensorRow = Tables<'sensors'>;

export class Sensor implements SensorRow {
  @ApiProperty({ description: 'ID único del sensor' })
  id: string;

  @ApiProperty({ description: 'Nombre del sensor' })
  @IsString()
  name: string;

  @ApiProperty({ 
    description: 'Tipo de dispositivo', 
    enum: ['led_tv', 'smart_light', 'air_conditioner', 'coffee_maker', 'smart_lock']
  })
  sensor_type: Enums<'device_type_enum'>;

  @ApiProperty({ description: 'Si el sensor está activo' })
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({ description: 'ID del usuario propietario' })
  user_id: string;

  @ApiProperty({ description: 'Fecha de creación' })
  created_at: string | null;

  @ApiProperty({ description: 'Fecha de última actualización' })
  updated_at: string | null;
}