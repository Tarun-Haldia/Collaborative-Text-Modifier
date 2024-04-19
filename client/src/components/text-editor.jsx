import React, { useCallback, useEffect, useState, useRef } from "react";
import "react-quill/dist/quill.snow.css";
import io from "socket.io-client";
import { useParams, Link } from "react-router-dom";
import { QuillBinding } from "y-quill";
import Quill from "quill";
import QuillCursors from "quill-cursors";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import "./styles.css";

const toolbarOptions = [
    ["bold", "italic", "underline", "strike"], // toggled buttons
    ["blockquote", "code-block"],
    ["link", "image", "video", "formula"],

    [{ header: [1, 2, 3, 4, 5, 6, false] }], // custom button values
    [{ list: "ordered" }, { list: "bullet" }, { list: "check" }],
    [{ script: "sub" }, { script: "super" }], // superscript/subscript
    [{ indent: "-1" }, { indent: "+1" }], // outdent/indent
    [{ direction: "rtl" }], // text direction

    [{ size: ["small", false, "large", "huge"] }], // custom dropdown

    [{ color: [] }, { background: [] }], // dropdown with defaults from theme
    [{ font: [] }],
    [{ align: [] }],

    ["clean"], // remove formatting button
];

function TextEditor() {
    const { id: documentId } = useParams();
    const [socket, setSocket] = useState(null);
    const quillRef = useRef(null);
    
    const base_url = location.href.split('/')[2]

    // connecting the socket.io
    useEffect(() => {
        const s = io("https://collaborative-text-editor-5k3t.onrender.com/");
        // const s = io("http://127.0.0.1:3001");

        setSocket(s);

        return () => {
            s.disconnect();
        };
    }, []);

    // sending the data to the same id
    useEffect(() => {
        if (socket == null || quillRef == null) return;
        socket.once("load-document", (document) => {
            quillRef.current.setContents(document);
            quillRef.current.enable();
        });
        socket.emit("get-document", documentId);
    }, [socket, quillRef, documentId]);

    // for sending the data to server
    useEffect(() => {
        if (socket == null || quillRef == null) return;

        const quill = quillRef.current;
        const handler = (delta, oldDelta, source) => {
            if (source !== "user") return;
            socket.emit("send-changes", delta);
        };
        quill.on("text-change", handler);
        return () => {
            quill.off("text-change", handler);
        };
    }, [socket, quillRef]);

    // for recieving the chnages from server
    useEffect(() => {
        if (socket == null || quillRef == null) return;

        const quill = quillRef.current;

        const handler = (delta) => {
            quill.updateContents(delta);
        };
        socket.on("receive-changes", handler);
        return () => {
            socket.off("receive-changes", handler);
        };
    }, [socket, quillRef]);

    // for saving the data
    useEffect(() => {
        if (socket == null || quillRef == null) return;

        const interval = setInterval(() => {
            socket.emit("save-data", quillRef.current.getContents());
        }, 200);

        return () => {
            clearInterval(interval);
        };
    }, [socket, quillRef]);

    // show the canvas for editing
    const wrapper = useCallback(
        (wrapper) => {
            if (wrapper == null) return;

            wrapper.innerHTML = "";

            const editor = document.createElement("div");
            wrapper.append(editor);

            Quill.register("modules/cursors", QuillCursors);

            const ydoc = new Y.Doc();
            const provider = new WebsocketProvider(
                `ws://${base_url}/documents/${documentId}`,
                "",
                ydoc
            );
            const type = ydoc.getText("quill");

            const q = new Quill(editor, {
                modules: {
                    toolbar: toolbarOptions,
                    cursors: true,
                },
                theme: "snow",
            });

            const binding = new QuillBinding(type, q, provider.awareness);
            quillRef.current = q;
        },
        [documentId]
    );


    function handleClick() {
        navigator.clipboard.writeText(location.href);
    }

    return (
        <>
            <div className="btn-container">
                {" "}
                {/* Corrected */}
                <div>
                    <button className="copy-button btn" onClick={handleClick}>
                        <span>
                            <svg
                                viewBox="0 0 467 512.22"
                                clipRule="evenodd"
                                fillRule="evenodd"
                                imageRendering="optimizeQuality"
                                textRendering="geometricPrecision"
                                shapeRendering="geometricPrecision"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="#fff"
                                height="12"
                                width="12"
                            >
                                <path
                                    d="M131.07 372.11c.37 1 .57 2.08.57 3.2 0 1.13-.2 2.21-.57 3.21v75.91c0 10.74 4.41 20.53 11.5 27.62s16.87 11.49 27.62 11.49h239.02c10.75 0 20.53-4.4 27.62-11.49s11.49-16.88 11.49-27.62V152.42c0-10.55-4.21-20.15-11.02-27.18l-.47-.43c-7.09-7.09-16.87-11.5-27.62-11.5H170.19c-10.75 0-20.53 4.41-27.62 11.5s-11.5 16.87-11.5 27.61v219.69zm-18.67 12.54H57.23c-15.82 0-30.1-6.58-40.45-17.11C6.41 356.97 0 342.4 0 326.52V57.79c0-15.86 6.5-30.3 16.97-40.78l.04-.04C27.51 6.49 41.94 0 57.79 0h243.63c15.87 0 30.3 6.51 40.77 16.98l.03.03c10.48 10.48 16.99 24.93 16.99 40.78v36.85h50c15.9 0 30.36 6.5 40.82 16.96l.54.58c10.15 10.44 16.43 24.66 16.43 40.24v302.01c0 15.9-6.5 30.36-16.96 40.82-10.47 10.47-24.93 16.97-40.83 16.97H170.19c-15.9 0-30.35-6.5-40.82-16.97-10.47-10.46-16.97-24.92-16.97-40.82v-69.78zM340.54 94.64V57.79c0-10.74-4.41-20.53-11.5-27.63-7.09-7.08-16.86-11.48-27.62-11.48H57.79c-10.78 0-20.56 4.38-27.62 11.45l-.04.04c-7.06 7.06-11.45 16.84-11.45 27.62v268.73c0 10.86 4.34 20.79 11.38 27.97 6.95 7.07 16.54 11.49 27.17 11.49h55.17V152.42c0-15.9 6.5-30.35 16.97-40.82 10.47-10.47 24.92-16.96 40.82-16.96h170.35z"
                                    fillRule="nonzero"
                                ></path>
                            </svg>{" "}
                            Copy link
                        </span>
                        <span>Copied</span>
                    </button>
                </div>
                <div>
                    <Link to="/" target="_blank" style={{ textDecoration: "none" }}>
                        <button className="create-button">
                            Create New File
                            <svg
                                fill="currentColor"
                                viewBox="0 0 24 24"
                                className="icon"
                            >
                                <path
                                    clipRule="evenodd"
                                    d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm4.28 10.28a.75.75 0 000-1.06l-3-3a.75.75 0 10-1.06 1.06l1.72 1.72H8.25a.75.75 0 000 1.5h5.69l-1.72 1.72a.75.75 0 101.06 1.06l3-3z"
                                    fillRule="evenodd"
                                ></path>
                            </svg>
                        </button>
                    </Link>
                </div>
            </div>
            <div className="container" ref={wrapper}></div>;
        </>
    );
}

export default TextEditor;
