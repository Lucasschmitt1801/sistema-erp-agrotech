import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Settings, 
  LogOut, 
  LayoutDashboard, 
  ShieldAlert, 
  UserCircle,
  Menu,
  X,
  Plus,
  Trash2,
  Save,
  Search
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithCustomToken,
  signInAnonymously
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  updateDoc, 
  where 
} from 'firebase/firestore';

// --- CONFIGURAÇÃO FIREBASE ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- COMPONENTES AUXILIARES ---

// Botão genérico estilizado
const Button = ({ children, onClick, variant = 'primary', className = '', type = 'button', disabled = false }) => {
  const baseStyle = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
    ghost: "text-gray-600 hover:bg-gray-100"
  };

  return (
    <button 
      type={type} 
      onClick={onClick} 
      className={`${baseStyle} ${variants[variant]} ${className}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

// Input genérico estilizado
const Input = ({ label, type = "text", value, onChange, placeholder, required = false }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
    />
  </div>
);

// Card de Estatística
const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
    <div>
      <p className="text-gray-500 text-sm font-medium">{title}</p>
      <h3 className="text-2xl font-bold mt-1 text-gray-800">{value}</h3>
    </div>
    <div className={`p-3 rounded-full ${color}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
  </div>
);

// --- COMPONENTE PRINCIPAL ---

export default function App() {
  // Estados Globais
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'admin', 'users'
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Estados de Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState('');

  // Estados de Dados (Simulados ou Firestore)
  const [usersList, setUsersList] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // --- EFEITOS E AUTH ---

  // 1. Inicialização de Auth e Listener
  useEffect(() => {
    const initAuth = async () => {
      // Se houver um token inicial no ambiente, use-o (útil para desenvolvimento/preview)
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        try {
          await signInWithCustomToken(auth, __initial_auth_token);
        } catch (e) {
          console.error("Erro ao usar token customizado", e);
        }
      }
    };
    initAuth();

    // Listener de estado do Firebase
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      // Verifica se é admin baseada no email (Simulação simples de role)
      // Em produção real, isso viria de claims ou de um doc no Firestore
      if (currentUser && (currentUser.email === 'admin@empresa.com' || currentUser.email?.includes('admin'))) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Carregar dados do Firestore (Só se estiver logado)
  useEffect(() => {
    if (!user) return;

    // Exemplo: Carregar usuários para o painel admin
    const usersRef = collection(db, 'artifacts', appId, 'public', 'data', 'users_demo');
    const unsubscribeUsers = onSnapshot(usersRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsersList(data);
    }, (error) => {
      console.error("Erro ao buscar usuários:", error);
    });

    return () => unsubscribeUsers();
  }, [user]);

  // --- HANDLERS ---

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
        // O listener onAuthStateChanged cuidará do resto
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      console.error(error);
      if (error.code === 'auth/invalid-credential') {
        setAuthError('E-mail ou senha incorretos.');
      } else if (error.code === 'auth/email-already-in-use') {
        setAuthError('Este e-mail já está cadastrado.');
      } else {
        setAuthError('Erro ao autenticar. Tente novamente.');
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Limpa estados locais importantes
      setIsAdmin(false);
      setCurrentView('dashboard');
      setEmail('');
      setPassword('');
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  };

  // Funções de Admin (Demo)
  const handleDeleteUser = async (id) => {
    if (!isAdmin) return;
    if (!confirm('Tem certeza que deseja remover este usuário?')) return;
    
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users_demo', id));
    } catch (error) {
      alert('Erro ao deletar usuário');
    }
  };

  const handleAddDemoUser = async () => {
    if (!isAdmin) return;
    const fakeUser = {
      name: `Usuário ${Math.floor(Math.random() * 1000)}`,
      email: `user${Date.now()}@teste.com`,
      role: 'user',
      status: 'active',
      createdAt: new Date().toISOString()
    };
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'users_demo'), fakeUser);
  };

  // --- RENDERIZAÇÃO ---

  // Tela de Loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Tela de Login (Se !user)
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
          <div className="text-center mb-8">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Sistema Corporativo</h1>
            <p className="text-gray-500 mt-2">Faça login para acessar o painel</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <Input 
              label="E-mail" 
              type="email" 
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input 
              label="Senha" 
              type="password" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {authError && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                {authError}
              </div>
            )}

            <Button type="submit" className="w-full h-11" variant="primary">
              {isRegistering ? 'Criar Conta' : 'Entrar no Sistema'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => { setIsRegistering(!isRegistering); setAuthError(''); }}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              {isRegistering ? 'Já tenho conta? Fazer Login' : 'Não tem conta? Cadastre-se'}
            </button>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-100 text-xs text-center text-gray-400">
            <p>Para testar como Admin use: admin@empresa.com</p>
          </div>
        </div>
      </div>
    );
  }

  // --- SISTEMA LOGADO ---

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-hidden">
      
      {/* Sidebar Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-gray-100">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
              <span className="text-white font-bold">S</span>
            </div>
            <span className="text-lg font-bold text-gray-800">SysGestão</span>
          </div>

          {/* Navegação */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <p className="px-2 text-xs font-semibold text-gray-400 uppercase mb-2">Principal</p>
            
            <button
              onClick={() => { setCurrentView('dashboard'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${currentView === 'dashboard' 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
              `}
            >
              <LayoutDashboard className="w-5 h-5" />
              Dashboard
            </button>

            {/* Renderização Condicional do Botão de Admin */}
            {isAdmin && (
              <>
                <p className="px-2 text-xs font-semibold text-gray-400 uppercase mt-6 mb-2">Administração</p>
                <button
                  onClick={() => { setCurrentView('admin'); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${currentView === 'admin' 
                      ? 'bg-purple-50 text-purple-700' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                  `}
                >
                  <ShieldAlert className="w-5 h-5" />
                  Painel Admin
                </button>
                <button
                  onClick={() => { setCurrentView('users'); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${currentView === 'users' 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                  `}
                >
                  <Users className="w-5 h-5" />
                  Gerenciar Usuários
                </button>
              </>
            )}
          </nav>

          {/* User Footer */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                <UserCircle className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.displayName || 'Usuário'}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
            <Button 
              onClick={handleLogout} 
              variant="secondary" 
              className="w-full text-sm justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <LogOut className="w-4 h-4" />
              Sair do Sistema
            </Button>
          </div>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header Mobile */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:hidden">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-semibold text-gray-800">SysGestão</span>
          <div className="w-8" /> {/* Spacer */}
        </header>

        {/* Área de Scroll */}
        <div className="flex-1 overflow-auto p-4 lg:p-8">
          
          {/* VIEW: DASHBOARD */}
          {currentView === 'dashboard' && (
            <div className="max-w-6xl mx-auto animate-fadeIn">
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Visão Geral</h1>
                <p className="text-gray-500">Bem-vindo ao sistema, {user.email}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard 
                  title="Usuários Ativos" 
                  value={usersList.length || 124} 
                  icon={Users} 
                  color="bg-blue-500" 
                />
                <StatCard 
                  title="Receita Mensal" 
                  value="R$ 45.2k" 
                  icon={LayoutDashboard} 
                  color="bg-green-500" 
                />
                <StatCard 
                  title="Pendências" 
                  value="12" 
                  icon={ShieldAlert} 
                  color="bg-yellow-500" 
                />
                 <StatCard 
                  title="Configurações" 
                  value="Sistema" 
                  icon={Settings} 
                  color="bg-purple-500" 
                />
              </div>

              {/* Banner de Aviso se não for Admin */}
              {!isAdmin && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 flex items-start gap-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <UserCircle className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-blue-900">Acesso Padrão</h3>
                    <p className="text-blue-700 mt-1">
                      Você está logado como usuário comum. O painel administrativo está oculto.
                      Para ver o painel admin, você precisaria logar com uma conta de privilégio elevado.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW: ADMIN PANEL */}
          {currentView === 'admin' && isAdmin && (
            <div className="max-w-6xl mx-auto animate-fadeIn">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Painel Administrativo</h1>
                  <p className="text-gray-500">Controle total do sistema</p>
                </div>
                <div className="bg-purple-100 text-purple-700 px-4 py-1 rounded-full text-sm font-bold">
                  Modo Super Usuário
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-gray-500" />
                    Configurações do Sistema
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Manutenção do Sistema</span>
                      <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full bg-gray-300 cursor-pointer">
                        <span className="translate-x-0 inline-block w-6 h-6 bg-white rounded-full shadow transform transition duration-200"></span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Novos Cadastros</span>
                      <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full bg-green-500 cursor-pointer">
                        <span className="translate-x-6 inline-block w-6 h-6 bg-white rounded-full shadow transform transition duration-200"></span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-gray-500" />
                    Logs de Segurança
                  </h3>
                  <div className="space-y-3">
                    {[1,2,3].map((i) => (
                      <div key={i} className="text-sm flex justify-between text-gray-600 border-b border-gray-50 pb-2 last:border-0">
                        <span>Login admin detectado (IP 192.168.1.{i})</span>
                        <span className="text-xs text-gray-400">Há {i*10} min</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

           {/* VIEW: USERS MANAGEMENT (ADMIN ONLY) */}
           {currentView === 'users' && isAdmin && (
            <div className="max-w-6xl mx-auto animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Gerenciar Usuários</h1>
                  <p className="text-gray-500">{usersList.length} usuários cadastrados</p>
                </div>
                <Button onClick={handleAddDemoUser} variant="primary">
                  <Plus className="w-4 h-4" />
                  Novo Usuário Demo
                </Button>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Nome</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Email</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {usersList.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                            Nenhum usuário encontrado. Clique em "Novo Usuário Demo".
                          </td>
                        </tr>
                      ) : (
                        usersList.map((u) => (
                          <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-medium text-gray-900">{u.name}</div>
                            </td>
                            <td className="px-6 py-4 text-gray-600">{u.email}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {u.role === 'admin' ? 'Administrador' : 'Ativo'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button 
                                onClick={() => handleDeleteUser(u.id)}
                                className="text-gray-400 hover:text-red-600 transition-colors p-2"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}