const publicHomeNavItems = [
  { href: '#projetos', icon: 'ph ph-squares-four', label: 'Projetos', active: true },
  { href: '#como', icon: 'ph ph-path', label: 'Como' },
  { href: '#apoiar', icon: 'ph ph-hand-heart', label: 'Apoiar' },
  { href: '/criar-projeto', icon: 'ph ph-plus-circle', label: 'Criar' },
  { href: '/login', icon: 'ph ph-user-circle', label: 'Entrar' },
];

const PublicHomeBottomNav = () => {
  return (
    <nav
      className="mobile-bottom-nav fixed left-3 right-3 bottom-3 z-[60] grid grid-cols-5 gap-1.5 rounded-[28px] border border-[#DDE8D8]/90 bg-white/95 p-2 shadow-[0_18px_60px_rgba(45,64,93,0.18)] backdrop-blur-xl md:hidden"
      aria-label="Menu inferior mobile da Home"
    >
      {publicHomeNavItems.map((item) => (
        <a
          key={item.href}
          href={item.href}
          className={`flex min-h-[54px] flex-col items-center justify-center gap-1 rounded-[20px] text-[10px] font-bold no-underline transition-colors ${
            item.active
              ? 'bg-[#2D405D] text-white [&_i]:text-[#BADA9C]'
              : 'text-[#667085] hover:bg-[#2D405D] hover:text-white hover:[&_i]:text-[#BADA9C]'
          }`}
        >
          <i className={`${item.icon} text-[21px]`} aria-hidden="true" />
          <span>{item.label}</span>
        </a>
      ))}
    </nav>
  );
};

export default PublicHomeBottomNav;
