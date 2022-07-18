import Web3 from "web3";
import { ethers } from "ethers";
import { toast } from "react-toastify";

import configEIP2771 from "./configs/EIP2771.json";
import configCustom_EIP712Sign from "./configs/Custom_EIP712Sign.json";
import configCustom_PersonalSign from "./configs/Custom_PersonalSign.json";

export { configEIP2771, configCustom_EIP712Sign, configCustom_PersonalSign };

export const getSignatureParametersWeb3 = (signature: any) => {
  const web3 = new Web3(window.ethereum as any);
  if (!web3.utils.isHexStrict(signature)) {
    throw new Error(
      'Given value "'.concat(signature, '" is not a valid hex string.')
    );
  }
  const r = signature.slice(0, 66);
  const s = "0x".concat(signature.slice(66, 130));
  let v = "0x".concat(signature.slice(130, 132));
  v = web3.utils.hexToNumber(v).toString();
  if (![27, 28].includes(Number(v))) v += 27;
  return {
    r: r,
    s: s,
    v: Number(v),
  };
};

export const getSignatureParametersEthers = (signature: any) => {
  if (!ethers.utils.isHexString(signature)) {
    throw new Error(
      'Given value "'.concat(signature, '" is not a valid hex string.')
    );
  }
  const r = signature.slice(0, 66);
  const s = "0x".concat(signature.slice(66, 130));
  let v = "0x".concat(signature.slice(130, 132));
  v = ethers.BigNumber.from(v).toString();
  if (![27, 28].includes(Number(v))) v += 27;
  return {
    r: r,
    s: s,
    v: Number(v),
  };
};

export type ExternalProvider = {
  isMetaMask?: boolean;
  isStatus?: boolean;
  host?: string;
  path?: string;
  sendAsync?: (
    request: { method: string; params?: Array<any> },
    callback: (error: any, response: any) => void
  ) => void;
  send?: (
    request: { method: string; params?: Array<any> },
    callback: (error: any, response: any) => void
  ) => void;
  request?: (request: { method: string; params?: Array<any> }) => Promise<any>;
};

export const showErrorMessage = (message: string) => {
  toast.error(message, {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: false,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
  });
};

export const showInfoMessage = (message: string) => {
  toast.info(message, {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
  });
};

export const showSuccessMessage = (message: string) => {
  toast.success(message, {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: false,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
  });
};

export const showSuccessMessagePending = (promise: Promise<void>) => {
  toast.promise(promise, {
    pending: "Promise is pending",
    success: "Promise resolved 👌",
    error: "Promise rejected 🤯",
  });
};
