import { useState, useEffect } from 'react';
import { Search, FolderOpen, Users, Award, AlertTriangle, DollarSign, Coins, ArrowLeftRight, RotateCcw, LogOut, Clock, FileText, TestTube, Settings, MessageSquare, Mail, Heart, Shield } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface AdminSearchCommandProps {
  setActiveTab: (tab: string) => void;
}

const menuItems = [
  { label: 'Projetos', value: 'projects', icon: FolderOpen, group: 'Análises' },
  { label: 'Usuários', value: 'users', icon: Users, group: 'Análises' },
  { label: 'Badges', value: 'badges', icon: Award, group: 'Análises' },
  { label: 'Denúncias', value: 'reports', icon: AlertTriangle, group: 'Análises' },
  { label: 'Aceites de Regras', value: 'consents', icon: FileText, group: 'Análises' },
  { label: 'Top Apoiadores', value: 'top-supporters', icon: Heart, group: 'Análises' },
  { label: 'Visão Geral Financeiro', value: 'finance', icon: DollarSign, group: 'Financeiro' },
  { label: 'Tokens', value: 'tokens', icon: Coins, group: 'Financeiro' },
  { label: 'Transações', value: 'transactions', icon: ArrowLeftRight, group: 'Financeiro' },
  { label: 'Reembolsos', value: 'refunds', icon: RotateCcw, group: 'Financeiro' },
  { label: 'Resgates', value: 'withdrawals', icon: LogOut, group: 'Financeiro' },
  { label: 'Operação', value: 'operations', icon: Shield, group: 'Sistema' },
  { label: 'Fila Operacional', value: 'operations', icon: Shield, group: 'Sistema' },
  { label: 'Exceções Operacionais', value: 'operations', icon: Shield, group: 'Sistema' },
  { label: 'Projetos Expirados', value: 'expired', icon: Clock, group: 'Sistema' },
  { label: 'Suporte', value: 'support', icon: MessageSquare, group: 'Sistema' },
  { label: 'Msg. Rejeições', value: 'rejections', icon: Mail, group: 'Sistema' },
  { label: 'Logs do Sistema', value: 'logs', icon: FileText, group: 'Sistema' },
  { label: 'Testes', value: 'tests', icon: TestTube, group: 'Sistema' },
  { label: 'Configurações', value: 'settings', icon: Settings, group: 'Sistema' },
];

const AdminSearchCommand = ({ setActiveTab }: AdminSearchCommandProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredItems = menuItems.filter(item =>
    item.label.toLowerCase().includes(search.toLowerCase()) ||
    item.group.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (value: string) => {
    setActiveTab(value);
    setOpen(false);
    setSearch('');
  };

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar menu... (Ctrl+K)"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOpen(true);
            }}
            onClick={() => setOpen(true)}
            className="pl-10 w-64 bg-background"
          />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandList>
            <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
            {['Análises', 'Financeiro', 'Sistema'].map(group => {
              const groupItems = filteredItems.filter(item => item.group === group);
              if (groupItems.length === 0) return null;
              
              return (
                <CommandGroup key={group} heading={group}>
                  {groupItems.map(item => (
                    <CommandItem
                      key={`${item.value}-${item.label}`}
                      value={item.label}
                      onSelect={() => handleSelect(item.value)}
                      className="cursor-pointer"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default AdminSearchCommand;
