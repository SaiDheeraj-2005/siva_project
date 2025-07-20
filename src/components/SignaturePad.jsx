import React, { useRef } from "react";
import SignaturePad from "react-signature-canvas";

export default function SignaturePadComponent({ onEnd }) {
  const sigPadRef = useRef();

  const handleEnd = () => {
    const url = sigPadRef.current.getTrimmedCanvas().toDataURL("image/png");
    onEnd(url);
  };

  const handleClear = () => {
    sigPadRef.current.clear();
    onEnd("");
  };

  return (
    <div>
      <SignaturePad
        ref={sigPadRef}
        penColor="black"
        canvasProps={{ width: 400, height: 100, className: "border rounded" }}
        onEnd={handleEnd}
      />
      <button
        className="mt-1 px-3 py-1 bg-gray-300 rounded text-sm"
        type="button"
        onClick={handleClear}
      >
        Clear
      </button>
    </div>
  );
}