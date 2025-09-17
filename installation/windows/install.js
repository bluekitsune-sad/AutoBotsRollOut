const { exec } = require('child_process');
const { platform } = require('os');

// Function to execute a shell command and return a promise
// This will allow us to use `async/await` to handle command execution and errors
function runCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(`Error: ${stderr || error.message}`); // Reject with error message
      } else {
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

// Function to update Chocolatey itself (the package manager)
async function updateChocolatey() {
  console.log('Updating Chocolatey...');
  await runCommand('choco upgrade chocolatey -y'); // Upgrade Chocolatey to the latest version
}

// Check in the choco list for already downloaded packages
async function checkIfPackageInstalled(pkg) {
  try {
    const result = await runCommand(`choco list --local-only ${pkg}`);
    return result.includes(pkg);
  } catch (error) {
    return false;
  }
}


// Function to install or upgrade the list of packages
async function installPackages() {
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

  // Loop through each package and try to install or upgrade it using Chocolatey
  for (const pkg of packages) {
    try {
      const isInstalled = await checkIfPackageInstalled(pkg);
      if (!isInstalled):
        console.log(`Installing or upgrading ${pkg}...`);
        await runCommand(`choco upgrade ${pkg} -y --ignore-checksums`); // Upgrade or install the package
        console.log(`${pkg} installed or upgraded successfully.`); // Log success
      } else {
      console.log(`${pkg} is already installed.`);
    }
    } catch (error) {
      // If an error occurs, log a warning
      console.log(`WARNING: Installation or upgrade of ${pkg} may have failed. Please check logs.`);
    }
  }
}


// Function to install and update WSL
async function installOrUpdateWSL() {
  try {
    // Check if WSL is installed by running 'wsl --list'
    const wslCheck = await runCommand('wsl --list');
    if (!wslCheck) {
      console.log('Installing WSL...');
      await runCommand('choco install wsl -y'); // Install WSL using Chocolatey
    } else {
      console.log('Updating WSL...');
      await runCommand('wsl --update'); // Update WSL to the latest version
    }

    // Optionally, set the default distro (e.g., Ubuntu)
    console.log('Setting default WSL distribution...');
    await runCommand('wsl --set-default Ubuntu'); // Set Ubuntu as the default distribution
  } catch (error) {
    console.error('Error managing WSL:', error);
  }
}

// Function to update drivers using Windows Update (optional)
async function updateDrivers() {
  try {
    console.log('Updating drivers via Windows Update...');
    await runCommand('powershell -Command "Install-WindowsUpdate -AcceptAll -IgnoreReboot"');
    console.log('Drivers update completed!');
  } catch (error) {
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

// Main function that runs all tasks sequentially
async function main() {
  try {
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
    
    console.log('All packages processed.'); // Final success message
  } catch (error) {
    // Catch and log any errors that occurred during the process
    console.error('Error:', error);
  }
}

// Run the main function to start the process
main();

