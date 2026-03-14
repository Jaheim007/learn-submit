import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { cn } from '@/lib/utils';
import { 
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered, AlignLeft, AlignCenter, AlignRight,
  Heading1, Heading2, Heading3, Quote, Minus, Undo, Redo,
  ImageIcon, LinkIcon, Upload, X, Link2
} from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';
import { useEffect, useCallback, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

// ---- Image Insert Modal ----
function ImageInsertModal({ 
  open, onClose, onInsert 
}: { open: boolean; onClose: () => void; onInsert: (src: string) => void }) {
  const [url, setUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      onInsert(base64);
      setUploading(false);
      setUrl('');
    };
    reader.readAsDataURL(file);
  };

  const handleUrlInsert = () => {
    if (url.trim()) {
      onInsert(url.trim());
      setUrl('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-background border rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Insérer une image</h3>
          </div>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-muted transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <Tabs defaultValue="upload" className="p-5">
          <TabsList className="w-full">
            <TabsTrigger value="upload" className="flex-1 gap-2">
              <Upload className="h-4 w-4" /> Depuis l'appareil
            </TabsTrigger>
            <TabsTrigger value="url" className="flex-1 gap-2">
              <Link2 className="h-4 w-4" /> URL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-4 space-y-4">
            <div 
              className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-foreground">Cliquez pour choisir une image</p>
              <p className="text-xs text-muted-foreground mt-1">JPG, PNG, GIF, WebP</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFile}
            />
            {uploading && (
              <p className="text-sm text-muted-foreground text-center">Chargement...</p>
            )}
          </TabsContent>

          <TabsContent value="url" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>URL de l'image</Label>
              <Input
                placeholder="https://exemple.com/image.jpg"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleUrlInsert(); } }}
              />
            </div>
            <Button onClick={handleUrlInsert} disabled={!url.trim()} className="w-full">
              Insérer
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ---- Link Insert Modal ----
function LinkInsertModal({ 
  open, onClose, onInsert, initialUrl 
}: { open: boolean; onClose: () => void; onInsert: (url: string) => void; initialUrl?: string }) {
  const [url, setUrl] = useState(initialUrl || '');

  useEffect(() => { if (open) setUrl(initialUrl || ''); }, [open, initialUrl]);

  if (!open) return null;

  const handleInsert = () => {
    onInsert(url.trim());
    setUrl('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-background border rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Insérer un lien</h3>
          </div>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-muted transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="space-y-2">
            <Label>URL du lien</Label>
            <Input
              placeholder="https://exemple.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleInsert(); } }}
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            {initialUrl && (
              <Button variant="destructive" onClick={() => onInsert('')} className="flex-1">
                Supprimer le lien
              </Button>
            )}
            <Button onClick={handleInsert} disabled={!url.trim()} className="flex-1">
              {initialUrl ? 'Modifier' : 'Insérer'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RichTextEditor({ value, onChange, placeholder = 'Commencez à écrire...', className, minHeight = '160px' }: RichTextEditorProps) {
  const [showImageModal, setShowImageModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder }),
      Image.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          style: 'max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0;',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          style: 'color: #c7253e; text-decoration: underline;',
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm dark:prose-invert max-w-none focus:outline-none px-4 py-3',
          'prose-headings:font-semibold prose-h1:text-xl prose-h2:text-lg prose-h3:text-base',
          'prose-p:text-sm prose-p:leading-relaxed prose-li:text-sm',
          'prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground',
          'prose-img:rounded-lg prose-img:max-w-full',
        ),
        style: `min-height: ${minHeight}`,
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML() && !editor.isFocused) {
      editor.commands.setContent(value || '');
    }
  }, [value, editor]);

  const handleImageInsert = useCallback((src: string) => {
    if (!editor || !src) return;
    editor.chain().focus().setImage({ src }).run();
    setShowImageModal(false);
  }, [editor]);

  const handleLinkInsert = useCallback((url: string) => {
    if (!editor) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
    setShowLinkModal(false);
  }, [editor]);

  if (!editor) return null;

  const ToolbarButton = ({ 
    onClick, isActive, children, title 
  }: { onClick: () => void; isActive?: boolean; children: React.ReactNode; title: string }) => (
    <Toggle
      size="sm"
      pressed={isActive}
      onPressedChange={() => onClick()}
      title={title}
      className="h-8 w-8 p-0 data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
    >
      {children}
    </Toggle>
  );

  return (
    <>
      <div className={cn('rounded-xl border bg-background overflow-hidden', className)}>
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b bg-muted/30">
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} title="Titre 1">
            <Heading1 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} title="Titre 2">
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })} title="Titre 3">
            <Heading3 className="h-4 w-4" />
          </ToolbarButton>

          <Separator orientation="vertical" className="h-6 mx-1" />

          <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Gras">
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Italique">
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="Souligné">
            <UnderlineIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} title="Barré">
            <Strikethrough className="h-4 w-4" />
          </ToolbarButton>

          <Separator orientation="vertical" className="h-6 mx-1" />

          <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Liste à puces">
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="Liste numérotée">
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} title="Citation">
            <Quote className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Ligne horizontale">
            <Minus className="h-4 w-4" />
          </ToolbarButton>

          <Separator orientation="vertical" className="h-6 mx-1" />

          <ToolbarButton onClick={() => setShowLinkModal(true)} isActive={editor.isActive('link')} title="Insérer un lien">
            <LinkIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => setShowImageModal(true)} title="Insérer une image">
            <ImageIcon className="h-4 w-4" />
          </ToolbarButton>

          <Separator orientation="vertical" className="h-6 mx-1" />

          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} title="Aligner à gauche">
            <AlignLeft className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} title="Centrer">
            <AlignCenter className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} title="Aligner à droite">
            <AlignRight className="h-4 w-4" />
          </ToolbarButton>

          <div className="flex-1" />

          <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Annuler">
            <Undo className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Rétablir">
            <Redo className="h-4 w-4" />
          </ToolbarButton>
        </div>

        {/* Editor content */}
        <EditorContent editor={editor} />
      </div>

      <ImageInsertModal 
        open={showImageModal} 
        onClose={() => setShowImageModal(false)} 
        onInsert={handleImageInsert} 
      />
      <LinkInsertModal 
        open={showLinkModal} 
        onClose={() => setShowLinkModal(false)} 
        onInsert={handleLinkInsert}
        initialUrl={editor.getAttributes('link').href}
      />
    </>
  );
}

/** Read-only renderer for rich text HTML content */
export function RichTextRenderer({ content, className }: { content: string; className?: string }) {
  if (!content) return null;
  
  const isPlainText = !/<[^>]+>/.test(content);
  
  if (isPlainText) {
    return (
      <p className={cn('text-sm leading-relaxed whitespace-pre-wrap', className)}>
        {content}
      </p>
    );
  }

  return (
    <div 
      className={cn(
        'prose prose-sm dark:prose-invert max-w-none',
        'prose-headings:font-semibold prose-h1:text-xl prose-h2:text-lg prose-h3:text-base',
        'prose-p:text-sm prose-p:leading-relaxed prose-li:text-sm',
        'prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground',
        'prose-img:rounded-lg prose-img:max-w-full',
        '[&_p]:mb-3 [&_br]:block [&_br]:content-[""] [&_br]:mb-2',
        className
      )}
      dangerouslySetInnerHTML={{ __html: content }} 
    />
  );
}