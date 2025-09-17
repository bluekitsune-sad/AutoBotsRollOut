const {
    exec
} = require('child_process');
const {
    platform
} = require('os');
const fs = require('fs');
const readline = require('readline');


// Log file path for recording installation progress
const logFile = 'install_log.txt';

// List of software packages to install or upgrade with Chocolatey
const packages = [
    'python', // Python (Programming language)
    'vscode', // Visual Studio Code (Text editor/IDE)
    'androidstudio', // Android Studio (Android app development IDE)
    'git', // Git (Version control system)
    'nodejs', // Node.js (JavaScript runtime)
    '7zip', // 7-Zip (File archiver)
    'googlechrome', // Google Chrome (Web browser)
    'firefox', // Firefox (Web browser)
    'dotnetfx', // .NET Framework (Development platform)
    'docker-desktop', // Docker (Containerization platform)
    'anaconda3', // Anaconda (Python distribution for data science)
    'tesseract', // Tesseract (OCR tool for text recognition)
    'utorrent', // uTorrent (Torrent client)
    'epicgameslauncher', // Epic Games Launcher (Game store and management)
    'steam', // Steam (Digital distribution platform for games)
    'mongodb --pre', // MongoDB (NoSQL database, pre-release version)
    'mongodb-compass', // MongoDB Compass (GUI for MongoDB)
    'winrar', // WinRAR (File archiver)
    'discord', // Discord (Communication platform for gamers)
    'obs-studio', // OBS Studio (Screen recording and live streaming)
    'postman', // Postman (API testing and development tool)
    'telegram', // Telegram (Messaging app)
    'libreoffice-fresh', // LibreOffice (Free office suite)

    // Additional packages for development, productivity, and cloud services
    // 'visualstudio2019community', // Visual Studio Community (IDE for .NET, C++, etc.)
    'awscli', // AWS CLI (Amazon Web Services command line tool)
    'azure-cli', // Azure CLI (Microsoft Azure command line tool)
    'terraform', // Terraform (Infrastructure as Code tool)
    'slack', // Slack (Team communication tool)
    'notepadplusplus', // Notepad++ (Text editor)
    'figma', // Figma (Design and collaboration tool)
    'zoom', // Zoom (Video conferencing tool)
    'postgresql', // PostgreSQL (Relational database management system)
    'mysql', // MySQL (Relational database management system)
    'gimp', // GIMP (Image editor)
    'blender', // Blender (3D modeling and rendering software)
    'vagrant', // Vagrant (Tool for building virtualized environments)
    'powershell-core', // PowerShell Core (Cross-platform version of PowerShell)
    'gh', // GitHub CLI (GitHub command-line interface)
    'dbeaver', // DBeaver (Universal database management tool)
    'sqlite' // SQLite (Lightweight relational database engine)
];


// Function to execute a shell command and return a promise
// This will allow us to use `async/await` to handle command execution and errors
function runCommand(command) {
    logToFile(`Running command: ${command}`);
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                logToFile(`Error executing command: ${stderr || error.message}`);
                reject(`Error: ${stderr || error.message}`); // Reject with error message
            } else {
                logToFile(`Command executed successfully: ${stdout}`);
                resolve(stdout); // Resolve with the command output
            }
        });
    });
}

// Function to check if the script is running with administrator privileges
async function checkAdminPrivileges() {
    try {
        // Try to execute 'NET SESSION', which requires admin privileges
        await runCommand('NET SESSION');
        console.log('Running with administrator privileges!');
    } catch (error) {
        // If it fails, that means admin privileges are not granted
        console.log('Requesting administrative privileges...');
        const scriptPath = process.argv[1]; // Get the path of the script
        if (platform() === 'win32') {
            // If on Windows, relaunch the script with elevated privileges
            await runCommand(`powershell -Command "Start-Process -FilePath '${scriptPath}' -Verb RunAs"`);
            process.exit(); // Exit the current process after relaunching with admin rights
        } else {
            console.log('Administrator privileges required for this operation.');
        }
    }
}

// Function to log messages to a file
function logToFile(message) {
    const timestamp = new Date().toISOString(); // Add a timestamp for each log entry
    fs.appendFileSync(logFile, `[${timestamp}] ${message}\n`); // Append the log entry to the log file
}

// Function to update Chocolatey itself (the package manager)
async function updateChocolatey() {
    console.log('Updating Chocolatey...');
    await runCommand('choco upgrade chocolatey -y'); // Upgrade Chocolatey to the latest version
}

async function cleanup() {
    logToFile('Cleaning up temporary files and cache...');
    await runCommand('choco clean'); // Clean up Chocolatey cache and temporary files
    logToFile('Cleanup completed.');
}

// Check in the choco list for already downloaded packages
async function checkIfPackageInstalled(pkg) {
    try {
        const result = await runCommand(`choco list --local-only ${pkg}`); // List local packages and check for the specified package
        return result.includes(pkg); // If the package exists, return true
    } catch (error) {
        return false; // If an error occurs, assume the package isn't installed
    }
}

// Function to install or upgrade the list of packages
async function installPackages() {
    // Loop through each package and try to install or upgrade it using Chocolatey
    const installPromises = packages.map(async (pkg) => {
        try {
            const isInstalled = await checkIfPackageInstalled(pkg); // Check if the package is already installed
            if (!isInstalled) {
                logToFile(`Installing ${pkg}...`);
                await runCommand(`choco upgrade ${pkg} -y --ignore-checksums`); // Install or upgrade the package
                logToFile(`${pkg} installed or upgraded successfully.`);
            } else {
                logToFile(`${pkg} is already installed.`);
            }
        } catch (error) {
            // If an error occurs, log a warning
            logToFile(`WARNING: Installation or upgrade of ${pkg} may have failed. Please check logs.`);
            console.log(`WARNING: Installation or upgrade of ${pkg} may have failed. Please check logs.`);
        }
    });

    // Wait for all the installations to complete (in parallel)
    await Promise.allSettled(installPromises);
}


// Function to install dependencies before installing the main package
async function installWithDependencies(pkg, dependencies) {
    // Install dependencies first
    for (const dep of dependencies) {
        const isDepInstalled = await checkIfPackageInstalled(dep);
        if (!isDepInstalled) {
            logToFile(`Installing dependency: ${dep}...`);
            await runCommand(`choco install ${dep} -y`);
            logToFile(`Dependency ${dep} installed.`);
        }
    }
    // Install the main package after its dependencies
    logToFile(`Installing ${pkg}...`);
    await runCommand(`choco install ${pkg} -y`);
    logToFile(`${pkg} installed.`);
}

// Function to install and update WSL
async function installOrUpdateWSL() {
    try {
        // Check if WSL is installed by running 'wsl --list'
        const wslCheck = await runCommand('wsl --list');
        if (!wslCheck) {
            logToFile('Installing WSL...');
            console.log('Installing WSL...');
            await runCommand('choco install wsl -y'); // Install WSL using Chocolatey
            logToFile('WSL installation completed.');
        } else {
            logToFile('WSL is already installed. Updating...');
            console.log('Updating WSL...');
            await runCommand('wsl --update'); // Update WSL to the latest version
            logToFile('WSL update completed.');
        }

        // Optionally, set the default distro (e.g., Ubuntu)
        logToFile('Setting default WSL distribution...');
        console.log('Setting default WSL distribution...');
        await runCommand('wsl --set-default Ubuntu'); // Set Ubuntu as the default distribution
        logToFile('Default WSL distribution set to Ubuntu.');
    } catch (error) {
        logToFile(`Error managing WSL: ${error.message}`);
        console.error('Error managing WSL:', error);
    }
}

// Function to update drivers using Windows Update (optional)
async function updateDrivers() {
    try {
        logToFile('Updating drivers via Windows Update...');
        console.log('Updating drivers via Windows Update...');
        await runCommand('powershell -Command "Install-WindowsUpdate -AcceptAll -IgnoreReboot"');
        logToFile('Drivers update completed!');
        console.log('Drivers update completed!');
    } catch (error) {
        logToFile(`Error updating drivers using Windows Update: ${error.message}`);
        console.error('Error updating drivers using Windows Update:', error);
    }
}

// Function to use Driver Booster for updating drivers (if installed via Chocolatey)
async function updateDriversWithDriverBooster() {
    try {
        console.log('Using Driver Booster to update drivers...');
        await runCommand('choco install driverbooster -y'); // Install Driver Booster
        await runCommand('driverbooster update'); // Update drivers with Driver Booster
        console.log('Driver Booster update completed!');
    } catch (error) {
        console.error('Error updating drivers with Driver Booster:', error);
    }
}

// Funtion to promp user for restrat
async function promptForRestart() {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.question('A system restart may be required. Do you want to restart now? (y/n): ', (answer) => {
            rl.close();
            resolve(answer.toLowerCase() === 'y');
        });
    });
}

// Main function that runs all tasks sequentially
async function main() {
    try {

        const args = process.argv.slice(2); // Get command-line arguments
        const isWslUpdateOnly = args.includes('--wsl'); // Check for --wsl flag
        const isDriverUpdateOnly = args.includes('--driver'); // Check for --driver flag
        const isPakagesOnly = args.includes('--pack'); // Check for --pack flag

        
        // Step 1: Check if the script is running with admin privileges
        await checkAdminPrivileges();

        // Step 2: Update Chocolatey to ensure we're using the latest version
        await updateChocolatey();

        // Step 3: Install or update WSL
        await installOrUpdateWSL();

        // Step 4: updating drivers
        // Update drivers either via Windows Update or Driver Booster
        await updateDrivers(); // or use await updateDriversWithDriverBooster();

        // Step 5: Install or upgrade all the packages
        await installPackages();

        // Step 6: Cleanup temporary files and caches after installation
        await cleanup();

        // Step 7: Prompt for system restart if needed
        const restartNeeded = await promptForRestart();
        if (restartNeeded) {
            console.log('Restarting system...');
            await runCommand('shutdown -r -t 0');
        }

        // Log the success message
        logToFile('All tasks completed successfully.');
    } catch (error) {
        // If an error occurs at any point, log the error to the file
        logToFile(`Error: ${error}`);
        console.error('Error:', error); // Also log it to the console
    }
}

// Run the main function to start the process
main();
