import { Injectable, NotFoundException } from '@nestjs/common';
import { supabase } from '../../supabase/supabase-client';
import { Sensor } from '../models/SensorModel';
import { Database } from '../../types/supabase';

type SensorRow = Database['public']['Tables']['sensors']['Row'];
type SensorInsert = Database['public']['Tables']['sensors']['Insert'];
type SensorUpdate = Database['public']['Tables']['sensors']['Update'];

@Injectable()
export class SensorService {
  async getAllSensors(): Promise<Sensor[]> {
    const { data, error } = await supabase
      .from('sensors')
      .select('*');

    if (error) {
      throw new Error(`Error fetching sensors: ${error.message}`);
    }

    return data as Sensor[];
  }

  async getSensorById(id: string): Promise<Sensor> {
    const { data, error } = await supabase
      .from('sensors')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Sensor with ID ${id} not found`);
    }

    return data as Sensor;
  }
  async createSensor(sensorData: Partial<Sensor>): Promise<Sensor> {
    if (!sensorData.name || !sensorData.sensor_type || sensorData.isActive === undefined || !sensorData.user_id) {
      throw new Error('Missing required fields: name, sensor_type, isActive, user_id');
    }

    const insertData: SensorInsert = {
      name: sensorData.name,
      sensor_type: sensorData.sensor_type,
      isActive: sensorData.isActive,
      user_id: sensorData.user_id,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('sensors')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating sensor: ${error.message}`);
    }

    return data as Sensor;
  }

  async createSensorForUser(userId: string, sensorData: Partial<Sensor>): Promise<Sensor> {
    if (!sensorData.name || !sensorData.sensor_type || sensorData.isActive === undefined) {
      throw new Error('Missing required fields: name, sensor_type, isActive');
    }

    // Verificar si el usuario ya tiene un sensor de este tipo
    const { data: existingSensor, error: checkError } = await supabase
      .from('sensors')
      .select('id')
      .eq('user_id', userId)
      .eq('sensor_type', sensorData.sensor_type)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = no rows found, que es lo que esperamos
      throw new Error(`Error checking existing sensors: ${checkError.message}`);
    }

    if (existingSensor) {
      throw new Error(`Ya tienes un sensor de tipo ${sensorData.sensor_type}. Solo se permite uno por tipo.`);
    }

    const insertData: SensorInsert = {
      name: sensorData.name,
      sensor_type: sensorData.sensor_type,
      isActive: sensorData.isActive,
      user_id: userId,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('sensors')
      .insert(insertData)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Error creating sensor for user: ${error.message}`);
    }

    return data as Sensor;
  }

  async updateSensor(id: string, sensorData: Partial<Sensor>): Promise<Sensor> {
    const updateData: SensorUpdate = {
      updated_at: new Date().toISOString(),
    };

    if (sensorData.name) updateData.name = sensorData.name;
    if (sensorData.sensor_type) updateData.sensor_type = sensorData.sensor_type;
    if (sensorData.isActive !== undefined) updateData.isActive = sensorData.isActive;
    if (sensorData.user_id) updateData.user_id = sensorData.user_id;

    const { error } = await supabase
      .from('sensors')
      .update(updateData)
      .eq('id', id);

    if (error) {
      throw new Error(`Error updating sensor: ${error.message}`);
    }

    return await this.getSensorById(id);
  }

  async updateSensorStatus(id: string, isActive: boolean): Promise<Sensor> {
    const sensor = await this.getSensorById(id);
    const wasActive = sensor.isActive;

    const updateData: SensorUpdate = {
      isActive: isActive,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('sensors')
      .update(updateData)
      .eq('id', id);

    if (error) {
      throw new Error(`Error updating sensor status: ${error.message}`);
    }

    // AI Feedback Loop: Detect manual override
    if (wasActive !== isActive && sensor.user_id) {
      // Find AI inferences from the last 15 minutes for this user
      const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      
      const { data: recentInferences } = await supabase
        .from('ai_inference_logs')
        .select('*')
        .eq('user_id', sensor.user_id)
        .gte('created_at', fifteenMinsAgo)
        .order('created_at', { ascending: false });

      if (recentInferences && recentInferences.length > 0) {
        // Look for an action targeting this specific sensor with the opposite state
        for (const log of recentInferences) {
          const aiResponse = log.ai_response as any;
          if (aiResponse && aiResponse.actions && Array.isArray(aiResponse.actions)) {
            const aiAction = aiResponse.actions.find((a: any) => a.deviceId === id);
            
            // If AI targeted this device and set it to the opposite of what the user just set it to
            if (aiAction && aiAction.targetState !== isActive) {
              console.log(`[AI FEEDBACK] User overrode AI decision for sensor ${sensor.name} (Log: ${log.id})`);
              
              // Register the correction
              await supabase.from('user_feedback_loops').insert({
                user_id: sensor.user_id,
                inference_log_id: log.id,
                feedback_action: 'MANUAL_OVERRIDE',
                override_details: {
                  sensor_id: id,
                  sensor_name: sensor.name,
                  ai_target_state: aiAction.targetState,
                  user_overridden_state: isActive,
                  reason: aiAction.reason
                }
              });
              
              // Only process the most recent matching inference to avoid duplicate feedback
              break;
            }
          }
        }
      }
    }

    return await this.getSensorById(id);
  }

  async getSensorsByUserAndType(userId: string, sensorType: 'led_tv' | 'smart_light' | 'air_conditioner' | 'coffee_maker'): Promise<Sensor[]> {
    const { data, error } = await supabase
      .from('sensors')
      .select('*')
      .eq('user_id', userId)
      .eq('sensor_type', sensorType);

    if (error) {
      throw new Error(`Error fetching sensors by user and type: ${error.message}`);
    }

    return data as Sensor[];
  }

  async getSensorsByUser(userId: string): Promise<Sensor[]> {
    const { data, error } = await supabase
      .from('sensors')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Error fetching sensors by user: ${error.message}`);
    }

    return data as Sensor[];
  }

  async deleteSensor(id: string): Promise<void> {
    const { error } = await supabase
      .from('sensors')
      .delete()
      .eq('id', id);

    if (error) {
      throw new NotFoundException(`Sensor with ID ${id} not found`);
    }
  }

  async getAvailableSensorTypes(userId: string): Promise<string[]> {
    // Tipos de sensores permitidos
    const allTypes: string[] = ['led_tv', 'smart_light', 'air_conditioner', 'coffee_maker'];
    
    // Obtener tipos que el usuario ya tiene
    const { data: existingSensors, error } = await supabase
      .from('sensors')
      .select('sensor_type')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Error fetching existing sensor types: ${error.message}`);
    }

    const existingTypes = existingSensors.map(sensor => sensor.sensor_type as string);
    
    // Retornar tipos que no tiene
    return allTypes.filter(type => !existingTypes.includes(type));
  }
}
