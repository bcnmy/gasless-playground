import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import Navbar from "./components/Navbar";
import Body from "./components/TabsBody";
import { ToastContainer } from "react-toastify";

const App: React.FC = () => {
  const classes = useStyles();

  return (
    <div className={classes.bgCover}>
      <Navbar />
      <Body />
      <ToastContainer />
    </div>
  );
};

const useStyles = makeStyles(() => ({
  bgCover: {
    backgroundColor: "#fffef6",
    width: "100%",
    minHeight: "100vh",
  },
}));

export default App;
