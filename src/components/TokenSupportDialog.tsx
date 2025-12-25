import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useTokens } from '@/hooks/useTokens';
import { AlertCircle, Coins, Target, ShoppingCart } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface TokenSupportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectTitle: string;
  projectGoal: number;
  projectRaisedAmount: number;
  onSuccess?: () => void;
}

const TokenSupportDialog = ({ isOpen, onClose, projectId, projectTitle, projectGoal, projectRaisedAmount, onSuccess }: TokenSupportDialogProps) => {
  const navigate = useNavigate();
  const { tokens, supportProject } = useTokens();
  const [supportType, setSupportType] = useState<'all' | 'custom'>('custom');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  // Calcular quanto falta para completar a meta
  const tokensNeeded = Math.max(0, projectGoal - projectRaisedAmount);
  const tokensToUse = supportType === 'all' ? Math.min(tokens, tokensNeeded) : parseInt(amount);

  const handleSupport = async () => {
    const supportAmount = tokensToUse;

    if (!supportAmount || supportAmount <= 0) return;

    if (supportAmount > tokens) return;

    setLoading(true);
    const success = await supportProject(
      projectId,
      supportAmount,
      `Apoio ao projeto: ${projectTitle}`
    );

    setLoading(false);

    if (success) {
      onClose();
      setAmount('');
      setSupportType('custom');
      onSuccess?.();
    }
  };

  const handleClose = () => {
    onClose();
    setAmount('');
    setSupportType('custom');
  };

  const handleBuyTokens = () => {
    // Store project info in sessionStorage to return after purchase
    sessionStorage.setItem('returnToProject', JSON.stringify({
      projectId,
      projectTitle,
      intendedAmount: amount || ''
    }));
    handleClose();
    navigate('/carteira?tab=buy');
  };

  const insufficientBalance = tokens === 0 || (supportType === 'custom' && parseInt(amount) > tokens);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-raiz-primary" />
            Apoiar Projeto
          </DialogTitle>
          <DialogDescription>
            Use seus tokens para apoiar "{projectTitle}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <Coins className="h-4 w-4" />
            <AlertDescription>
              Saldo disponível: <strong>{tokens} tokens</strong>
            </AlertDescription>
          </Alert>

          {tokensNeeded > 0 && (
            <Alert>
              <Target className="h-4 w-4" />
              <AlertDescription>
                Faltam <strong>{tokensNeeded} tokens</strong> para completar a meta
              </AlertDescription>
            </Alert>
          )}

          <RadioGroup value={supportType} onValueChange={(value) => setSupportType(value as 'all' | 'custom')}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="all" disabled={tokens === 0} />
              <Label htmlFor="all" className={`cursor-pointer ${tokens === 0 ? 'text-muted-foreground' : ''}`}>
                {tokensNeeded > 0 && tokens >= tokensNeeded 
                  ? `Completar a meta (${tokensNeeded} tokens)`
                  : `Usar todos os meus tokens (${tokens} tokens)`
                }
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="custom" id="custom" />
              <Label htmlFor="custom" className="cursor-pointer">
                Especificar quantidade
              </Label>
            </div>
          </RadioGroup>

          {supportType === 'custom' && (
            <div className="space-y-2">
              <Label htmlFor="amount">Quantidade de tokens</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                max={tokens}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Digite a quantidade"
              />
              {amount && parseInt(amount) > tokens && (
                <p className="text-sm text-destructive">Você não tem tokens suficientes</p>
              )}
            </div>
          )}

          {/* Insufficient Balance Warning */}
          {insufficientBalance && (
            <Alert className="border-amber-300 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800">Saldo Insuficiente</AlertTitle>
              <AlertDescription className="text-amber-700 text-sm">
                {tokens === 0 
                  ? 'Você não possui tokens. Adquira tokens para apoiar projetos.'
                  : 'Você não tem tokens suficientes para este apoio. Adquira mais tokens.'}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancelar
            </Button>
            
            {insufficientBalance ? (
              <Button
                onClick={handleBuyTokens}
                className="flex-1 bg-raiz-gold hover:bg-raiz-gold/90 text-black"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Adquirir Tokens
              </Button>
            ) : (
              <Button
                onClick={handleSupport}
                disabled={
                  loading ||
                  tokens === 0 ||
                  (supportType === 'custom' && (!amount || parseInt(amount) <= 0 || parseInt(amount) > tokens))
                }
                className="flex-1 bg-raiz-primary hover:bg-raiz-primary/90"
              >
                {loading ? 'Processando...' : 'Apoiar'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TokenSupportDialog;
