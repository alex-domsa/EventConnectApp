import React, { useState, useRef, useCallback } from "react";
import { BACKEND_URL } from "../config.js";

export default function ImageDragAndDrop({ onUploadedUrl }) {
    const [dragging, setDragging] = useState(false);
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [uploadedUrl, setUploadedUrl] = useState(null);
    const inputRef = useRef();

    const isValidImage = (f) =>
        f && (f.type === "image/jpeg" || f.type === "image/png");

    const handleFiles = useCallback((files) => {
        setError(null);
        if (!files || !files.length) return;
        const f = files[0];
        if (!isValidImage(f)) {
            setError("Only JPG or PNG images are allowed.");
            return;
        }
        setFile(f);
        // auto upload after selection/drop:
        uploadToSpaces(f).catch((e) => setError(String(e)));
    }, []);

    const onDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
    };

    const onDragOver = (e) => {
        e.preventDefault();
        setDragging(true);
    };

    const onDragLeave = (e) => {
        e.preventDefault();
        setDragging(false);
    };

    const onChange = (e) => {
        handleFiles(e.target.files);
        // reset input so same file can be selected again if needed
        e.target.value = "";
    };

    async function uploadToSpaces(file) {
        setUploading(true);
        setError(null);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${BACKEND_URL}/api/data/presign`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const text = await response.text();
                console.error('Server response:', text);
                throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
            }

            // parse JSON directly
            const data = await response.json();
            const publicUrl = data.publicUrl;
            setUploadedUrl(publicUrl);
            // inform parent component
            if (typeof onUploadedUrl === 'function') {
                try { onUploadedUrl(publicUrl); } catch (e) { /* ignore */ }
            }
            return publicUrl;
        } catch (err) {
            console.error('Upload error:', err);
            setError(err.message);
            throw err;
        } finally {
            setUploading(false);
        }
    }

    return (
        <div style={{ maxWidth: 420 }}>
            <div
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                style={{
                    border: "2px dashed #bbb",
                    borderRadius: 8,
                    padding: 20,
                    textAlign: "center",
                    background: dragging ? "#f0f8ff" : "#fff",
                    cursor: "pointer",
                }}
                onClick={() => inputRef.current && inputRef.current.click()}
                role="button"
                tabIndex={0}
            >
                <input ref={inputRef} type="file" accept="image/png,image/jpeg" style={{ display: 'none' }} onChange={onChange} />
                <div style={{ fontSize: 14, color: "#333" }}>
                    {file ? (
                        <>
                            <div style={{ marginBottom: 8 }}>{file.name}</div>
                            <img
                                src={URL.createObjectURL(file)}
                                alt="preview"
                                style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 6 }}
                            />
                        </>
                    ) : (
                        <>
                            <div style={{ fontWeight: 600, marginBottom: 6 }}>
                                Drag & drop an image here
                            </div>
                            <div style={{ fontSize: 12, color: "#666" }}>
                                or click to select a JPG/PNG file
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ fontSize: 13, color: "#666" }}>
                    {uploading ? "Uploading..." : uploadedUrl ? "Image uploaded" : (file ? "Ready to upload" : "No file selected")}
                </div>
                {uploadedUrl && (
                    <a href={uploadedUrl} target="_blank" rel="noreferrer" style={{ fontSize: 13 }}>
                        View
                    </a>
                )}
            </div>

            {error && (
                <div style={{ marginTop: 10, color: "crimson", fontSize: 13 }}>{error}</div>
            )}
        </div>
    );
}