"use client";

import React from "react";
import { FullPageError, type FullPageErrorProps } from "./FullPageError";

export interface SomethingWentWrongProps extends Omit<FullPageErrorProps, "variant"> {}

/**
 * SomethingWentWrong: Full-page error screen for server/connection failures.
 * Features CloudOff icon, "Something went wrong", "We could not connect to the server...", and Retry button.
 */
export const SomethingWentWrong: React.FC<SomethingWentWrongProps> = (props) => {
  return <FullPageError variant="connection" {...props} />;
};

export default SomethingWentWrong;
