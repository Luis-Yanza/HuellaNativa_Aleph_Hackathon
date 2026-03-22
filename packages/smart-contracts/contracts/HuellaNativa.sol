// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract HuellaNativa {
    address public owner;

    // 1. EL EVENTO: Tu base de datos histórica (Barato y eficiente)
    // El frontend leerá esto para dibujar la línea de tiempo.
    event NuevoEstadoRegistrado(
        uint256 indexed idLote,
        string estado,
        address indexed responsable,
        string ubicacion,
        string hashDocumentoAleph, // <-- ¡El puente mágico con Aleph!
        uint256 timestamp
    );

    // 2. LA ESTRUCTURA: El estado *actual* del producto
    struct Lote {
        uint256 id;
        string descripcion;
        string estadoActual;
        address responsableActual;
        bool existe;
    }

    // 3. ALMACENAMIENTO MÍNIMO
    mapping(uint256 => Lote) public inventario;
    uint256 public contadorLotes;

    // 4. SEGURIDAD (Reglas de negocio)
    modifier soloResponsable(uint256 _idLote) {
        require(inventario[_idLote].responsableActual == msg.sender, "No eres el responsable actual de este lote");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Solo el administrador puede crear lotes");
        _;
    }

    constructor() {
        owner = msg.sender; // Quien despliegue el contrato es el dueño inicial
    }

    // 5. FUNCIÓN: Nace el producto (Finca / Origen)
    function crearLote(string memory _descripcion, string memory _ubicacion, string memory _hashAleph) public onlyOwner {
        contadorLotes++;
        inventario[contadorLotes] = Lote({
            id: contadorLotes,
            descripcion: _descripcion,
            estadoActual: "Origen / Creado",
            responsableActual: msg.sender,
            existe: true
        });

        // Gritamos a la blockchain que nació un nuevo lote
        emit NuevoEstadoRegistrado(contadorLotes, "Origen / Creado", msg.sender, _ubicacion, _hashAleph, block.timestamp);
    }

    // 6. FUNCIÓN: El producto se mueve (Transporte, Proceso, Venta)
    function actualizarEstado(
        uint256 _idLote,
        string memory _nuevoEstado,
        string memory _ubicacion,
        address _nuevoResponsable,
        string memory _hashAleph
    ) public soloResponsable(_idLote) {
        require(inventario[_idLote].existe, "El lote no existe");

        // Cambiamos el estado y le pasamos la "batuta" (responsabilidad) a la siguiente wallet
        inventario[_idLote].estadoActual = _nuevoEstado;
        inventario[_idLote].responsableActual = _nuevoResponsable;

        // Gritamos a la blockchain el nuevo paso en la historia
        emit NuevoEstadoRegistrado(_idLote, _nuevoEstado, msg.sender, _ubicacion, _hashAleph, block.timestamp);
    }
}