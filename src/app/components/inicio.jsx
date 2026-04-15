'use client';
import { useState, useEffect } from 'react';

const AVAILABLE_APPS = [
    { id: 'frappe', name: 'Frappe Framework', default: true },
    { id: 'erpnext', name: 'ERPNext', default: true },
    { id: 'crm', name: 'Frappe CRM', default: false },
    { id: 'helpdesk', name: 'Helpdesk', default: false },
    { id: 'insights', name: 'Insights (v3)', default: false },
    { id: 'builder', name: 'Frappe Builder', default: false },
    { id: 'frappe_whatsapp', name: 'WhatsApp Meta', default: false },
    { id: 'telephony', name: 'Telephony', default: true },
    { id: 'hrms', name: 'HRMS (Recursos Humanos)', default: false },
    { id: 'payments', name: 'Payments', default: true },
    { id: 'lms', name: 'LMS (Cursos)', default: false }
];

export default function Dashboard({ url }) {
    const [token, setToken] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [instances, setInstances] = useState([]);
    const [loading, setLoading] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newDomain, setNewDomain] = useState('');
    const [selectedApps, setSelectedApps] = useState(
        AVAILABLE_APPS.filter(app => app.default).map(app => app.id)
    );
    const [creatingInstance, setCreatingInstance] = useState(false);

    useEffect(() => {
        const savedToken = localStorage.getItem('fm_admin_token');
        if (savedToken) {
            setToken(savedToken);
            setIsAuthenticated(true);
            fetchInstances(savedToken);
        }
    }, []);

    const handleLogin = (e) => {
        e.preventDefault();
        localStorage.setItem('fm_admin_token', token);
        setIsAuthenticated(true);
        fetchInstances(token);
    };

    const handleLogout = () => {
        localStorage.removeItem('fm_admin_token');
        setIsAuthenticated(false);
        setToken('');
        setInstances([]);
    };

    const fetchInstances = async (authToken) => {
        setLoading(true);
        try {
            const res = await fetch(`${url}/instances`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (res.status === 401 || res.status === 403) {
                handleLogout();
                alert('Token inválido');
                return;
            }
            const data = await res.json();
            setInstances(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateInstance = async (e) => {
        e.preventDefault();
        if (!newDomain.includes('.')) {
            alert('Por favor ingresa un dominio válido (ej. cliente.soiteg.com)');
            return;
        }

        setCreatingInstance(true);
        try {
            const res = await fetch(`${url}/instances`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    action: 'create',
                    domain: newDomain,
                    appsToInstall: selectedApps
                })
            });

            const data = await res.json();

            if (res.ok) {
                alert(`¡Éxito! ${data.message}\nLa instalación corre en segundo plano.`);
                setIsModalOpen(false);
                setNewDomain('');
                setSelectedApps(AVAILABLE_APPS.filter(a => a.default).map(a => a.id));
                fetchInstances(token);
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            alert('Error de conexión con el servidor.');
            console.error(error);
        } finally {
            setCreatingInstance(false);
        }
    };

    // 👇 NUEVA FUNCIÓN PARA MANEJAR BOTONES DE LA TABLA (SSL, Reiniciar, Borrar) 👇
    const handleAction = async (actionType, domain) => {
        const messages = {
            'ssl': `¿Estás seguro de generar el SSL de Let's Encrypt para ${domain}?`,
            'restart': `¿Reiniciar el servidor de ${domain}?`,
            'delete': `⚠️ ¿PELIGRO: Estás seguro de borrar COMPLETAMENTE la instancia ${domain}?`,
            'stop': `Detener Instancia: ${domain}`,
            'start': `Activar Instancia: ${domain}`
        };

        if (!window.confirm(messages[actionType])) return;

        try {
            const res = await fetch(`${url}/instances`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    action: actionType,
                    domain: domain
                })
            });

            const data = await res.json();
            if (res.ok) {
                alert(`Proceso iniciado: ${data.message}`);
                fetchInstances(token); // Refresca para ver el cambio de estado
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            alert('Error de conexión con el servidor.');
            console.error(error);
        }
    };

    const toggleAppSelection = (appId) => {
        setSelectedApps(prev =>
            prev.includes(appId) ? prev.filter(id => id !== appId) : [...prev, appId]
        );
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <form onSubmit={handleLogin} className="bg-slate-800 p-8 rounded-2xl shadow-2xl space-y-6 w-96 border border-slate-700">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-white mb-2">Soiteg Cloud</h1>
                        <p className="text-slate-400 text-sm">Panel de Control Interno</p>
                    </div>
                    <div>
                        <label className="block text-slate-400 mb-2 text-sm font-medium">Token de Acceso</label>
                        <input
                            type="password"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            className="w-full p-3 rounded-lg bg-slate-900 text-white border border-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all"
                            placeholder="••••••••••••••••"
                            required
                        />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-blue-900/50">
                        Ingresar
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
            <nav className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold">S</span>
                    </div>
                    <h1 className="text-xl font-bold text-slate-800 tracking-tight">Soiteg Workspace Control</h1>
                </div>
                <div className="flex items-center space-x-4">
                    <button onClick={() => fetchInstances(token)} className="text-slate-500 hover:text-blue-600 text-sm font-medium">
                        🔄 Refrescar
                    </button>
                    <button onClick={handleLogout} className="text-red-500 hover:text-red-700 text-sm font-medium px-4 py-2 hover:bg-red-50 rounded-lg transition-colors">
                        Cerrar Sesión
                    </button>
                </div>
            </nav>

            <main className="max-w-6xl mx-auto mt-10 p-4">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Servidores Activos</h2>
                        <p className="text-slate-500 text-sm mt-1">Gestiona tus instancias de Frappe y ERPNext.</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-md shadow-blue-500/30 transition-all transform hover:-translate-y-0.5"
                    >
                        + Nueva Instancia
                    </button>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                            Cargando base de datos...
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Dominio</th>
                                        <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Estado</th>
                                        <th className="px-6 py-4 font-semibold text-slate-600 text-sm">Fecha de Creación</th>
                                        <th className="px-6 py-4 font-semibold text-slate-600 text-sm text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {instances.length === 0 ? (
                                        <tr><td colSpan={4} className="p-12 text-center text-slate-500">No tienes instancias corriendo en este momento. Crea la primera.</td></tr>
                                    ) : (
                                        instances.map((inst) => (
                                            <tr key={inst.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <a href={`https://${inst.domain}`} target="_blank" rel="noreferrer" className="font-bold text-blue-600 hover:underline">
                                                            {inst.domain}
                                                        </a>

                                                        {/* Mostramos las apps instaladas como badges pequeñitos */}
                                                        <div className="flex flex-wrap gap-1 mt-1.5">
                                                            {inst.apps ? inst.apps.split(', ').map((app) => (
                                                                <span
                                                                    key={app}
                                                                    className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[10px] rounded border border-slate-200 uppercase font-medium"
                                                                >
                                                                    {app}
                                                                </span>
                                                            )) : (
                                                                <span className="text-[10px] text-slate-400 italic">Sin apps registradas</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${inst.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                        inst.status.includes('processing') || inst.status === 'installing' ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' :
                                                            'bg-red-50 text-red-700 border-red-200'
                                                        }`}>
                                                        {inst.status.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-500 text-sm">
                                                    {new Date(inst.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                </td>
                                                <td className="px-6 py-4 space-x-2 text-right">
                                                    {/* --- CASO: LA INSTANCIA ESTÁ ACTIVA --- */}
                                                    {inst.status === 'active' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleAction('ssl', inst.domain)}
                                                                className="text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium px-3 py-1.5 rounded transition-colors"
                                                            >
                                                                SSL
                                                            </button>
                                                            <button
                                                                onClick={() => handleAction('restart', inst.domain)}
                                                                className="text-sm bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium px-3 py-1.5 rounded transition-colors"
                                                            >
                                                                Reiniciar
                                                            </button>
                                                            <button
                                                                onClick={() => handleAction('stop', inst.domain)}
                                                                className="text-sm bg-orange-50 text-orange-600 hover:bg-orange-100 font-medium px-3 py-1.5 rounded transition-colors"
                                                            >
                                                                Detener
                                                            </button>
                                                        </>
                                                    )}

                                                    {/* --- CASO: LA INSTANCIA ESTÁ DETENIDA (Stopped) --- */}
                                                    {(inst.status === 'detenido' || inst.status === 'error') && (
                                                        <>
                                                            <button
                                                                onClick={() => handleAction('start', inst.domain)}
                                                                className="text-sm bg-green-50 text-green-600 hover:bg-green-100 font-medium px-3 py-1.5 rounded transition-colors"
                                                            >
                                                                Iniciar
                                                            </button>
                                                            <button
                                                                onClick={() => handleAction('delete', inst.domain)}
                                                                className="text-sm bg-red-50 text-red-600 hover:bg-red-100 font-medium px-3 py-1.5 rounded transition-colors"
                                                            >
                                                                Borrar
                                                            </button>
                                                        </>
                                                    )}

                                                    {/* --- CASO: ESTÁ EN PROCESO (Installing/Processing) --- */}
                                                    {inst.status.includes('processing') || inst.status === 'installing' ? (
                                                        <span className="text-xs text-slate-400 italic animate-pulse px-3">
                                                            Espere...
                                                        </span>
                                                    ) : null}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>

            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-800">Lanzar Nueva Instancia</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        <form onSubmit={handleCreateInstance} className="p-6">
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Dominio del Cliente</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-slate-400 sm:text-sm">🌐</span>
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        value={newDomain}
                                        onChange={(e) => setNewDomain(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
                                        placeholder="ejemplo: zapatos.soiteg.com"
                                    />
                                </div>
                            </div>

                            <div className="mb-8">
                                <label className="block text-sm font-semibold text-slate-700 mb-3">Aplicaciones a Instalar</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                    {AVAILABLE_APPS.map((app) => (
                                        <label
                                            key={app.id}
                                            className={`flex items-start p-3 border rounded-lg cursor-pointer transition-all ${selectedApps.includes(app.id) ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-500' : 'bg-white border-slate-200 hover:bg-slate-50'
                                                }`}
                                        >
                                            <div className="flex items-center h-5">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                                                    checked={selectedApps.includes(app.id)}
                                                    onChange={() => toggleAppSelection(app.id)}
                                                    disabled={app.id === 'frappe' || app.id === "telephony" || app.id === "payments"}
                                                />
                                            </div>
                                            <div className="ml-3 text-sm">
                                                <span className={`font-medium ${selectedApps.includes(app.id) ? 'text-blue-900' : 'text-slate-700'}`}>
                                                    {app.name}
                                                </span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={creatingInstance}
                                    className="inline-flex items-center px-5 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {creatingInstance ? 'Iniciando despliegue...' : 'Lanzar Servidor 🚀'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}