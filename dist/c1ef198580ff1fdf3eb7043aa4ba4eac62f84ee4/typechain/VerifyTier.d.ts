/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import {
  ethers,
  EventFilter,
  Signer,
  BigNumber,
  BigNumberish,
  PopulatedTransaction,
} from "ethers";
import {
  Contract,
  ContractTransaction,
  Overrides,
  CallOverrides,
} from "@ethersproject/contracts";
import { BytesLike } from "@ethersproject/bytes";
import { Listener, Provider } from "@ethersproject/providers";
import { FunctionFragment, EventFragment, Result } from "@ethersproject/abi";

interface VerifyTierInterface extends ethers.utils.Interface {
  functions: {
    "report(address)": FunctionFragment;
    "setTier(address,uint8,bytes)": FunctionFragment;
    "verify()": FunctionFragment;
  };

  encodeFunctionData(functionFragment: "report", values: [string]): string;
  encodeFunctionData(
    functionFragment: "setTier",
    values: [string, BigNumberish, BytesLike]
  ): string;
  encodeFunctionData(functionFragment: "verify", values?: undefined): string;

  decodeFunctionResult(functionFragment: "report", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "setTier", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "verify", data: BytesLike): Result;

  events: {
    "TierChange(address,uint8,uint8)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "TierChange"): EventFragment;
}

export class VerifyTier extends Contract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  on(event: EventFilter | string, listener: Listener): this;
  once(event: EventFilter | string, listener: Listener): this;
  addListener(eventName: EventFilter | string, listener: Listener): this;
  removeAllListeners(eventName: EventFilter | string): this;
  removeListener(eventName: any, listener: Listener): this;

  interface: VerifyTierInterface;

  functions: {
    report(account_: string, overrides?: CallOverrides): Promise<[BigNumber]>;

    "report(address)"(
      account_: string,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    setTier(
      arg0: string,
      arg1: BigNumberish,
      arg2: BytesLike,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    "setTier(address,uint8,bytes)"(
      arg0: string,
      arg1: BigNumberish,
      arg2: BytesLike,
      overrides?: Overrides
    ): Promise<ContractTransaction>;

    verify(overrides?: CallOverrides): Promise<[string]>;

    "verify()"(overrides?: CallOverrides): Promise<[string]>;
  };

  report(account_: string, overrides?: CallOverrides): Promise<BigNumber>;

  "report(address)"(
    account_: string,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  setTier(
    arg0: string,
    arg1: BigNumberish,
    arg2: BytesLike,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  "setTier(address,uint8,bytes)"(
    arg0: string,
    arg1: BigNumberish,
    arg2: BytesLike,
    overrides?: Overrides
  ): Promise<ContractTransaction>;

  verify(overrides?: CallOverrides): Promise<string>;

  "verify()"(overrides?: CallOverrides): Promise<string>;

  callStatic: {
    report(account_: string, overrides?: CallOverrides): Promise<BigNumber>;

    "report(address)"(
      account_: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    setTier(
      arg0: string,
      arg1: BigNumberish,
      arg2: BytesLike,
      overrides?: CallOverrides
    ): Promise<void>;

    "setTier(address,uint8,bytes)"(
      arg0: string,
      arg1: BigNumberish,
      arg2: BytesLike,
      overrides?: CallOverrides
    ): Promise<void>;

    verify(overrides?: CallOverrides): Promise<string>;

    "verify()"(overrides?: CallOverrides): Promise<string>;
  };

  filters: {
    TierChange(
      account: string | null,
      startTier: BigNumberish | null,
      endTier: BigNumberish | null
    ): EventFilter;
  };

  estimateGas: {
    report(account_: string, overrides?: CallOverrides): Promise<BigNumber>;

    "report(address)"(
      account_: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    setTier(
      arg0: string,
      arg1: BigNumberish,
      arg2: BytesLike,
      overrides?: Overrides
    ): Promise<BigNumber>;

    "setTier(address,uint8,bytes)"(
      arg0: string,
      arg1: BigNumberish,
      arg2: BytesLike,
      overrides?: Overrides
    ): Promise<BigNumber>;

    verify(overrides?: CallOverrides): Promise<BigNumber>;

    "verify()"(overrides?: CallOverrides): Promise<BigNumber>;
  };

  populateTransaction: {
    report(
      account_: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    "report(address)"(
      account_: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    setTier(
      arg0: string,
      arg1: BigNumberish,
      arg2: BytesLike,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    "setTier(address,uint8,bytes)"(
      arg0: string,
      arg1: BigNumberish,
      arg2: BytesLike,
      overrides?: Overrides
    ): Promise<PopulatedTransaction>;

    verify(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    "verify()"(overrides?: CallOverrides): Promise<PopulatedTransaction>;
  };
}