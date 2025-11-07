# Configuração de Autenticação Google

Para configurar a autenticação com Google no Raiz Token, siga os passos abaixo:

## 1. Configurar Google Cloud Console

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Vá para **APIs & Services** > **Credentials**
4. Clique em **Create Credentials** > **OAuth Client ID**
5. Selecione **Web application** como tipo

## 2. Configurar URLs Autorizadas

No formulário de criação do OAuth Client ID:

### Authorized JavaScript origins:
```
https://oefkzjyqjjfzfrmovfdt.supabase.co
https://raiztoken.com.br
```

### Authorized redirect URIs:
```
https://oefkzjyqjjfzfrmovfdt.supabase.co/auth/v1/callback
```

## 3. Configurar Supabase

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Vá para **Authentication** > **Providers**
3. Encontre **Google** na lista de provedores
4. Cole o **Client ID** e **Client Secret** obtidos no Google Cloud Console
5. Salve as configurações

## 4. Configurar Site URL e Redirect URLs no Supabase

No Supabase, vá para **Authentication** > **URL Configuration**:

### Site URL:
```
https://raiztoken.com.br
```

### Redirect URLs:
```
https://raiztoken.com.br
https://raiztoken.com.br/**
https://oefkzjyqjjfzfrmovfdt.supabase.co/**
```

## 5. Tela de Consentimento OAuth

1. No Google Cloud Console, vá para **APIs & Services** > **OAuth consent screen**
2. Configure:
   - **App name**: Raiz Token
   - **User support email**: contato@raiztoken.com.br
   - **App logo**: Upload do logo da plataforma
   - **Authorized domains**: raiztoken.com.br
   - **Developer contact information**: contato@raiztoken.com.br

## 6. Escopos Necessários

Certifique-se de adicionar os seguintes escopos:
- `userinfo.email`
- `userinfo.profile`
- `openid`

## Erros Comuns

### Erro: "redirect_uri_mismatch"
- Verifique se a URL de redirect está exatamente igual no Google Cloud Console e no Supabase
- Certifique-se de que não há espaços em branco no final das URLs

### Erro: "access_denied"
- Verifique se o domínio está autorizado na tela de consentimento
- Certifique-se de que o aplicativo não está em modo de teste com usuários limitados

### Erro: "invalid_client"
- Confirme que o Client ID e Client Secret estão corretos no Supabase
- Verifique se o projeto do Google Cloud está ativo

## Suporte

Para mais informações, consulte:
- [Documentação Supabase - Google Auth](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
