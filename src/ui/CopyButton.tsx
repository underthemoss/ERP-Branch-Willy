import React, { useState } from "react";
import Button, { ButtonProps } from "@mui/joy/Button";
import { Check } from "@mui/icons-material";

const CopyButton: React.FC<
  {
    copyValue: string;
  } & ButtonProps
> = ({ copyValue, ...props }) => {
  const [isCopied, setIsCopied] = useState(false);
  const handleCopy = () => {
    // Replace this string with whatever text you want to copy

    navigator.clipboard
      .writeText(copyValue)
      .then(() => setIsCopied(true))
      .then(() => setTimeout(() => setIsCopied(false), 1000))
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  };

  return (
    <Button
      variant="solid"
      color="primary"
      onClick={handleCopy}
      {...props}
      {...(isCopied
        ? {
            children: (
              <>
                {props.children}
                <Check />
              </>
            ),
          }
        : {})}
    />
  );
};

export default CopyButton;
