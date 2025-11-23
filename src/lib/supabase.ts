import { createClient } from '@supabase/supabase-js'

// URL de su proyecto
const supabaseUrl = "https://uvzynzhosghdmzgamwkp.supabase.co"; 

// Clave pública anónima (CORREGIDA: Eliminado el símbolo '!' del segmento 'ref' en el payload JWT)
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2enluemhvc2doZG16Z2Ftd2twIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2NjQzMTAsImV4cCI6MjA3NDI0MDMxMH0.UJ88fBi4282ZAOoz294kvUACO0RBvwAeQ8My12yeY30";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
