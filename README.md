# KIMAAKI - Marketplace de Delivery Multicategoria On-Demand

🚀 **KIMAAKI** é uma plataforma completa de delivery desenvolvida especialmente para Angola e África, conectando clientes, empresas e entregadores em um ecossistema integrado.

## 🌟 Funcionalidades Principais

### 👥 Para Clientes
- Pedidos de restaurantes, farmácias, supermercados e lojas
- Rastreamento em tempo real
- Múltiplas opções de pagamento
- Histórico de pedidos

### 🏢 Para Empresas/Parceiros
- **Plano Básico**: Comissões de 5-15% dependendo do tipo de entrega
- **Plano Premium**: Comissões de 8-20% com benefícios extras (destaque, campanhas)
- Painel de gestão completo
- Análise de vendas e relatórios

### 🛵 Para Entregadores
- Cadastro com validação de documentos
- Sistema de aprovação por administradores
- Gestão de entregas e ganhos

### 🔧 Painel Administrativo
- Aprovação de empresas e entregadores
- Gestão de pedidos em tempo real
- Configuração de taxas e comissões
- Relatórios detalhados e estatísticas

## 🛠️ Tecnologias Utilizadas

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI, Shadcn/ui
- **Backend**: Supabase (Database, Auth, Storage)
- **Icons**: Lucide React
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod

## 🚀 Deploy na Vercel

Este projeto está otimizado para deploy na Vercel:

1. **Fork/Clone** este repositório
2. **Conecte** sua conta Vercel ao repositório
3. **Configure** as variáveis de ambiente:
   ```
   NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_publica_supabase
   ```
4. **Deploy** automaticamente

## 📦 Instalação Local

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/kimaaki-app.git

# Entre no diretório
cd kimaaki-app

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local

# Execute em modo desenvolvimento
npm run dev
```

## 🗄️ Configuração do Banco de Dados

O projeto utiliza Supabase. Execute os seguintes comandos SQL para criar as tabelas necessárias:

```sql
-- Tabela de usuários (estende auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'client',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Tabela de empresas
CREATE TABLE public.companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  province TEXT NOT NULL,
  plan_type TEXT DEFAULT 'basic',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de entregadores
CREATE TABLE public.delivery_men (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de pedidos
CREATE TABLE public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES auth.users(id),
  company_id UUID REFERENCES companies(id),
  delivery_man_id UUID REFERENCES delivery_men(id),
  status TEXT DEFAULT 'new',
  total_amount DECIMAL(10,2),
  commission_rate DECIMAL(5,2),
  delivery_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configurações de comissões
CREATE TABLE public.commission_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  country TEXT NOT NULL,
  city TEXT,
  plan_type TEXT NOT NULL,
  delivery_type TEXT NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔐 Configuração de Storage

Crie os seguintes buckets no Supabase Storage:
- `company-documents` (para documentos de empresas)
- `delivery-documents` (para documentos de entregadores)

## 📱 Funcionalidades por Módulo

### Cadastro de Empresas
- Formulário em 3 etapas
- Upload de documentos (NIF, Alvará, Publicação)
- Seleção de plano (Básico/Premium)
- Sistema de aprovação

### Cadastro de Entregadores
- Dados pessoais e endereço
- Upload de documentos obrigatórios
- Foto do veículo (opcional)
- Validação administrativa

### Sistema de Comissões
- Configuração por país/cidade
- Diferentes taxas por tipo de entrega
- Cálculo automático em pedidos

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Contato

Para dúvidas ou suporte, entre em contato através do email: suporte@kimaaki.com

---

**KIMAAKI** - Conectando Angola através da tecnologia 🇦🇴
