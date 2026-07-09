import { Injectable } from '@nestjs/common';
import { supabase } from '../../supabase/supabase-client';
import { Sensor } from '../models/SensorModel';
import { Database } from '../../types/supabase';

type SensorRow = Database['public']['Tables']['sensors']['Row'];
type SensorInsert = Database['public']['Tables']['sensors']['Insert'];
type SensorUpdate = Database['public']['Tables']['sensors']['Update'];

@Injectable()
export class SensorRepository {
  async findAll(): Promise<Sensor[]> {
    const { data, error } = await supabase
      .from('sensors')
      .select('*');

    if (error) {
      throw new Error(`Error fetching sensors: ${error.message}`);
    }

    return data as any[];
  }

  async findById(id: string): Promise<Sensor | null> {
    const { data, error } = await supabase
      .from('sensors')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return null;
    }

    return data as any;
  }

  async create(sensorData: SensorInsert): Promise<Sensor> {
    const { data, error } = await supabase
      .from('sensors')
      .insert(sensorData)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Error creating sensor: ${error.message}`);
    }

    return data as any;
  }

  async update(id: string, sensorData: SensorUpdate): Promise<Sensor | null> {
    const { data, error } = await supabase
      .from('sensors')
      .update(sensorData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return null;
    }

    return data as any;
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('sensors')
      .delete()
      .eq('id', id);

    return !error;
  }

  async findByUserId(userId: string): Promise<Sensor[]> {
    const { data, error } = await supabase
      .from('sensors')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Error fetching sensors by user: ${error.message}`);
    }

    return data as any[];
  }

  async findByUserAndType(userId: string, sensorType: 'led_tv' | 'smart_light' | 'air_conditioner' | 'coffee_maker' | 'smart_lock'): Promise<Sensor[]> {
    const { data, error } = await supabase
      .from('sensors')
      .select('*')
      .eq('user_id', userId)
      .eq('sensor_type', sensorType);

    if (error) {
      throw new Error(`Error fetching sensors by user and type: ${error.message}`);
    }

    return data as any[];
  }
}