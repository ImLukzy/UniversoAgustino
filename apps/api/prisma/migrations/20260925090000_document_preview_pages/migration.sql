-- Páginas de muestra elegidas por el vendedor (spec 16). Aditiva: las filas
-- existentes conservan la vista previa histórica (páginas 1 y 2).
ALTER TABLE "Document" ADD COLUMN "previewPages" INTEGER[] NOT NULL DEFAULT ARRAY[1, 2]::INTEGER[];
