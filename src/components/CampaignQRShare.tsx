import { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Download, QrCode, Share2, Check, Hash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CampaignQRShareProps {
  shortId: number;
  projectTitle: string;
  compact?: boolean;
}

const CampaignQRShare = ({ shortId, projectTitle, compact = false }: CampaignQRShareProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const baseUrl = window.location.origin;
  const shortUrl = `${baseUrl}/c/${shortId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      toast({
        title: "Link copiado!",
        description: "O link da campanha foi copiado para a área de transferência."
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o link.",
        variant: "destructive"
      });
    }
  };

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(shortId.toString());
      toast({
        title: "ID copiado!",
        description: `O ID ${shortId} foi copiado para a área de transferência.`
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o ID.",
        variant: "destructive"
      });
    }
  };

  const handleDownloadQR = () => {
    if (!qrRef.current) return;

    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;

    // Create canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const svgData = new XMLSerializer().serializeToString(svg);
    const qrImg = new Image();
    const logoImg = new Image();

    // Set canvas size with padding
    const size = 300;
    const padding = 20;
    canvas.width = size + padding * 2;
    canvas.height = size + padding * 2 + 60; // Extra space for text

    // Load logo first, then QR code
    logoImg.crossOrigin = 'anonymous';
    logoImg.onload = () => {
      qrImg.onload = () => {
        if (!ctx) return;

        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw QR code
        ctx.drawImage(qrImg, padding, padding, size, size);

        // Draw logo in center of QR code
        const logoSize = 50;
        const logoX = padding + (size - logoSize) / 2;
        const logoY = padding + (size - logoSize) / 2;
        
        // White background behind logo for better visibility
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2 + 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw the logo
        ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);

        // Add text below QR
        ctx.fillStyle = '#1a1a1a';
        ctx.font = 'bold 16px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Campanha #${shortId}`, canvas.width / 2, size + padding + 30);
        ctx.font = '12px Inter, sans-serif';
        ctx.fillStyle = '#666666';
        ctx.fillText('Raiz Token', canvas.width / 2, size + padding + 50);

        // Download
        const link = document.createElement('a');
        link.download = `campanha-${shortId}-qrcode.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        toast({
          title: "QR Code baixado!",
          description: "A imagem do QR Code foi salva."
        });
      };

      qrImg.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    };

    // Load the favicon/logo
    logoImg.src = '/favicon.png';
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: projectTitle,
          text: `Apoie a campanha #${shortId} na Raiz Token!`,
          url: shortUrl
        });
      } catch (error) {
        // User cancelled or share failed
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
        <div ref={qrRef} className="flex-shrink-0">
          <QRCodeSVG 
            value={shortUrl} 
            size={64}
            level="M"
            includeMargin={false}
            className="rounded"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Hash className="w-4 h-4 text-raiz-primary" />
            <span className="font-bold text-lg text-raiz-primary">{shortId}</span>
          </div>
          <p className="text-xs text-muted-foreground truncate">{shortUrl}</p>
        </div>
        <div className="flex flex-col gap-1">
          <Button size="sm" variant="outline" onClick={handleCopyLink}>
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
          <Button size="sm" variant="outline" onClick={handleDownloadQR}>
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card className="border-2 border-raiz-primary/20 bg-gradient-to-br from-raiz-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-raiz-primary">
          <QrCode className="w-5 h-5" />
          ID da Campanha
        </CardTitle>
        <CardDescription>
          Divulgue o ID ou o QR Code para as pessoas encontrarem sua campanha
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ID em destaque */}
        <div className="text-center p-4 bg-gradient-to-r from-raiz-primary/10 to-raiz-accent/10 rounded-lg">
          <p className="text-sm text-muted-foreground mb-2">ID da Campanha</p>
          <Badge 
            variant="outline" 
            className="text-3xl font-bold px-6 py-2 border-2 border-raiz-primary text-raiz-primary cursor-pointer hover:bg-raiz-primary hover:text-white transition-colors"
            onClick={handleCopyId}
          >
            #{shortId}
          </Badge>
          <p className="text-sm text-muted-foreground mt-3">
            "Acesse a Raiz Token e busque pelo ID <strong>{shortId}</strong>"
          </p>
        </div>

        {/* QR Code */}
        <div className="flex justify-center" ref={qrRef}>
          <div className="p-4 bg-white rounded-lg shadow-sm">
            <QRCodeSVG 
              value={shortUrl} 
              size={180}
              level="M"
              includeMargin={true}
              imageSettings={{
                src: "/favicon.png",
                x: undefined,
                y: undefined,
                height: 30,
                width: 30,
                excavate: true,
              }}
            />
          </div>
        </div>

        {/* URL curta */}
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <code className="flex-1 text-sm font-mono truncate">{shortUrl}</code>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={handleCopyLink}
            className="flex-shrink-0"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>

        {/* Botões de ação */}
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            onClick={handleCopyLink}
            className="flex items-center gap-2"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            Copiar Link
          </Button>
          <Button 
            variant="outline" 
            onClick={handleDownloadQR}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Baixar QR
          </Button>
        </div>

        <Button 
          onClick={handleShare}
          className="w-full flex items-center gap-2"
        >
          <Share2 className="w-4 h-4" />
          Compartilhar Campanha
        </Button>
      </CardContent>
    </Card>
  );
};

export default CampaignQRShare;
