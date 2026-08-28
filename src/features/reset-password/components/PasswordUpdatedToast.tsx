"use client";

import React from "react";
import BottomToast, { BottomToastProps } from "@/shared/commonComponents/BottomToast";

export interface PasswordUpdatedToastProps extends Omit<BottomToastProps, "message"> {
  message?: string;
}

export const PasswordUpdatedToast: React.FC<PasswordUpdatedToastProps> = ({
  message = "Password updated",
  ...props
}) => {
  return <BottomToast message={message} {...props} />;
};

export default PasswordUpdatedToast;

