import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsOptional, IsIn, IsBoolean } from 'class-validator';

export class CreateSensorDto {
  @ApiProperty({ description: 'Nombre del sensor' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ 
    description: 'Tipo de dispositivo', 
    enum: ['led_tv', 'smart_light', 'air_conditioner', 'coffee_maker', 'smart_lock']
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['led_tv', 'smart_light', 'air_conditioner', 'coffee_maker', 'smart_lock'])
  sensor_type: 'led_tv' | 'smart_light' | 'air_conditioner' | 'coffee_maker' | 'smart_lock';

  @ApiProperty({ description: 'Si el sensor está activo', default: true })
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({ description: 'ID del usuario propietario' })
  @IsUUID()
  @IsNotEmpty()
  user_id: string;
}

export class UpdateSensorDto {
  @ApiProperty({ description: 'Nombre del sensor', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ 
    description: 'Tipo de dispositivo', 
    required: false,
    enum: ['led_tv', 'smart_light', 'air_conditioner', 'coffee_maker', 'smart_lock']
  })
  @IsOptional()
  @IsString()
  @IsIn(['led_tv', 'smart_light', 'air_conditioner', 'coffee_maker', 'smart_lock'])
  sensor_type?: 'led_tv' | 'smart_light' | 'air_conditioner' | 'coffee_maker' | 'smart_lock';

  @ApiProperty({ description: 'Si el sensor está activo', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateSensorStatusDto {
  @ApiProperty({ 
    description: 'Estado activo del sensor', 
    example: true
  })
  @IsBoolean()
  @IsNotEmpty()
  isActive: boolean;
}

export class CreateSensorForUserDto {
  @ApiProperty({ description: 'Nombre del sensor' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ 
    description: 'Tipo de dispositivo', 
    enum: ['led_tv', 'smart_light', 'air_conditioner', 'coffee_maker', 'smart_lock']
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['led_tv', 'smart_light', 'air_conditioner', 'coffee_maker', 'smart_lock'])
  sensor_type: 'led_tv' | 'smart_light' | 'air_conditioner' | 'coffee_maker' | 'smart_lock';

  @ApiProperty({ description: 'Si el sensor está activo', default: true })
  @IsBoolean()
  isActive: boolean;
}
