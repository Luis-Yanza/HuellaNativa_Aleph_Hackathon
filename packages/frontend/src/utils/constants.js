import abi from './contractABI.json';

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0xA0712efD10a6C1f0D3f8a4426CAe12fB2e7A278d";
export const CONTRACT_ABI = abi.abi ? abi.abi : abi;