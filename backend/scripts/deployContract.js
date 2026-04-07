const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const solc = require('solc');

async function deploy() {
    console.log('Starting deployment to Ganache...');

    // 1. Compile Contract
    // Ensure this path matches your actual file name (StorageMetadata.sol)
    const contractPath = path.join(__dirname, '../../contracts/StorageMetadata.sol');
    if (!fs.existsSync(contractPath)) {
        console.error(`Error: Contract not found at ${contractPath}`);
        process.exit(1);
    }
    const source = fs.readFileSync(contractPath, 'utf8');

    const input = {
        language: 'Solidity',
        sources: {
            'StorageMetadata.sol': {
                content: source,
            },
        },
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
            // FORCE 'london' to avoid 'Invalid EVM version' / PUSH0 errors in Ganache
            evmVersion: "london", 
            outputSelection: {
                "*": {
                    "*": ["abi", "evm.bytecode"],
                },
            },
        },
    };

    console.log('Compiling...');
    const output = JSON.parse(solc.compile(JSON.stringify(input)));

    if (output.errors) {
        output.errors.forEach(err => {
            if (err.severity === 'error') {
                console.error('Solidity Error:', err.formattedMessage);
            } else {
                console.warn('Solidity Warning:', err.formattedMessage);
            }
        });
        if (output.errors.some(e => e.severity === 'error')) process.exit(1);
    }

    const contractFile = output.contracts['StorageMetadata.sol']['StorageMetadata'];
    const abi = contractFile.abi;
    const bytecode = contractFile.evm.bytecode.object;

    // 2. Connect to Ganache
    // Ensure this matches your Ganache Port (usually 7545 for GUI, 8545 for CLI)
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:7545');
    
    // Get the first account from Ganache
    const signer = await provider.getSigner(0);
    const accountAddress = await signer.getAddress();
    console.log('Deploying with account:', accountAddress);

    // 3. Deploy
    const factory = new ethers.ContractFactory(abi, bytecode, signer);
    const contract = await factory.deploy();
    
    console.log('Waiting for deployment transaction...');
    await contract.waitForDeployment();

    const address = await contract.getAddress();
    console.log('✅ Contract deployed at:', address);

    // 4. Update .env file
    const envPath = path.join(__dirname, '../.env');
    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

    // Update or Append CONTRACT_ADDRESS
    const regex = /^CONTRACT_ADDRESS=.*$/m;
    const newEntry = `CONTRACT_ADDRESS=${address}`;

    if (envContent.match(regex)) {
        envContent = envContent.replace(regex, newEntry);
    } else {
        envContent += `\n${newEntry}`;
    }

    // Ensure ETH_PROVIDER_URL is correctly set
    if (!envContent.includes('ETH_PROVIDER_URL')) {
        envContent += `\nETH_PROVIDER_URL=http://127.0.0.1:7545`;
    } else {
        envContent = envContent.replace(/ETH_PROVIDER_URL=.*/, 'ETH_PROVIDER_URL=http://127.0.0.1:7545');
    }

    fs.writeFileSync(envPath, envContent);
    console.log('Successfully updated backend/.env with new contract address.');
}

// 5. Execute with Top-Level Async Wrapper
(async () => {
    try {
        await deploy();
        process.exit(0);
    } catch (error) {
        console.error("Critical Deployment Failure:");
        console.error(error);
        process.exit(1);
    }
})();