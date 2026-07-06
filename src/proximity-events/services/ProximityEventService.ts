import { Injectable, NotFoundException } from '@nestjs/common';
import { supabase } from '../../supabase/supabase-client';
import { ProximityEvent } from '../models/ProximityEventModel';
import { Database } from '../../types/supabase';

type ProximityEventRow = Database['public']['Tables']['proximity_events']['Row'];
type ProximityEventInsert = Database['public']['Tables']['proximity_events']['Insert'];
type ProximityEventUpdate = Database['public']['Tables']['proximity_events']['Update'];

import { AiInferenceService } from '../../ai/services/AiInferenceService';
import { SensorService } from '../../sensors/services/SensorService';

@Injectable()
export class ProximityEventService {
  constructor(
    private readonly aiInferenceService: AiInferenceService,
    private readonly sensorService: SensorService
  ) {}
  async getAllProximityEvents(): Promise<ProximityEvent[]> {
    const { data, error } = await supabase
      .from('proximity_events')
      .select(`
        *,
        device:devices(*),
        user:profiles(*),
        location:locations(*)
      `);

    if (error) {
      throw new Error(`Error fetching proximity events: ${error.message}`);
    }

    return data as any[];
  }

  async getProximityEventById(id: string): Promise<ProximityEvent> {
    const { data, error } = await supabase
      .from('proximity_events')
      .select(`
        *,
        device:devices(*),
        user:profiles(*),
        location:locations(*)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Proximity event with ID ${id} not found`);
    }

    return data as any;
  }

  async createProximityEvent(proximityEventData: Partial<ProximityEvent>): Promise<ProximityEvent> {
    if (!proximityEventData.type || 
        typeof proximityEventData.latitude !== 'number' || 
        typeof proximityEventData.longitude !== 'number' ||
        typeof proximityEventData.distance !== 'number' ||
        !proximityEventData.home_location_id ||
        !proximityEventData.home_location_name) {
      throw new Error('Missing required fields: type, latitude, longitude, distance, home_location_id, home_location_name');
    }

    const insertData: ProximityEventInsert = {
      type: proximityEventData.type,
      latitude: proximityEventData.latitude,
      longitude: proximityEventData.longitude,
      distance: proximityEventData.distance,
      home_location_id: proximityEventData.home_location_id,
      home_location_name: proximityEventData.home_location_name,
      device_id: proximityEventData.device_id || null,
      user_id: proximityEventData.user_id || null,
    };

    const { data, error } = await supabase
      .from('proximity_events')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating proximity event: ${error.message}`);
    }

    if (proximityEventData.type === 'enter' && proximityEventData.user_id) {
      const userId = proximityEventData.user_id;
      this.sensorService.getSensorsByUser(userId).then(sensors => {
        // Build dynamic context based on current sensor states
        const onSensors = sensors.filter(s => s.isActive).map(s => s.name);
        const offSensors = sensors.filter(s => !s.isActive).map(s => s.name);
        
        let dynamicHabits = 'El usuario acaba de llegar. ';
        if (onSensors.length > 0) dynamicHabits += `Actualmente tiene encendido: ${onSensors.join(', ')}. `;
        if (offSensors.length > 0) dynamicHabits += `Actualmente tiene apagado: ${offSensors.join(', ')}. `;
        dynamicHabits += 'Decide qué dispositivos (actualmente apagados) deberías encender para su confort basándote en la hora.';

        this.aiInferenceService.evaluateProximityEvent(
          userId,
          data.id,
          {
            time: new Date().toLocaleTimeString(),
            isWeekend: [0, 6].includes(new Date().getDay()),
            userHabitsSummary: dynamicHabits,
            currentLocationName: proximityEventData.home_location_name || 'Home'
          },
          sensors.map(s => ({
            id: s.id,
            name: s.name,
            type: s.sensor_type,
            isActive: s.isActive
          }))
        ).then(decision => {
          if (decision && decision.confidence > 0.70 && decision.actions) {
            console.log('IA Decision applied:', decision);
            for (const action of decision.actions) {
              if (action.deviceId && action.targetState !== undefined) {
                this.sensorService.updateSensorStatus(action.deviceId, action.targetState)
                  .then(() => console.log(`[AI AUTOMATION] Sensor ${action.deviceId} updated to ${action.targetState} via AI.`))
                  .catch(err => console.error(`[AI AUTOMATION ERROR] Error updating sensor via AI: ${err.message}`));
              }
            }
          }
        }).catch(e => console.error('AI inference error:', e));
      }).catch(e => console.error('Error fetching sensors for AI context:', e));
    }

    return this.getProximityEventById(data.id);
  }

  async updateProximityEvent(id: string, proximityEventData: Partial<ProximityEvent>): Promise<ProximityEvent> {
    const updateData: ProximityEventUpdate = {};

    if (proximityEventData.type) updateData.type = proximityEventData.type;
    if (typeof proximityEventData.latitude === 'number') updateData.latitude = proximityEventData.latitude;
    if (typeof proximityEventData.longitude === 'number') updateData.longitude = proximityEventData.longitude;
    if (typeof proximityEventData.distance === 'number') updateData.distance = proximityEventData.distance;
    if (proximityEventData.home_location_id) updateData.home_location_id = proximityEventData.home_location_id;
    if (proximityEventData.home_location_name) updateData.home_location_name = proximityEventData.home_location_name;
    if (proximityEventData.device_id !== undefined) updateData.device_id = proximityEventData.device_id;
    if (proximityEventData.user_id !== undefined) updateData.user_id = proximityEventData.user_id;

    const { error } = await supabase
      .from('proximity_events')
      .update(updateData)
      .eq('id', id);

    if (error) {
      throw new Error(`Error updating proximity event: ${error.message}`);
    }

    return await this.getProximityEventById(id);
  }

  async deleteProximityEvent(id: string): Promise<void> {
    const { error } = await supabase
      .from('proximity_events')
      .delete()
      .eq('id', id);

    if (error) {
      throw new NotFoundException(`Proximity event with ID ${id} not found`);
    }
  }

  async getProximityEventsByUserId(userId: string): Promise<ProximityEvent[]> {
    const { data, error } = await supabase
      .from('proximity_events')
      .select(`
        *,
        device:devices(*),
        user:profiles(*),
        location:locations(*)
      `)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Error fetching proximity events by user: ${error.message}`);
    }

    return data as any[];
  }

  async getProximityEventsByDeviceId(deviceId: string): Promise<ProximityEvent[]> {
    const { data, error } = await supabase
      .from('proximity_events')
      .select(`
        *,
        device:devices(*),
        user:profiles(*),
        location:locations(*)
      `)
      .eq('device_id', deviceId);

    if (error) {
      throw new Error(`Error fetching proximity events by device: ${error.message}`);
    }

    return data as any[];
  }

  async getProximityEventsByLocationId(locationId: string): Promise<ProximityEvent[]> {
    const { data, error } = await supabase
      .from('proximity_events')
      .select(`
        *,
        device:devices(*),
        user:profiles(*),
        location:locations(*)
      `)
      .eq('home_location_id', locationId);

    if (error) {
      throw new Error(`Error fetching proximity events by location: ${error.message}`);
    }

    return data as any[];
  }
}
