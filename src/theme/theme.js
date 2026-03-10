import { createTheme } from "@mui/material";
import themeTypography from "./themeTypography";

export const theme = () => {
    const appTheme = createTheme({
        direction: 'ltr',
        typography: themeTypography(),
        palette: {
            primary: {
                main: '#406eb4',
            },
            text: {
                primary: '#2c2c2b',
                secondary: '#86837e',
            },
        },
    });
    return appTheme;
};

export default theme;