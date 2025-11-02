import { Button } from '@/components/ui/button';
import { Share2, Facebook, Twitter, Linkedin, Send } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

interface SocialShareProps {
  title: string;
  description: string;
  url: string;
}

const SocialShare = ({ title, description, url }: SocialShareProps) => {
  const { toast } = useToast();
  const shareUrl = encodeURIComponent(url);
  const shareTitle = encodeURIComponent(title);
  const shareText = encodeURIComponent(description);

  const handleShare = (platform: string, shareLink: string) => {
    window.open(shareLink, '_blank', 'width=600,height=400');
    toast({
      title: "Compartilhado!",
      description: `Projeto compartilhado no ${platform}`,
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copiado!",
      description: "Link do projeto copiado para a área de transferência.",
    });
  };

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`,
    whatsapp: `https://wa.me/?text=${shareTitle}%20${shareUrl}`,
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="w-4 h-4" />
          Compartilhar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => handleShare('Facebook', shareLinks.facebook)}>
          <Facebook className="w-4 h-4 mr-2" />
          Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('Twitter', shareLinks.twitter)}>
          <Twitter className="w-4 h-4 mr-2" />
          Twitter
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('LinkedIn', shareLinks.linkedin)}>
          <Linkedin className="w-4 h-4 mr-2" />
          LinkedIn
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('WhatsApp', shareLinks.whatsapp)}>
          <Send className="w-4 h-4 mr-2" />
          WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={copyToClipboard}>
          <Share2 className="w-4 h-4 mr-2" />
          Copiar Link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SocialShare;
