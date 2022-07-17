import React from "react";
import { Snackbar, makeStyles } from "@material-ui/core";
import MuiAlert, { AlertProps } from "@material-ui/lab/Alert";

type Props = {
  type: "error" | "success" | "warning";
  message: string;
};

function Alert(props: AlertProps) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

const Notification: React.FC<Props> = (type, message) => {
  const [open, setOpen] = React.useState(true);

  const handleClose = (event?: React.SyntheticEvent, reason?: string) => {
    if (reason === "clickaway") {
      return;
    }
    setOpen(false);
  };

  return (
    <Snackbar
      open={open}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
      autoHideDuration={6000}
      onClose={handleClose}
    >
      <Alert onClose={handleClose} severity="success">
        This is a success message!
      </Alert>
    </Snackbar>
  );
};

export default Notification;

const useStyles = makeStyles((theme) => ({
  
}));
