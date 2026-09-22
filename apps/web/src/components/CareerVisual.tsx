import { useState } from "react";
import { careerContent } from "../data/careerContent";
import { useCareerTheme } from "../live/careerTheme";

// Visual genérico con identidad de carrera (degradado + icono + etiqueta).
// Reemplaza fotos fijas para que la imagen también cambie según tu carrera.
export function CareerVisual({
  label,
  className = "",
  iconClassName = "text-display",
}: {
  label?: string;
  className?: string;
  iconClassName?: string;
}) {
  const { career, accent } = useCareerTheme();
  const cc = careerContent(career);
  return (
    <div
      className={`flex flex-col items-center justify-center gap-space-xs text-center p-space-md ${className}`}
      style={{
        background: `linear-gradient(135deg, ${accent?.soft ?? "#ccfbf1"} 0%, #ffffff 100%)`,
      }}
    >
      <span
        className={`material-symbols-outlined ${iconClassName}`}
        style={{
          color: accent?.color ?? "#0f766e",
          fontVariationSettings: "'FILL' 1",
          fontSize: "3.5rem",
        }}
      >
        {cc.visualIcon}
      </span>
      {label && (
        <span className="font-label-md text-label-md font-bold" style={{ color: accent?.color ?? "#0f766e" }}>
          {label}
        </span>
      )}
    </div>
  );
}

// Foto temática por carrera con respaldo automático: si la imagen falla,
// se muestra el visual de carrera (degradado + icono) en su lugar.
export function CareerPhoto({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <CareerVisual className="absolute inset-0 h-full w-full" iconClassName="text-title-lg" />
      {!failed && src && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </div>
  );
}

// Avatar con inicial y color de carrera (para testimonios y tarjetas).
export function CareerAvatar({ name, className = "w-14 h-14" }: { name: string; className?: string }) {
  const { accent } = useCareerTheme();
  const initial = (name.trim().charAt(0) || "U").toUpperCase();
  return (
    <span
      className={`${className} rounded-full text-white flex items-center justify-center font-bold text-title-lg shrink-0 shadow-sm`}
      style={{ backgroundColor: accent?.color ?? "#0f766e" }}
      aria-hidden
    >
      {initial}
    </span>
  );
}
