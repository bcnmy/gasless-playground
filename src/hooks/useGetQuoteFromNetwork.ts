import { useEffect, useState, useCallback } from "react";
import { useNetwork, useContract, useSigner } from "wagmi";

/**
 * Fetch quote hook to be updated on connecting supported networks
 */
const useGetQuoteFromNetwork = (address: string, abi: any) => {
  const { data: signer } = useSigner();
  const { chain } = useNetwork();

  const [isFetchingQuote, setIsFetchingQuote] = useState(false);
  const [quote, setQuote] = useState("This is a default quote");
  const [owner, setOwner] = useState("Default Owner Address");

  const contract = useContract({
    addressOrName: address,
    contractInterface: abi,
    signerOrProvider: signer,
  });

  const fetchQuote = useCallback(async () => {
    try {
      setIsFetchingQuote(true);
      const res = await contract.getQuote();
      setQuote(res.currentQuote);
      setOwner(res.currentOwner);
      setIsFetchingQuote(false);
    } catch (err: any) {
      console.error(err);
      setIsFetchingQuote(false);
    }
  }, [contract]);

  useEffect(() => {
    if (chain && !chain.unsupported && signer) fetchQuote();
  }, [chain, signer, contract, fetchQuote]);

  return { fetchQuote, quote, owner, isFetchingQuote };
};

export default useGetQuoteFromNetwork;
