import { useState } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../utils/constants';

// 🚀 ALEPH: Rutas profundas (para que Next.js las encuentre) y la función correcta
import { GetAccountFromProvider } from 'aleph-sdk-ts/dist/accounts/ethereum';
import { Publish as AlephPublish } from 'aleph-sdk-ts/dist/messages/store/publish';

export default function UpdateStateForm() {
    const [cuenta, setCuenta] = useState(null);
    const [cargando, setCargando] = useState(false);
    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

    const [archivo, setArchivo] = useState(null);
    const [formData, setFormData] = useState({
        descripcion: '',
        ubicacion: '',
        productor: '',
        fecha: ''
    });

    const asegurarRedSepolia = async () => {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (chainId !== '0xaa36a7') {
            setMensaje({ texto: 'Cambiando a la red Sepolia...', tipo: 'info' });
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: '0xaa36a7' }], // Forzamos Sepolia
                });
            } catch (switchError) {
                // El error 4902 indica que la red no está agregada en MetaMask
                if (switchError.code === 4902) {
                    try {
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [{
                                chainId: '0xaa36a7',
                                chainName: 'Sepolia Testnet',
                                rpcUrls: ['https://rpc2.sepolia.org'],
                                blockExplorerUrls: ['https://sepolia.etherscan.io'],
                                nativeCurrency: { name: 'Sepolia ETH', symbol: 'SEP', decimals: 18 }
                            }], // Todo dentro de un solo objeto dentro del array
                        });
                    } catch (addError) {
                        throw new Error('No se pudo agregar Sepolia. Hazlo manualmente.');
                    }
                } else {
                    throw new Error('Cambio a Sepolia rechazado por el usuario.');
                }
            }
        }
    };

    const conectarWallet = async () => {
        if (typeof window.ethereum !== 'undefined') {
            try {
                // 1. Pedimos las cuentas
                const cuentas = await window.ethereum.request({ method: 'eth_requestAccounts' });

                // 2. ¡EL SEGURO! Verificamos en qué red estamos (0xaa36a7 es el código de Sepolia)
                await asegurarRedSepolia();

                setCuenta(cuentas[0]);
                setMensaje({ texto: 'Billetera conectada en Sepolia 🟢', tipo: 'exito' });
            } catch (error) {
                console.error(error);
                setMensaje({ texto: 'Por favor, acepta la conexión en MetaMask.', tipo: 'error' });
            }
        } else {
            setMensaje({ texto: 'Por favor, instala MetaMask para usar esta dApp.', tipo: 'error' });
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setArchivo(e.target.files[0]);
        }
    };

    const registrarLote = async (e) => {
        e.preventDefault();
        if (!cuenta) {
            setMensaje({ texto: 'Debes conectar tu billetera primero.', tipo: 'error' });
            return;
        }

        setCargando(true);

        try {
            // 🛡️ BLOQUEO DE SEGURIDAD ABSOLUTO
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });

            // Verificamos si NO es Sepolia (0xaa36a7)
            if (chainId !== '0xaa36a7') {
                setMensaje({
                    texto: '🚨 PELIGRO: Estás en la red principal. Abre MetaMask, cambia a Sepolia manualmente y vuelve a intentar.',
                    tipo: 'error'
                });
                setCargando(false);
                return; // ¡ESTO ES CLAVE! Detiene el código aquí mismo. No cobra nada.
            }

            let hashAleph = "Sin evidencia";

            if (archivo) {
                setMensaje({ texto: '1/2 Subiendo a Aleph.im. Firma el mensaje en MetaMask...', tipo: 'info' });
                
                // 1. Obtenemos la cuenta de Aleph. 
                // HACK MÁGICO: Aleph de forma nativa intentará forzarnos a Ethereum Mainnet o a agregar la red.
                // Como ya validamos estricamente que estamos en Sepolia, engañamos a Aleph por un milisegundo.
                const oldRequest = window.ethereum.request;
                window.ethereum.request = async (args) => {
                    if (args.method === 'wallet_switchEthereumChain' || args.method === 'wallet_addEthereumChain') {
                        return null; // "Sí, claro, Aleph, ya te cambié de red" 😉
                    }
                    return oldRequest.bind(window.ethereum)(args);
                };

                let alephAccount;
                try {
                    // Llamamos a Aleph de forma simple. Él pedirá cambiar de red y nuestro mock lo absorberá.
                    alephAccount = await GetAccountFromProvider(window.ethereum);
                } finally {
                    // SIEMPRE regresamos MetaMask a la normalidad para la transacción real de Ethereum.
                    window.ethereum.request = oldRequest;
                }

                // 2. Publicamos usando el alias que importamos arriba
                const uploadResult = await AlephPublish({
                    channel: 'huellanativa-hackathon',
                    account: alephAccount,
                    fileObject: archivo,
                });

                hashAleph = uploadResult.content.item_hash;
                console.log("Subido a Aleph. Hash:", hashAleph);
            }

            setMensaje({ texto: '2/2 Registrando en Ethereum. Aprueba en MetaMask...', tipo: 'info' });
            
            // 🚨 DOBLE CANDADO: Nos aseguramos de nuevo de que MetaMask NO se haya movido de Sepolia
            await asegurarRedSepolia();

            // 🚀 AQUÍ ESTÁ LA MAGIA: Leemos a MetaMask justo antes de cobrar y usamos "any"
            const provider = new ethers.BrowserProvider(window.ethereum, "any");
            const signer = await provider.getSigner();
            const contrato = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

            const metadatos = JSON.stringify({
                producto: formData.descripcion,
                productor: formData.productor,
                fecha: formData.fecha
            });

            const transaccion = await contrato.crearLote(
                metadatos,
                formData.ubicacion,
                hashAleph
            );

            setMensaje({ texto: 'Transacción enviada. Esperando bloques...', tipo: 'info' });
            await transaccion.wait();

            const idAsignado = await contrato.contadorLotes();

            setMensaje({
                texto: `¡Éxito! Lote registrado. 🏆 ID: ${idAsignado.toString()}`,
                tipo: 'exito'
            });

            setFormData({ descripcion: '', ubicacion: '', productor: '', fecha: '' });
            setArchivo(null);

        } catch (error) {
            console.error(error);
            setMensaje({ texto: 'Error en el proceso descentralizado.', tipo: 'error' });
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-md border border-gray-100">
            <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold text-gray-800">Registrar Origen</h2>
                <p className="text-gray-500 text-sm mt-1">Sube evidencia a Aleph y registra en Sepolia</p>
            </div>

            {!cuenta ? (
                <button onClick={conectarWallet} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-lg transition-colors flex justify-center items-center gap-2">
                    🦊 Conectar MetaMask
                </button>
            ) : (
                <div className="mb-6 p-3 bg-green-50 rounded-lg border border-green-200 text-center">
                    <p className="text-xs text-green-800 font-mono break-all">Conectado: {cuenta}</p>
                </div>
            )}

            <form onSubmit={registrarLote} className="space-y-4 mt-6">
                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">Producto y Variedad</label>
                    <input type="text" name="descripcion" value={formData.descripcion} onChange={handleChange} placeholder="Ej: Cacao Fino de Aroma - Lote #002" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500" required disabled={cargando || !cuenta} />
                </div>

                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">Ubicación del Productor</label>
                    <input type="text" name="ubicacion" value={formData.ubicacion} onChange={handleChange} placeholder="Ej: Azuay, Ecuador" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500" required disabled={cargando || !cuenta} />
                </div>

                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">Nombre del Productor</label>
                    <input type="text" name="productor" value={formData.productor} onChange={handleChange} placeholder="Ej: Luis Yanza" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500" required disabled={cargando || !cuenta} />
                </div>

                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">Fecha de Producción</label>
                    <input type="date" name="fecha" value={formData.fecha} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500" required disabled={cargando || !cuenta} />
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <label className="block text-gray-700 text-sm font-bold mb-2 cursor-pointer">
                        📸 Evidencia (Foto o Certificado)
                        <input
                            type="file"
                            onChange={handleFileChange}
                            className="hidden"
                            disabled={cargando || !cuenta}
                            accept="image/*,.pdf"
                        />
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                        {archivo ? `✅ ${archivo.name}` : 'Subir a Aleph.im'}
                    </p>
                </div>

                <button type="submit" disabled={cargando || !cuenta} className={`w-full font-bold py-3 px-4 rounded-lg transition-colors text-white ${cargando || !cuenta ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}>
                    {cargando ? 'Registrando...' : 'Registrar en HuellaNativa'}
                </button>
            </form>

            {mensaje.texto && (
                <div className={`mt-4 p-3 rounded-lg text-sm text-center ${mensaje.tipo === 'error' ? 'bg-red-100 text-red-700' : mensaje.tipo === 'exito' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                    {mensaje.texto}
                </div>
            )}
        </div>
    );
}