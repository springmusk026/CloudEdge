import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Bold, Italic, Underline as UnderlineIcon, Strikethrough, Code, Link as LinkIcon, List, ListOrdered, Quote, Heading2, Heading3, Image as ImageIcon, Minus, Undo, Redo, RemoveFormatting } from 'lucide-react';
import { useCallback } from 'react';

interface RichEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function RichEditor({ content, onChange, placeholder = 'Start writing...' }: RichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
      Link.configure({ openOnClick: false }),
      Image,
      Underline,
      Placeholder.configure({ placeholder }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: { class: 'prose prose-lg dark:prose-invert max-w-none min-h-[400px] focus:outline-none p-4' },
      handleDrop(view, event) {
        const file = event.dataTransfer?.files?.[0];
        if (file?.type.startsWith('image/')) { event.preventDefault(); uploadAndInsert(file); return true; }
        return false;
      },
      handlePaste(view, event) {
        const file = event.clipboardData?.files?.[0];
        if (file?.type.startsWith('image/')) { event.preventDefault(); uploadAndInsert(file); return true; }
        return false;
      },
    },
  });

  async function uploadAndInsert(file: File) {
    if (!editor) return;
    try {
      const token = localStorage.getItem('cloudedge-token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      headers['Content-Type'] = 'application/json';

      const { r2Key, uploadUrl } = await fetch('/api/v1/media/upload-url', {
        method: 'POST', headers, body: JSON.stringify({ filename: file.name, contentType: file.type, fileSize: file.size }),
      }).then(r => r.json()) as any;

      await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      await fetch('/api/v1/media/confirm', { method: 'POST', headers, body: JSON.stringify({ r2Key, filename: file.name, contentType: file.type, fileSize: file.size }) });

      editor.chain().focus().setImage({ src: `/${r2Key}` }).run();
    } catch (e) { console.error('Image upload failed:', e); }
  }

  const setLink = useCallback(() => {
    if (!editor) return;
    const url = window.prompt('URL', editor.getAttributes('link').href || '');
    if (url === null) return;
    if (url === '') { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    if (!editor) return;
    const url = window.prompt('Image URL');
    if (url) editor.chain().focus().setImage({ src: url }).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-2 border-b bg-muted/30">
        <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} icon={<Bold size={14} />} title="Bold" />
        <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} icon={<Italic size={14} />} title="Italic" />
        <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} icon={<UnderlineIcon size={14} />} title="Underline" />
        <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} icon={<Strikethrough size={14} />} title="Strikethrough" />
        <ToolBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} icon={<Code size={14} />} title="Code" />

        <Separator orientation="vertical" className="h-6 mx-1" />

        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} icon={<Heading2 size={14} />} title="Heading 2" />
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} icon={<Heading3 size={14} />} title="Heading 3" />

        <Separator orientation="vertical" className="h-6 mx-1" />

        <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} icon={<List size={14} />} title="Bullet List" />
        <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} icon={<ListOrdered size={14} />} title="Ordered List" />
        <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} icon={<Quote size={14} />} title="Quote" />
        <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} icon={<Minus size={14} />} title="Divider" />

        <Separator orientation="vertical" className="h-6 mx-1" />

        <ToolBtn onClick={setLink} active={editor.isActive('link')} icon={<LinkIcon size={14} />} title="Link" />
        <ToolBtn onClick={addImage} icon={<ImageIcon size={14} />} title="Image" />

        <Separator orientation="vertical" className="h-6 mx-1" />

        <ToolBtn onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} icon={<RemoveFormatting size={14} />} title="Clear formatting" />
        <ToolBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} icon={<Undo size={14} />} title="Undo" />
        <ToolBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} icon={<Redo size={14} />} title="Redo" />
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  );
}

function ToolBtn({ onClick, active, disabled, icon, title }: { onClick: () => void; active?: boolean; disabled?: boolean; icon: React.ReactNode; title: string }) {
  return (
    <Button variant={active ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" onClick={onClick} disabled={disabled} title={title} type="button">
      {icon}
    </Button>
  );
}
