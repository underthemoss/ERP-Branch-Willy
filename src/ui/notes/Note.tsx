"use client";

import "@blocknote/core/fonts/inter.css";
import type { BlockNoteEditor, PartialBlock } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import React from "react";

export type NoteProps = {
  initialContent?: PartialBlock[];
  readOnly?: boolean;
  onChange?: (blocks: PartialBlock[]) => void;
  className?: string;
};

const Note: React.FC<NoteProps> = ({ initialContent, readOnly = false, onChange, className }) => {
  const editor = useCreateBlockNote({ initialContent: initialContent });

  // When the editor changes, call onChange with the current document blocks
  const handleChange = () => {
    if (onChange) {
      onChange(editor.document);
    }
  };

  return (
    <div className={className}>
      <BlockNoteView
        editor={editor}
        onChange={handleChange}
        editable={!readOnly}
        sideMenu={false}
      />
    </div>
  );
};

export default Note;
