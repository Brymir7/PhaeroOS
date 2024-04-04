// custom.d.ts
import '@mui/material/styles';

declare module '@mui/material/styles' {
  interface PaletteColorOptions {
    text?: string;
    light?: string;
    main?: string;
    dark?: string;
    contrastText?: string;
    error?: string;
    success?: string;
    black?: string;
    verysad?: string;
    sad?: string;
    medium?: string;
    happy?: string;
    secondaryText?: string;
    veryhappy?: string;
    tertiaryText?: string;
  }

  interface PaletteColor {
    text?: string;
    light?: string;
    main?: string;
    dark?: string;
    contrastText?: string;
    error?: string;
    success?: string;
    black?: string;
    verysad?: string;
    sad?: string;
    medium?: string;
    happy?: string;
    veryhappy?: string;
    secondaryText?: string;
    tertiaryText?: string;
  }

  interface Palette {
    tertiary?: PaletteColor;
    ios: PaletteColor;
    android: PaletteColor;
    premium: PaletteColor;
  }

  interface PaletteOptions {
    tertiary?: PaletteColorOptions;
    ios?: PaletteColorOptions;
    android?: PaletteColorOptions;
    premium?: PaletteColorOptions;
    info?: PaletteColorOptions;
  }
}

declare module '@mui/material/styles' {
  interface ThemeOptions {
    iconSize?: {
      small: number;
      medium: number;
      large: number;
      habit: number;
    };
  }

  interface Theme {
    iconSize: {
      small: number;
      medium: number;
      large: number;
      habit: number;
    };
  }
}
