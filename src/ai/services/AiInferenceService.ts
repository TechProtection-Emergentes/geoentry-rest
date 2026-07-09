import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { supabase } from '../../supabase/supabase-client';
import { firstValueFrom } from 'rxjs';

export interface AiContextSnapshot {
  time: string;
  isWeekend: boolean;
  userHabitsSummary: string;
  currentLocationName: string;
}

export interface AiInferenceDecision {
  confidence: number;
  actions: {
    deviceId: string;
    targetState: boolean;
    reason: string;
  }[];
}

@Injectable()
export class AiInferenceService {
  private readonly logger = new Logger(AiInferenceService.name);
  private readonly OLLAMA_URL: string;
  private readonly MODEL_NAME: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.OLLAMA_URL = this.configService.get<string>('OLLAMA_URL') || 'http://127.0.0.1:11434/api/generate';
    this.MODEL_NAME = this.configService.get<string>('OLLAMA_MODEL_NAME') || 'llama3';
  }

  async evaluateProximityEvent(
    userId: string,
    eventId: string,
    snapshot: AiContextSnapshot,
    availableDevices: any[]
  ): Promise<AiInferenceDecision | null> {
    // Fetch historical feedback corrections
    const { data: feedbacks } = await supabase
      .from('user_feedback_loops')
      .select('*')
      .eq('user_id', userId)
      .eq('feedback_action', 'MANUAL_OVERRIDE')
      .order('created_at', { ascending: false })
      .limit(5);

    let historicalCorrections = '';
    if (feedbacks && feedbacks.length > 0) {
      historicalCorrections = '\\n\\nHISTORIAL DE CORRECCIONES DEL USUARIO (MUY IMPORTANTE):\\n';
      feedbacks.forEach(f => {
        const details = f.override_details as any;
        if (details) {
          historicalCorrections += `- El usuario corrigió tu decisión previa para el sensor "${details.sensor_name}". Tú querías ${details.ai_target_state ? 'ENCENDERLO' : 'APAGARLO'} pero el usuario decidió ${details.user_overridden_state ? 'ENCENDERLO' : 'APAGARLO'}. Aprende de este error.\\n`;
        }
      });
    }

    const prompt = `
      Actúa como el cerebro domótico de GeoEntry. El usuario acaba de ingresar a la zona de proximidad (${snapshot.currentLocationName}).
      Contexto actual:
      - Hora: ${snapshot.time}
      - Es fin de semana: ${snapshot.isWeekend}
      - Hábitos actuales: ${snapshot.userHabitsSummary}${historicalCorrections}
      - Dispositivos disponibles: ${JSON.stringify(availableDevices)}

      Debes decidir qué dispositivos encender o apagar en base a estos datos.
      Retorna ÚNICAMENTE un objeto JSON con el siguiente formato:
      {
        "confidence": 0.95,
        "actions": [
          { "deviceId": "uuid-del-dispositivo", "targetState": true, "reason": "Es de noche y suele encender la luz" }
        ]
      }
    `;

    try {
      this.logger.log('Solicitando inferencia a Ollama local...');
      const { data } = await firstValueFrom(
        this.httpService.post(this.OLLAMA_URL, {
          model: this.MODEL_NAME,
          prompt: prompt,
          format: 'json',
          stream: false,
          options: {
            temperature: 0.2
          }
        })
      );

      let aiResponse: AiInferenceDecision;
      try {
        // Limpiar posible formato Markdown de Llama3 (```json ... ```)
        const cleanedResponse = data.response.replace(/```json/gi, '').replace(/```/g, '').trim();
        aiResponse = JSON.parse(cleanedResponse);
      } catch (parseError) {
        this.logger.error('La respuesta de Ollama no es un JSON válido o la estructura es incorrecta', data.response);
        return null;
      }

      await this.saveInferenceLog(userId, eventId, snapshot, prompt, aiResponse);
      return aiResponse;
    } catch (error) {
      this.logger.error('Error durante la inferencia de IA local', error);
      return null;
    }
  }

  private async saveInferenceLog(
    userId: string,
    eventId: string,
    snapshot: AiContextSnapshot,
    rawPrompt: string,
    aiResponse: AiInferenceDecision
  ) {
    const { error } = await supabase.from('ai_inference_logs').insert({
      user_id: userId,
      proximity_event_id: eventId,
      context_snapshot: snapshot as any,
      ai_confidence: aiResponse.confidence,
      raw_prompt: rawPrompt,
      ai_response: aiResponse as any,
    });

    if (error) {
      this.logger.error('Fallo al guardar el log de inferencia en Supabase: ' + error.message);
    }
  }
}
