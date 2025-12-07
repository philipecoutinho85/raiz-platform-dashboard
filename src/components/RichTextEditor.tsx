import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Heading2,
  ImagePlus,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  images?: File[];
  onImagesChange?: (images: File[]) => void;
  maxImages?: number;
}

const RichTextEditor = ({
  value,
  onChange,
  placeholder = 'Digite seu conteúdo...',
  className,
  images = [],
  onImagesChange,
  maxImages = 5,
}: RichTextEditorProps) => {
  const [selection, setSelection] = useState({ start: 0, end: 0 });

  const handleTextareaSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    setSelection({
      start: target.selectionStart,
      end: target.selectionEnd,
    });
  };

  const insertFormatting = useCallback((prefix: string, suffix: string = prefix) => {
    const before = value.substring(0, selection.start);
    const selected = value.substring(selection.start, selection.end);
    const after = value.substring(selection.end);
    
    const newText = `${before}${prefix}${selected}${suffix}${after}`;
    onChange(newText);
  }, [value, selection, onChange]);

  const insertAtCursor = useCallback((text: string) => {
    const before = value.substring(0, selection.start);
    const after = value.substring(selection.end);
    onChange(`${before}${text}${after}`);
  }, [value, selection, onChange]);

  const formatBold = () => insertFormatting('**');
  const formatItalic = () => insertFormatting('*');
  const formatHeading = () => insertAtCursor('\n## ');
  const formatBulletList = () => insertAtCursor('\n- ');
  const formatNumberedList = () => insertAtCursor('\n1. ');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onImagesChange) return;
    
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > maxImages) {
      return;
    }
    onImagesChange([...images, ...files]);
  };

  const removeImage = (index: number) => {
    if (!onImagesChange) return;
    onImagesChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-1 border rounded-md bg-muted/30">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={formatBold}
          className="h-8 w-8 p-0"
          title="Negrito"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={formatItalic}
          className="h-8 w-8 p-0"
          title="Itálico"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <div className="w-px h-5 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={formatHeading}
          className="h-8 w-8 p-0"
          title="Subtítulo"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <div className="w-px h-5 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={formatBulletList}
          className="h-8 w-8 p-0"
          title="Lista com marcadores"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={formatNumberedList}
          className="h-8 w-8 p-0"
          title="Lista numerada"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        {onImagesChange && (
          <>
            <div className="w-px h-5 bg-border mx-1" />
            <label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                disabled={images.length >= maxImages}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                title="Adicionar imagem"
                disabled={images.length >= maxImages}
                asChild
              >
                <span>
                  <ImagePlus className="h-4 w-4" />
                </span>
              </Button>
            </label>
          </>
        )}
      </div>

      {/* Editor */}
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onSelect={handleTextareaSelect}
        placeholder={placeholder}
        className="min-h-[200px] resize-y font-mono text-sm"
      />

      {/* Images Preview */}
      {images.length > 0 && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((file, index) => (
            <div key={index} className="relative group">
              <img
                src={URL.createObjectURL(file)}
                alt=""
                className="w-full h-20 object-cover rounded-lg"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Help text */}
      <p className="text-xs text-muted-foreground">
        Use **texto** para negrito, *texto* para itálico, ## para subtítulo
      </p>
    </div>
  );
};

export default RichTextEditor;
