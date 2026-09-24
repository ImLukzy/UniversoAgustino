/** @type {import('tailwindcss').Config} */
// Colores: solo tokens de carrera (spec 05). Tipografía heredada del diseño original.
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: { extend: {
  "colors": {
    "primary": "rgb(var(--hub-p, 0 104 95) / <alpha-value>)",
    "primary-soft": "rgb(var(--hub-p-soft, 224 240 238) / <alpha-value>)",
    "primary-ink": "rgb(var(--hub-p-ink, 255 255 255) / <alpha-value>)"
  },
  "borderRadius": {
    "DEFAULT": "0.25rem",
    "lg": "0.5rem",
    "xl": "0.75rem",
    "full": "9999px"
  },
  "spacing": {
    "space-xs": "0.25rem",
    "space-md": "0.75rem"
  },
  "fontFamily": {
    "headline-lg-mobile": [
      "Plus Jakarta Sans"
    ],
    "headline-sm": [
      "Plus Jakarta Sans"
    ],
    "label-lg": [
      "Inter"
    ],
    "title-lg": [
      "Inter"
    ],
    "display": [
      "Plus Jakarta Sans"
    ],
    "body-lg": [
      "Inter"
    ],
    "title-md": [
      "Inter"
    ],
    "headline-md": [
      "Plus Jakarta Sans"
    ],
    "price-tag": [
      "Plus Jakarta Sans"
    ],
    "label-sm": [
      "Inter"
    ],
    "label-md": [
      "Inter"
    ],
    "body-md": [
      "Inter"
    ],
    "body-sm": [
      "Inter"
    ],
    "headline-lg": [
      "Plus Jakarta Sans"
    ]
  },
  "fontSize": {
    "headline-lg-mobile": [
      "26px",
      {
        "lineHeight": "34px",
        "letterSpacing": "-0.01em",
        "fontWeight": "700"
      }
    ],
    "headline-sm": [
      "20px",
      {
        "lineHeight": "28px",
        "fontWeight": "600"
      }
    ],
    "label-lg": [
      "14px",
      {
        "lineHeight": "20px",
        "letterSpacing": "0.01em",
        "fontWeight": "600"
      }
    ],
    "title-lg": [
      "18px",
      {
        "lineHeight": "26px",
        "fontWeight": "600"
      }
    ],
    "display": [
      "40px",
      {
        "lineHeight": "48px",
        "letterSpacing": "-0.02em",
        "fontWeight": "700"
      }
    ],
    "body-lg": [
      "16px",
      {
        "lineHeight": "24px",
        "fontWeight": "400"
      }
    ],
    "title-md": [
      "16px",
      {
        "lineHeight": "24px",
        "fontWeight": "600"
      }
    ],
    "headline-md": [
      "24px",
      {
        "lineHeight": "32px",
        "letterSpacing": "-0.01em",
        "fontWeight": "600"
      }
    ],
    "price-tag": [
      "20px",
      {
        "lineHeight": "24px",
        "letterSpacing": "-0.02em",
        "fontWeight": "700"
      }
    ],
    "label-sm": [
      "11px",
      {
        "lineHeight": "14px",
        "letterSpacing": "0.03em",
        "fontWeight": "600"
      }
    ],
    "label-md": [
      "12px",
      {
        "lineHeight": "16px",
        "letterSpacing": "0.02em",
        "fontWeight": "500"
      }
    ],
    "body-md": [
      "14px",
      {
        "lineHeight": "20px",
        "fontWeight": "400"
      }
    ],
    "body-sm": [
      "12px",
      {
        "lineHeight": "18px",
        "fontWeight": "400"
      }
    ],
    "headline-lg": [
      "32px",
      {
        "lineHeight": "40px",
        "letterSpacing": "-0.015em",
        "fontWeight": "700"
      }
    ]
  }
} },
  plugins: [],
};
