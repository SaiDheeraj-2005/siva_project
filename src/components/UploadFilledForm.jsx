import React, { useRef } from "react";

export default function UploadFilledForm({ onUpload }) {
  const inputRef = useRef();

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  return (
    <div style={{ marginTop: 20 }}>
      <label>
        <b>Upload your filled PDF form:</b>
        <input
          type="file"
          accept="application/pdf"
          ref={inputRef}
          onChange={handleFileChange}
          style={{ marginLeft: 12 }}
        />
      </label>
    </div>
  );
}