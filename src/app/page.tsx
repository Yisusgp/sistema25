"use client";

import { useState, useEffect } from "react";
import { LoginForm } from "@/components/LoginForm";
import { ReservationDashboard } from "@/components/ReservationDashboard";
import { AdminDashboard } from "@/components/AdminDashboard";
import { Toaster, toast } from "sonner";
import { supabase } from "@/lib/supabase";
import {
  UserProfile,
  RegistroUso,
  EspacioMapeo,
  RegistroUsoStatus,
} from "@/types/app";

// ----------------------------------------------------------------------
// 1. FUNCIONES AUXILIARES DE SUPABASE: Carga de Perfil y Registros
// ----------------------------------------------------------------------

const fetchProfileAndRole = async (authUserId: string): Promise<UserProfile | null> => {
  // 1. Obtener Id_Usuario, Nombre, y Apellido de la tabla USUARIO
  const { data: userData, error: userError } = await supabase
    .from('Usuario')
    .select('Id_Usuario, Nombre, Apellido, Correo_Electronico')
    .eq('Auth_Uuid', authUserId)
    .single();

  if (userError || !userData) {
    console.error("Error al cargar USUARIO:", JSON.stringify(userError, null, 2));
    return null;
  }

  let role: UserProfile['role'] = 'guest';

  // 2. Determinar el rol por existencia en tablas especializadas
  // CORRECCIÓN: Usar el nombre correcto de la columna FK (probablemente 'Id_Usuario')
  const checks = [
    { table: 'Administrador', role: 'admin' },
    { table: 'Profesor', role: 'profesor' },
    { table: 'Estudiante', role: 'estudiante' },
  ];
  
  for (const check of checks) {
    const { count } = await supabase
      .from(check.table)
      .select('*', { count: 'exact', head: true })
      .eq('Id_Usuario', userData.Id_Usuario); // CORRECCIÓN: Mantener Id_Usuario
    
    if (count && count > 0) {
      role = check.role as UserProfile['role'];
      break;
    }
  }

  return {
    id: userData.Id_Usuario,
    authId: authUserId,
    name: `${userData.Nombre} ${userData.Apellido}`,
    email: userData.Correo_Electronico,
    role: role,
  };
};

// Carga de todos los espacios para el mapeo de ID en el formulario
const fetchEspacios = async (): Promise<EspacioMapeo[]> => {
  const { data, error } = await supabase
    .from('Espacio')
    .select('Id_Espacio, Nombre, Tipo_Espacio');
  
  if (error) {
      toast.error("Error al cargar la lista de espacios.");
      return [];
  }
  return (data || []).map((item: any) => ({
    ID_Espacio: item.Id_Espacio,
    Nombre: item.Nombre,
    Tipo_Espacio: item.Tipo_Espacio,
  }));
};

// Carga de registros de uso (reservas)
const fetchRegistros = async (userProfile: UserProfile): Promise<RegistroUso[]> => {
  let query = supabase
    .from('Registro_Uso')
    .select(`
      *,
      Espacio(Nombre, Ubicacion)
    `)
    .order('Fecha_Hora_Inicio', { ascending: false });
    
  if (userProfile.role !== 'admin') {
    query = query.eq('Id_Usuario', userProfile.id);
  }

  const { data, error } = await query;
  if (error) {
    toast.error("Error al cargar registros: " + error.message);
    return [];
  }
  
  // CORRECCIÓN: Usar el nombre correcto de la relación (probablemente en mayúsculas)
  return data.map((r: any) => ({
    ...r,
    Nombre_Espacio: r.ESPACIO?.Nombre || 'Espacio no disponible',
    Ubicacion_Espacio: r.ESPACIO?.Ubicacion || 'Ubicación no disponible',
  })) as RegistroUso[]; 
};

// ----------------------------------------------------------------------
// COMPONENTE PRINCIPAL
// ----------------------------------------------------------------------

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [registros, setRegistros] = useState<RegistroUso[]>([]);
  const [espacios, setEspacios] = useState<EspacioMapeo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadApp = async () => {
      setLoading(true);
      
      const loadedEspacios = await fetchEspacios();
      setEspacios(loadedEspacios);

      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const profile = await fetchProfileAndRole(session.user.id);
        if (profile && profile.role !== 'guest') {
          setUser(profile);
          const loadedRegistros = await fetchRegistros(profile);
          setRegistros(loadedRegistros);
        } else {
          await supabase.auth.signOut();
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };
    loadApp();
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
        (event, session) => {
            if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
                loadApp(); 
            }
        }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(`Error al cerrar sesión: ${error.message}`);
    } else {
      setUser(null);
      setRegistros([]);
      toast.info("Sesión cerrada correctamente.");
    }
  };

  const handleCreateReservation = async (
    reservationData: Omit<RegistroUso, "Id_Registro" | "Estado_Final">,
  ): Promise<{ success: boolean; error?: string }> => {
    
    const { error } = await supabase.rpc('check_and_create_registro', {
        p_Id_Usuario: reservationData.ID_Usuario,
        p_id_espacio: reservationData.ID_Espacio,
        p_id_curso: reservationData.ID_Curso,
        p_fecha_hora_inicio: reservationData.Fecha_Hora_Inicio,
        p_fecha_hora_fin: reservationData.Fecha_Hora_Fin,
        p_proposito: reservationData.Proposito,
    });
    
    if (error) {
        return { success: false, error: error.message };
    }
    
    if (user) {
        const updatedRegistros = await fetchRegistros(user);
        setRegistros(updatedRegistros);
    }
    return { success: true };
  };

  const handleApproveReservation = async (idRegistro: number) => {
    const { error } = await supabase
      .from('Registro_Uso')
      .update({ Estado_Final: 'Confirmado' as RegistroUsoStatus })
      .eq('Id_Registro', idRegistro);

    if (error) { toast.error(`Error al aprobar: ${error.message}`); return; }
    
    if (user) {
        const updatedRegistros = await fetchRegistros(user);
        setRegistros(updatedRegistros);
        toast.success("Reserva Confirmada exitosamente.");
    }
  };
  
  const handleRejectReservation = async (idRegistro: number, reason: string) => {
    const { error } = await supabase
      .from('Registro_Uso')
      .update({ Estado_Final: 'Rechazado' as RegistroUsoStatus, Observaciones: reason })
      .eq('Id_Registro', idRegistro);

    if (error) { toast.error(`Error al rechazar: ${error.message}`); return; }
    
    if (user) {
        const updatedRegistros = await fetchRegistros(user);
        setRegistros(updatedRegistros);
        toast.success("Reserva Rechazada exitosamente.");
    }
  };

  const handleDeleteReservation = async (idRegistro: number) => {
    const { error } = await supabase
        .from('Registro_Uso')
        .delete()
        .eq('Id_Registro', idRegistro);

    if (error) { toast.error(`Error al eliminar: ${error.message}`); return; }
    
    if (user) {
        const updatedRegistros = await fetchRegistros(user);
        setRegistros(updatedRegistros);
        toast.success("Registro eliminado del historial.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-indigo-600">Cargando aplicación y sesión...</p>
      </div>
    );
  }

  const userRegistros = user ? registros.filter((r) => r.ID_Usuario === user.id) : [];

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      {!user ? (
        <LoginForm /> 
      ) : user.role === "admin" ? (
        <AdminDashboard
          user={user}
          onLogout={handleLogout}
          reservations={registros}
          onApprove={handleApproveReservation}
          onReject={handleRejectReservation}
          onCancel={handleDeleteReservation}
        />
      ) : (
        <ReservationDashboard
          user={user}
          onLogout={handleLogout}
          onCreateReservation={handleCreateReservation}
          reservations={userRegistros}
          onDeleteReservation={handleDeleteReservation}
          espacios={espacios}
        />
      )}
      <Toaster />
    </div>
  );
}