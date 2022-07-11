import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import Navbar from "./components/Navbar";
import Body from "./components/Body";

const App: React.FC = () => {
  const classes = useStyles();

  return (
    <div className={classes.bgCover}>
      <Navbar />
      <Body />
    </div>
  );
};

const useStyles = makeStyles(() => ({
  bgCover: {
    backgroundColor: "#fffef6",
    // backgroundImage: `url(img/bg-banana-1@2x.png)`,
    backgroundSize: "cover",
  },
}));

export default App;
