import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../utils/constants';

export default function Timeline({ idLote }) {
    const [eventos, setEventos] = useState([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        const cargarHistorial = async () => {
            try {
                // 1. Conectamos a la red (Modo lectura, no requiere que el usuario conecte MetaMask)
                const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
                const provider = new ethers.JsonRpcProvider(rpcUrl);
                const contrato = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

                // 2. Filtramos los eventos de la blockchain (Si le pasamos un idLote, busca solo ese)
                const filtro = contrato.filters.NuevoEstadoRegistrado(idLote ? idLote : null);

                // Evitamos el error "exceed maximum block range: 50000" de los RPC públicos
                const currentBlock = await provider.getBlockNumber();
                const fromBlock = currentBlock - 49000 > 0 ? currentBlock - 49000 : 0;

                const logs = await contrato.queryFilter(filtro, fromBlock, 'latest');

                // 3. Traducimos los datos criptográficos a algo legible consultando el inventario base
                const historialBase = await Promise.all(logs.map(async log => {
                    const idLote = log.args[0];
                    const estadoOriginalEvento = log.args[1];
                    
                    // Consultamos la descripción/metadatos originales del lote
                    // ya que el evento "crearLote" hardcodeó el estado como "Origen / Creado"
                    const loteInfo = await contrato.inventario(idLote);
                    const descripcionInicial = loteInfo[1]; // El campo 'descripcion' de la struct
                    
                    let producto = estadoOriginalEvento;
                    let productor = null;
                    let fechaProduccion = null;
                    
                    try {
                        const parsing = JSON.parse(descripcionInicial);
                        if (parsing.producto) {
                            // Si el evento en la blockchain dice "Origen / Creado", lo reemplazamos por el nombre del producto real.
                            // Si el evento es un estado posterior (Ej: "Transporte"), mostramos ese estado y adjuntamos la data original.
                            producto = estadoOriginalEvento === "Origen / Creado" || estadoOriginalEvento === "" ? parsing.producto : estadoOriginalEvento;
                            productor = parsing.productor;
                            fechaProduccion = parsing.fecha;
                        }
                    } catch(e) { 
                        // Es un registro antiguo (texto plano en la descripción inicial)
                        if (estadoOriginalEvento === "Origen / Creado") {
                            producto = descripcionInicial || estadoOriginalEvento;
                        }
                    }

                    return {
                        idLote: idLote.toString(),
                        estado: producto,
                        productoBase: producto, // Por si se necesita el nombre después
                        productor: productor,
                        fechaProduccion: fechaProduccion,
                        responsable: log.args[2],
                        ubicacion: log.args[3],
                        hashAleph: log.args[4],
                        fecha: new Date(Number(log.args[5]) * 1000).toLocaleString(),
                    };
                }));

                // Invertimos el array para que el evento más reciente salga arriba
                setEventos(historialBase.reverse());
            } catch (error) {
                console.error("Error al consultar la blockchain:", error);
            } finally {
                setCargando(false);
            }
        };

        cargarHistorial();
    }, [idLote]);

    if (cargando) return <div className="text-center p-8 text-green-600 animate-pulse">Consultando la blockchain inmutable...</div>;
    if (eventos.length === 0) return <div className="text-center p-8 text-gray-500">Aún no hay registros de trazabilidad para este producto.</div>;

    return (
        <div className="max-w-2xl mx-auto p-4 font-sans">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Trazabilidad de HuellaNativa</h2>

            <div className="border-l-4 border-green-500 ml-4 space-y-6 relative">
                {eventos.map((evento, index) => (
                    <div key={index} className="pl-6 relative">
                        {/* Nodo visual de la línea de tiempo */}
                        <div className="absolute w-4 h-4 bg-green-600 rounded-full -left-[10px] top-1 shadow"></div>

                        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <span className="text-xs text-gray-400 font-mono tracking-wide">Registro Blockchain: {evento.fecha}</span>
                            <h3 className="text-lg font-bold text-gray-900 mt-1">{evento.estado}</h3>
                            
                            <div className="mt-3 space-y-1">
                                <p className="text-sm text-gray-600">🌍 <strong>Ubicación del Productor:</strong> {evento.ubicacion}</p>
                                {evento.productor && (
                                    <p className="text-sm text-gray-600">👨‍🌾 <strong>Nombre del Productor:</strong> {evento.productor}</p>
                                )}
                                {evento.fechaProduccion && (
                                    <p className="text-sm text-gray-600">📅 <strong>Fecha de Producción:</strong> {evento.fechaProduccion}</p>
                                )}
                            </div>

                            <div className="mt-4 p-2 bg-gray-50 rounded text-xs font-mono text-gray-500 break-all">
                                👤 <strong>Firmado por:</strong> {evento.responsable}
                            </div>

                            {/* Aquí mostramos el botón de Aleph si existe un hash de documento/foto */}
                            {evento.hashAleph && evento.hashAleph !== "Sin evidencia" && (
                                <a
                                    href={`https://api2.aleph.im/api/v0/storage/raw/${evento.hashAleph}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center mt-4 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-100 transition-colors"
                                >
                                    📎 Ver evidencia en Aleph
                                </a>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}