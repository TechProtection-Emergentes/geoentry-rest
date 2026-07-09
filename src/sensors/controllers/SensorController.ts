import { Controller, Get, Post, Put, Delete, Body, Param, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SensorService } from '../services/SensorService';
import { Sensor } from '../models/SensorModel';
import { CreateSensorDto, UpdateSensorDto, UpdateSensorStatusDto, CreateSensorForUserDto } from '../dto/sensor.dto';
import { SensorWithDeviceResponseDto } from '../dto/sensorResponse.dto';

@ApiTags('sensors')
@Controller('sensors')
export class SensorController {
  constructor(private readonly sensorService: SensorService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todos los sensores' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de sensores con información del dispositivo', 
    type: [SensorWithDeviceResponseDto] 
  })
  async getAllSensors(): Promise<Sensor[]> {
    return await this.sensorService.getAllSensors();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener sensor por ID' })
  @ApiParam({ name: 'id', description: 'ID del sensor (UUID)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Sensor encontrado con información del dispositivo', 
    type: SensorWithDeviceResponseDto 
  })
  @ApiResponse({ status: 404, description: 'Sensor no encontrado' })
  async getSensor(@Param('id') id: string): Promise<Sensor> {
    return await this.sensorService.getSensorById(id);
  }
  @Post()
  @ApiOperation({ summary: 'Crear un nuevo sensor' })
  @ApiResponse({ status: 201, description: 'Sensor creado exitosamente', type: Sensor })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  async createSensor(@Body() sensorDto: CreateSensorDto): Promise<Sensor> {
    const sensorData = {
      name: sensorDto.name,
      sensor_type: sensorDto.sensor_type,
      isActive: sensorDto.isActive,
      user_id: sensorDto.user_id
    };
    return await this.sensorService.createSensor(sensorData);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un sensor' })
  @ApiParam({ name: 'id', description: 'ID del sensor' })
  @ApiResponse({ status: 200, description: 'Sensor actualizado exitosamente', type: Sensor })
  @ApiResponse({ status: 404, description: 'Sensor no encontrado' })
  async updateSensor(
    @Param('id') id: string,
    @Body() sensorDto: UpdateSensorDto
  ): Promise<Sensor> {
    const sensorData: any = {};
    if (sensorDto.name) sensorData.name = sensorDto.name;
    if (sensorDto.sensor_type) sensorData.sensor_type = sensorDto.sensor_type;
    if (sensorDto.isActive !== undefined) sensorData.isActive = sensorDto.isActive;
    
    return await this.sensorService.updateSensor(id, sensorData);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Actualizar estado de un sensor' })
  @ApiParam({ name: 'id', description: 'ID del sensor' })
  @ApiResponse({ status: 200, description: 'Estado del sensor actualizado exitosamente', type: Sensor })
  @ApiResponse({ status: 404, description: 'Sensor no encontrado' })
  async updateSensorStatus(
    @Param('id') id: string,
    @Body() statusData: UpdateSensorStatusDto
  ): Promise<Sensor> {
    return await this.sensorService.updateSensorStatus(id, statusData.isActive);
  }

  @Get('user/:userId/type/:dataType')
  @ApiOperation({ summary: 'Obtener sensores por usuario y tipo' })
  @ApiParam({ name: 'userId', description: 'ID del usuario' })
  @ApiParam({ 
    name: 'dataType', 
    description: 'Tipo de sensor',
    enum: ['led_tv', 'smart_light', 'air_conditioner', 'coffee_maker', 'smart_lock']
  })
  @ApiResponse({ status: 200, description: 'Sensores encontrados', type: [Sensor] })
  async getSensorsByUserAndType(
    @Param('userId') userId: string,
    @Param('dataType') dataType: 'led_tv' | 'smart_light' | 'air_conditioner' | 'coffee_maker' | 'smart_lock'
  ): Promise<Sensor[]> {
    return await this.sensorService.getSensorsByUserAndType(userId, dataType);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Obtener sensores por usuario' })
  @ApiParam({ name: 'userId', description: 'ID del usuario' })
  @ApiResponse({ status: 200, description: 'Sensores encontrados', type: [Sensor] })
  async getSensorsByUser(
    @Param('userId') userId: string
  ): Promise<Sensor[]> {
    return await this.sensorService.getSensorsByUser(userId);
  }

  @Post('user/:userId')
  @ApiOperation({ summary: 'Crear un nuevo sensor para un usuario' })
  @ApiParam({ name: 'userId', description: 'ID del usuario' })
  @ApiResponse({ status: 201, description: 'Sensor creado exitosamente para el usuario', type: Sensor })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado o sin dispositivo' })
  async createSensorForUser(
    @Param('userId') userId: string,
    @Body() sensorDto: CreateSensorForUserDto
  ): Promise<Sensor> {
    const sensorData = {
      name: sensorDto.name,
      sensor_type: sensorDto.sensor_type,
      isActive: sensorDto.isActive
    };
    return await this.sensorService.createSensorForUser(userId, sensorData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un sensor' })
  @ApiParam({ name: 'id', description: 'ID del sensor' })
  @ApiResponse({ status: 200, description: 'Sensor eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Sensor no encontrado' })
  async deleteSensor(@Param('id') id: string): Promise<void> {
    return await this.sensorService.deleteSensor(id);
  }

  @Get('user/:userId/available-types')
  @ApiOperation({ summary: 'Obtener tipos de sensores disponibles para un usuario' })
  @ApiParam({ name: 'userId', description: 'ID del usuario (UUID)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de tipos de sensores que el usuario puede agregar', 
    schema: {
      type: 'object',
      properties: {
        availableTypes: {
          type: 'array',
          items: { type: 'string' },
          example: ['led_tv', 'air_conditioner']
        }
      }
    }
  })
  async getAvailableSensorTypes(@Param('userId') userId: string): Promise<{ availableTypes: string[] }> {
    const availableTypes = await this.sensorService.getAvailableSensorTypes(userId);
    return { availableTypes };
  }
}