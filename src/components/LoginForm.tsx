"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LogIn, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
//Importamos el cliente de Supabase
import { supabase } from "../lib/supabase"; 

// 1. CORRECCIÓN: La interfaz ya no necesita el prop onLogin
interface LoginFormProps {
  // Ya no requiere props, maneja su propia autenticación
}

export function LoginForm({}: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Nuevo estado de carga

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    setIsLoading(false);

    if (error) {
      // 2. Manejo de errores detallado de Supabase Auth
      let errorMessage = "Error desconocido al iniciar sesión.";
      
      // La mayoría de los errores de credenciales devuelven 400 (Invalid login credentials)
      if (error.status === 400) {
        errorMessage = "Credenciales incorrectas o usuario no encontrado. Verifica tu email y contraseña.";
      } else {
        errorMessage = `Error: ${error.message}`;
      }
      
      toast.error(errorMessage);
    } 
    // Si no hay error, el `useEffect` en App.tsx detectará la sesión y redirigirá.
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-indigo-100 rounded-full">
              <LogIn className="w-8 h-8 text-indigo-600" />
            </div>
          </div>
          <CardTitle className="text-center">Iniciar Sesión</CardTitle>
          <CardDescription className="text-center">
            Ingresa tus credenciales para acceder al sistema de reservas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="w-4 h-4 mr-2" />
              )}
              {isLoading ? "Validando..." : "Iniciar Sesión"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
