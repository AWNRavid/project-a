"use client";

import { Button } from "@/components/ui/button";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  BoldIcon,
  CodeIcon,
  ItalicIcon,
  ListIcon,
  ListOrderedIcon,
  QuoteIcon,
  SendIcon,
  StrikethroughIcon,
} from "lucide-react";

interface CommentEditorProps {
  onSubmit: (html: string) => Promise<void> | void;
  isSubmitting?: boolean;
  placeholder?: string;
}

export function CommentEditor({
  onSubmit,
  isSubmitting = false,
}: CommentEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-[80px] max-h-[220px] overflow-y-auto px-3 py-2.5 text-sm focus:outline-none text-slate-900 dark:text-slate-100",
      },
    },
  });

  const editorState = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => ({
      isEmpty: !currentEditor || currentEditor.getText().trim().length === 0,
      isBold: currentEditor?.isActive("bold") ?? false,
      isItalic: currentEditor?.isActive("italic") ?? false,
      isStrike: currentEditor?.isActive("strike") ?? false,
      isBulletList: currentEditor?.isActive("bulletList") ?? false,
      isOrderedList: currentEditor?.isActive("orderedList") ?? false,
      isBlockquote: currentEditor?.isActive("blockquote") ?? false,
      isCode: currentEditor?.isActive("code") ?? false,
    }),
  });

  if (!editor) {
    return null;
  }

  const isCommentEmpty = editorState?.isEmpty ?? true;

  const handleSubmit = async () => {
    if (isCommentEmpty || isSubmitting) return;
    const html = editor.getHTML();
    await onSubmit(html);
    editor.commands.clearContent();
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-xs focus-within:border-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:focus-within:border-slate-600">
      {/* Formatting Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-100 bg-slate-50/70 p-1.5 dark:border-slate-800 dark:bg-slate-900/60">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`h-7 w-7 p-0 ${editorState?.isBold ? "bg-slate-200 dark:bg-slate-800" : ""}`}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          <BoldIcon className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`h-7 w-7 p-0 ${editorState?.isItalic ? "bg-slate-200 dark:bg-slate-800" : ""}`}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <ItalicIcon className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`h-7 w-7 p-0 ${editorState?.isStrike ? "bg-slate-200 dark:bg-slate-800" : ""}`}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Strikethrough"
        >
          <StrikethroughIcon className="size-3.5" />
        </Button>
        <div className="mx-1 h-4 w-px bg-slate-200 dark:bg-slate-800" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`h-7 w-7 p-0 ${editorState?.isBulletList ? "bg-slate-200 dark:bg-slate-800" : ""}`}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet List"
        >
          <ListIcon className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`h-7 w-7 p-0 ${editorState?.isOrderedList ? "bg-slate-200 dark:bg-slate-800" : ""}`}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered List"
        >
          <ListOrderedIcon className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`h-7 w-7 p-0 ${editorState?.isBlockquote ? "bg-slate-200 dark:bg-slate-800" : ""}`}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Quote"
        >
          <QuoteIcon className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`h-7 w-7 p-0 ${editorState?.isCode ? "bg-slate-200 dark:bg-slate-800" : ""}`}
          onClick={() => editor.chain().focus().toggleCode().run()}
          title="Inline Code"
        >
          <CodeIcon className="size-3.5" />
        </Button>
      </div>

      {/* Tiptap Content Area */}
      <div className="comment-editor-content">
        <EditorContent editor={editor} />
      </div>

      {/* Editor Action Footer */}
      <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2 dark:border-slate-800">
        <span className="text-muted-foreground text-xs">
          Rich text supported
        </span>
        <Button
          type="button"
          size="sm"
          disabled={isCommentEmpty || isSubmitting}
          onClick={handleSubmit}
          className="h-8 gap-1.5 px-3 text-xs"
        >
          <SendIcon className="size-3.5" />
          {isSubmitting ? "Posting..." : "Comment"}
        </Button>
      </div>
    </div>
  );
}
