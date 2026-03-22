const hre = require("hardhat");

async function main() {
  console.log("Iniciando el despliegue de HuellaNativa...");

  // Obtenemos el contrato compilado
  const HuellaNativa = await hre.ethers.getContractFactory("HuellaNativa");
  
  // Desplegamos en la red
  const huella = await HuellaNativa.deploy();

  // Esperamos a que la red de Sepolia confirme la transacción
  await huella.waitForDeployment();

  const address = await huella.getAddress();

  console.log("=================================================");
  console.log(`✅ ¡ÉXITO! HuellaNativa está vivo en Sepolia.`);
  console.log(`📍 Dirección del contrato: ${address}`);
  console.log("=================================================");
  console.log("Copia esta dirección y ponla en el .env de tu Frontend.");
}

// Ejecutar el script y manejar errores
main().catch((error) => {
  console.error("Error durante el despliegue:", error);
  process.exitCode = 1;
});