import { createTheme } from "@material-ui/core/styles";

const theme = createTheme({
  overrides: {
  },
  typography: {
    fontFamily: ['"Mochiy Pop One"', "sans-serif"].join(","),

    h1: {
      fontWeight: 400,
      fontSize: "2.5rem",
      lineHeight: "normal",
      letterSpacing: "normal",
    },
  },
  palette: {
    primary: {
      main: "#7167D9",
    },
  },
});

export default theme;
