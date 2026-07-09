import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { supabase } from '../../supabase/supabase-client';

@Injectable()
export class HouseholdsService {
  
  async getMembersByUserId(userId: string) {
    // Buscar el hogar del usuario
    const { data: userHousehold, error: userHouseholdError } = await supabase
      .from('household_members')
      .select('household_id')
      .eq('profile_id', userId)
      .limit(1)
      .single();

    if (userHouseholdError || !userHousehold || !userHousehold.household_id) {
      return { household_id: null, members: [], household_name: 'Mi Hogar' };
    }

    // Obtener los miembros del hogar con JOIN
    const { data: allMembers, error: membersError } = await supabase
      .from('household_members')
      .select(`
        *,
        profiles(full_name, email, avatar_url),
        households(name)
      `)
      .eq('household_id', userHousehold.household_id);

    if (membersError) {
      throw new InternalServerErrorException('Error al obtener los miembros de la familia.');
    }

    const householdName = allMembers.length > 0 ? (allMembers[0] as any).households?.name : 'Mi Hogar';

    return {
      household_id: userHousehold.household_id,
      household_name: householdName,
      members: allMembers
    };
  }

  async inviteMember(householdId: string, email: string, role: 'FAMILY' | 'GUEST') {
    // 1. Buscar al usuario por email en la tabla profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (profileError || !profile) {
      throw new NotFoundException(`No se encontró un usuario registrado con el correo ${email}. El usuario debe registrarse primero.`);
    }

    // 2. Verificar si ya es miembro
    const { data: existingMember } = await supabase
      .from('household_members')
      .select('id')
      .eq('household_id', householdId)
      .eq('profile_id', profile.id)
      .single();

    if (existingMember) {
      throw new BadRequestException('El usuario ya es miembro de este hogar.');
    }

    // 3. Insertar el nuevo miembro
    const { data: newMember, error: insertError } = await supabase
      .from('household_members')
      .insert({
        household_id: householdId,
        profile_id: profile.id,
        role: role
      })
      .select()
      .single();

    if (insertError) {
      throw new InternalServerErrorException('Error al añadir al familiar al hogar: ' + insertError.message);
    }

    return {
      message: 'Familiar invitado exitosamente',
      member: newMember
    };
  }
}
