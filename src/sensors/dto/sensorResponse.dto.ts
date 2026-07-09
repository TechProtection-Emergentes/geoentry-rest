import { ApiProperty } from '@nestjs/swagger';

export class SensorResponseDto {
  @ApiProperty({ description: 'ID único del sensor' })
  id: string;

  @ApiProperty({ description: 'Nombre del sensor' })
  name: string;

  @ApiProperty({ 
    description: 'Tipo de dispositivo', 
    enum: ['led_tv', 'smart_light', 'air_conditioner', 'coffee_maker', 'smart_lock']
  })
  sensor_type: string;

  @ApiProperty({ description: 'Si el sensor está activo' })
  isActive: boolean;

  @ApiProperty({ description: 'ID del usuario propietario' })
  user_id: string;

  @ApiProperty({ description: 'Fecha de creación' })
  created_at: string | null;

  @ApiProperty({ description: 'Fecha de última actualización' })
  updated_at: string | null;
}

// Mantener para compatibilidad con controladores existentes
export class SensorWithDeviceResponseDto extends SensorResponseDto {}