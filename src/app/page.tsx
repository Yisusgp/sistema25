"use client";

import { useState, useEffect } from "react";
import { LoginForm } from "@/components/LoginForm";
import { ReservationDashboard } from "@/components/ReservationDashboard";
import { AdminDashboard } from "@/components/AdminDashboard";
import { Toaster, toast } from "sonner";
import { supabase } from "@/lib/supabase"; // ⬅️ Cliente de Supabase
import {
  UserProfile,
  RegistroUso,
  EspacioMapeo,
  RegistroUsoStatus,
} from "@/types/app"; // ⬅️ Importación de tipos de /types/app.ts

// ----------------------------------------------------------------------
// 1. FUNCIONES AUXILIARES DE SUPABASE: Carga de Perfil y Registros
// ----------------------------------------------------------------------

//ASUNCIÓN CRUCIAL: La tabla USUARIO tiene una columna 'auth_uuid' vinculada a auth.users.id
const fetchProfileAndRole = async (authUserId: string): Promise<UserProfile | null> => {
  // 1. Obtener ID_Usuario, Nombre, y Apellido de la tabla USUARIO
  const { data: userData, error: userError } = await supabase
    .from('usuario')
    .select('id_usuario, nombre, apellido, correo_electronico')
    .eq('auth_uuid', authUserId)
    .single();

  if (userError || !userData) {
    console.error("Error al cargar USUARIO:", JSON.stringify(userError, null, 2));//cambo en el manejo de errores
    return null;
  }

  let role: UserProfile['role'] = 'guest';

  // 2. Determinar el rol por existencia en tablas especializadas
  const checks = [
    { table: 'administrador', role: 'admin' },
    { table: 'profesor', role: 'profesor' },
    { table: 'estudiante', role: 'estudiante' },
  ];
  
  for (const check of checks) {
    const { count } = await supabase.from(check.table)
      .select('*', { count: 'exact', head: true })
      .eq('id_usuario', userData.id_usuario);
    if (count && count > 0) {
      role = check.role as UserProfile['role'];
      break;
    }
  }

  return {
    id: userData.id_usuario,
    authId: authUserId,
    name: `${userData.nombre} ${userData.apellido}`,
    email: userData.correo_electronico,

    role: role,
  };
};

// Carga de todos los espacios para el mapeo de ID en el formulario
const fetchEspacios = async (): Promise<EspacioMapeo[]> => {
  const { data, error } = await supabase
    .from('espacio')
    .select('id_espacio, nombre, tipo_espacio');
  
  if (error) {
      toast.error("Error al cargar la lista de espacios.");
      return [];
  }
  return (data || []).map((item: any) => ({
    ID_Espacio: item.id_espacio,
    Nombre: item.nombre,
    Tipo_Espacio: item.tipo_espacio,
  }));
};


// Carga de registros de uso (reservas)
const fetchRegistros = async (userProfile: UserProfile): Promise<RegistroUso[]> => {
  let query = supabase
    .from('registro_uso')
    .select(`
      *,
      espacio(nombre, ubicacion) // JOIN implícito con la FK ID_Espacio
    `)
    .order('fecha_hora_inicio', { ascending: false });
    
  // El rol 'admin' ve todo; otros solo ven sus registros.
  if (userProfile.role !== 'admin') {
    query = query.eq('id_usuario', userProfile.id);
  }

  const { data, error } = await query;
  if (error) {
    toast.error("Error al cargar registros: " + error.message);
    return [];
  }
  
  // Mapeo de la relación ESPACIO a propiedades planas en el objeto RegistroUso
  return data.map((r: any) => ({
    ...r,
    Nombre_Espacio: r.espacio.nombre,
    Ubicacion_Espacio: r.espacio.Ubicacion,
  })) as RegistroUso[]; 
};

// ----------------------------------------------------------------------
// COMPONENTE PRINCIPAL
// ----------------------------------------------------------------------

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [registros, setRegistros] = useState<RegistroUso[]>([]);
  const [espacios, setEspacios] = useState<EspacioMapeo[]>([]); // Mapeo de espacios
  const [loading, setLoading] = useState(true);

  // -----------------------------------------------------------
  // 2. LÓGICA DE AUTENTICACIÓN Y CARGA INICIAL (useEffect)
  // -----------------------------------------------------------

  useEffect(() => {
    const loadApp = async () => {
      setLoading(true);
      
      // Cargar mapeo de espacios primero (necesario para el formulario)
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
            // Usuario autenticado pero sin perfil (raro, cerrar sesión)
            await supabase.auth.signOut();
            setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };
    loadApp();
    
    // Listener para cambios de Auth (Ej: después del login/logout)
    const { data: authListener } = supabase.auth.onAuthStateChange(
        (event, session) => {
            if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
                // Re-ejecutar la lógica de carga al cambiar el estado de la sesión
                loadApp(); 
            }
        }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // -----------------------------------------------------------
  // 3. FUNCIONES CRUD (Llamadas a la API de Supabase)
  // -----------------------------------------------------------

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

  // 🟢 CREAR REGISTRO: Usa la RPC (Trigger del servidor)
  const handleCreateReservation = async (
    reservationData: Omit<RegistroUso, "ID_Registro" | "Estado_Final">,
  ): Promise<{ success: boolean; error?: string }> => {
    
    const { error } = await supabase.rpc('check_and_create_registro', {
        p_id_usuario: reservationData.ID_Usuario,
        p_id_espacio: reservationData.ID_Espacio,
        p_id_curso: reservationData.ID_Curso,
        p_fecha_hora_inicio: reservationData.Fecha_Hora_Inicio,
        p_fecha_hora_fin: reservationData.Fecha_Hora_Fin,
        p_proposito: reservationData.Proposito,
    });
    
    if (error) {
        // Captura el error lanzado por la función PostgreSQL/Trigger
        return { success: false, error: error.message };
    }
    
    // Si tiene éxito, recargar los registros para actualizar la vista
    if (user) {
        const updatedRegistros = await fetchRegistros(user);
        setRegistros(updatedRegistros);
    }
    return { success: true };
  };

  // 🟢 APROBAR REGISTRO (ADMIN)
  const handleApproveReservation = async (idRegistro: number) => {
    const { error } = await supabase
      .from('registro_uso')
      .update({ Estado_Final: 'Confirmado' as RegistroUsoStatus })
      .eq('ID_Registro', idRegistro);

    if (error) { toast.error(`Error al aprobar: ${error.message}`); return; }
    
    if (user) {
        const updatedRegistros = await fetchRegistros(user);
        setRegistros(updatedRegistros);
        toast.success("Reserva Confirmada exitosamente.");
    }
  };
  
  // 🟢 RECHAZAR REGISTRO (ADMIN)
  const handleRejectReservation = async (idRegistro: number, reason: string) => {
    const { error } = await supabase
      .from('registro_uso')
      .update({ Estado_Final: 'Rechazado' as RegistroUsoStatus, Observaciones: reason })
      .eq('ID_Registro', idRegistro);

    if (error) { toast.error(`Error al rechazar: ${error.message}`); return; }
    
    if (user) {
        const updatedRegistros = await fetchRegistros(user);
        setRegistros(updatedRegistros);
        toast.success("Reserva Rechazada exitosamente.");
    }
  };

  // 🟢 ELIMINAR/CANCELAR REGISTRO (Usuario/Admin)
  const handleDeleteReservation = async (idRegistro: number) => {
    const { error } = await supabase
        .from('registro_uso')
        .delete()
        .eq('ID_Registro', idRegistro);

    if (error) { toast.error(`Error al eliminar: ${error.message}`); return; }
    
    if (user) {
        const updatedRegistros = await fetchRegistros(user);
        setRegistros(updatedRegistros);
        toast.success("Registro eliminado del historial.");
    }
  };


  // -----------------------------------------------------------
  // 4. RENDERIZADO CONDICIONAL
  // -----------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-indigo-600">Cargando aplicación y sesión...</p>
      </div>
    );
  }

  // Filtrar reservas que pertenecen al usuario (solo para el dashboard)
  const userRegistros = user ? registros.filter((r) => r.ID_Usuario === user.id) : [];

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      {!user ? (
        // El LoginForm ahora debe usar supabase.auth.signInWithPassword
        <LoginForm /> 
      ) : user.role === "admin" ? (
        <AdminDashboard
          user={user}
          onLogout={handleLogout}
          reservations={registros} // El admin ve TODOS los registros
          onApprove={handleApproveReservation}
          onReject={handleRejectReservation}
          onCancel={handleDeleteReservation} // Usar delete como cancelación forzada por ahora
        />
      ) : (
        <ReservationDashboard
          user={user}
          onLogout={handleLogout}
          onCreateReservation={handleCreateReservation}
          reservations={userRegistros} // El usuario solo ve sus registros
          onDeleteReservation={handleDeleteReservation}
          espacios={espacios} // Pasamos el mapeo para el formulario
        />
      )}
      <Toaster />
    </div>
  );
}
