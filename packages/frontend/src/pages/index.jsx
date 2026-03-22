import Head from 'next/head';
import { useState } from 'react';
import dynamic from 'next/dynamic';
const UpdateStateForm = dynamic(() => import('../components/UpdateStateFormV2'), { ssr: false });
import Timeline from '../components/Timeline';

export default function Home() {
    // Estado para controlar qué lote estamos buscando en la línea de tiempo
    const [idBusqueda, setIdBusqueda] = useState('');
    const [idActivo, setIdActivo] = useState(null);

    const buscarLote = (e) => {
        e.preventDefault();
        // Al buscar, activamos el componente Timeline con el ID específico
        setIdActivo(idBusqueda);
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-12">
            <Head>
                <title>HuellaNativa | Trazabilidad Inmutable</title>
                <meta name="description" content="Trazabilidad agrícola en blockchain para Ecuador" />
            </Head>

            {/* Header o Barra de Navegación Simple */}
            <header className="bg-green-800 text-white p-5 shadow-md">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <span className="text-3xl">🌿</span>
                        <h1 className="text-2xl font-extrabold tracking-tight">HuellaNativa</h1>
                    </div>
                    <p className="text-green-100 text-sm hidden md:block font-medium">
                        Empoderando productores a través de la transparencia
                    </p>
                </div>
            </header>

            <main className="max-w-6xl mx-auto p-6 mt-6 grid grid-cols-1 lg:grid-cols-2 gap-10">

                {/* COLUMNA IZQUIERDA: Escribir en la Blockchain (El Productor) */}
                <section>
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-gray-800 border-b-2 border-green-500 pb-2 inline-block">
                            Panel del Productor
                        </h2>
                        <p className="text-gray-600 mt-2 text-sm">
                            Registra un nuevo lote agrícola. La información se guardará de forma inmutable en la red Ethereum (Sepolia).
                        </p>
                    </div>

                    <UpdateStateForm />
                </section>

                {/* COLUMNA DERECHA: Leer de la Blockchain (El Consumidor/Jurado) */}
                <section>
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-gray-800 border-b-2 border-blue-500 pb-2 inline-block">
                            Vista del Consumidor
                        </h2>
                        <p className="text-gray-600 mt-2 text-sm">
                            Simula el escaneo de un código QR. Ingresa el ID de un lote para verificar su viaje real.
                        </p>
                    </div>

                    {/* Buscador de Lote */}
                    <form onSubmit={buscarLote} className="mb-6 flex gap-2">
                        <input
                            type="number"
                            placeholder="Ingresa el ID del Lote (Ej: 1)"
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 shadow-sm"
                            value={idBusqueda}
                            onChange={(e) => setIdBusqueda(e.target.value)}
                            required
                        />
                        <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-sm"
                        >
                            Verificar Origen
                        </button>
                    </form>

                    {/* Contenedor de la Línea de Tiempo */}
                    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 min-h-[420px]">
                        {idActivo ? (
                            // Si hay un ID buscado, renderizamos el componente que lee de la blockchain
                            <Timeline idLote={idActivo} />
                        ) : (
                            // Estado inicial vacío
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 mt-20">
                                <span className="text-5xl mb-4 opacity-50">🔍</span>
                                <p className="text-center">Ingresa un ID de lote arriba<br />para descubrir su historia.</p>
                            </div>
                        )}
                    </div>
                </section>

            </main>
        </div>
    );
}