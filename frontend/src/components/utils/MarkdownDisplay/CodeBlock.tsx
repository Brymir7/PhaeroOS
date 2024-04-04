import React from "react";

export const CodeBlock = ({ children }: {children: React.ReactNode}) => (
  <pre
    style={{
      backgroundColor: "lightgrey",
      color: "#000000",
      paddingLeft: "8px",
      paddingTop: "5px",
      paddingBottom: "5px",
      paddingRight: "8px",
      fontFamily: "monospace",
      borderRadius: "8px",
      overflowX: "auto",
      textWrap: "wrap",
      marginTop: "4px",
    }}
  >
    {children}
  </pre>
);
