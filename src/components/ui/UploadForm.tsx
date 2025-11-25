"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function UploadForm({ onSubmit }: { onSubmit: (text: string) => void }) {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    if (!value.trim()) return;
    onSubmit(value);
    setValue("");
  };

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>Agregar marca de agua</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <Textarea
          placeholder="Escribe el texto de la marca de agua..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />

        <Button className="w-full" onClick={handleSubmit}>
          Procesar
        </Button>
      </CardContent>
    </Card>
  );
}
