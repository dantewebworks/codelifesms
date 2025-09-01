#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration file path
const CONFIG_FILE = path.join(__dirname, 'startup-config.json');

// Default configuration
const DEFAULT_CONFIG = {
    backend: {
        port: 3000,
        autoStart: true
    },
    ngrok: {
        autoStart: true,
        port: 3000,
        region: 'us'
    },
    telnyx: {
        apiKey: '',
        connectionId: '',
        phoneNumbers: []
    },
    webhooks: {
        smsWebhookUrl: '',
        voiceWebhookUrl: ''
    },
    autoOpen: {
        dashboard: true,
        url: 'file:///Users/danteactiveleads/Desktop/CodeLifeSMS/sms-dashboard-fixed.html'
    }
};

class StartupManager {
    constructor() {
        this.processes = new Map();
        this.config = this.loadConfig();
    }

    // Load or create configuration
    loadConfig() {
        try {
            if (fs.existsSync(CONFIG_FILE)) {
                const savedConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
                return { ...DEFAULT_CONFIG, ...savedConfig };
            } else {
                this.saveConfig(DEFAULT_CONFIG);
                return DEFAULT_CONFIG;
            }
        } catch (error) {
            console.error('Error loading config:', error);
            return DEFAULT_CONFIG;
        }
    }

    // Save configuration
    saveConfig(config) {
        try {
            fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
            console.log('✅ Configuration saved successfully');
        } catch (error) {
            console.error('❌ Error saving config:', error);
        }
    }

    // Update configuration
    updateConfig(updates) {
        this.config = { ...this.config, ...updates };
        this.saveConfig(this.config);
    }

    // Kill existing processes
    async killExistingProcesses() {
        console.log('🔄 Killing existing processes...');
        
        const commands = [
            "pkill -f 'node server.js'",
            "pkill -f 'ngrok'",
            "lsof -ti:3000 | xargs kill -9 2>/dev/null || true"
        ];

        for (const command of commands) {
            try {
                await this.execCommand(command);
            } catch (error) {
                // Ignore errors for processes that don't exist
            }
        }
        
        console.log('✅ Existing processes killed');
    }

    // Start backend server
    async startBackend() {
        if (!this.config.backend.autoStart) {
            console.log('⏭️  Backend auto-start disabled');
            return;
        }

        console.log('🚀 Starting backend server...');
        
        const serverProcess = spawn('node', ['server.js'], {
            stdio: 'inherit',
            cwd: __dirname
        });

        this.processes.set('backend', serverProcess);

        serverProcess.on('error', (error) => {
            console.error('❌ Backend error:', error);
        });

        // Wait for backend to start
        await this.waitForPort(this.config.backend.port);
        console.log('✅ Backend server started');
    }

    // Start ngrok tunnel
    async startNgrok() {
        if (!this.config.ngrok.autoStart) {
            console.log('⏭️  Ngrok auto-start disabled');
            return;
        }

        console.log('🌐 Starting ngrok tunnel...');
        
        const ngrokProcess = spawn('ngrok', [
            'http', 
            this.config.ngrok.port.toString(),
            '--region', this.config.ngrok.region
        ], {
            stdio: 'pipe',
            cwd: __dirname
        });

        this.processes.set('ngrok', ngrokProcess);

        let ngrokUrl = '';
        ngrokProcess.stdout.on('data', (data) => {
            const output = data.toString();
            console.log('🌐 Ngrok:', output.trim());
            
            // Extract ngrok URL
            const urlMatch = output.match(/https:\/\/[a-zA-Z0-9-]+\.ngrok-free\.app/);
            if (urlMatch && !ngrokUrl) {
                ngrokUrl = urlMatch[0];
                console.log('✅ Ngrok URL:', ngrokUrl);
                
                // Update webhook URLs
                this.updateWebhookUrls(ngrokUrl);
            }
        });

        ngrokProcess.stderr.on('data', (data) => {
            console.error('❌ Ngrok error:', data.toString());
        });

        // Wait for ngrok to start
        await this.waitForNgrok();
    }

    // Update webhook URLs with ngrok URL
    async updateWebhookUrls(ngrokUrl) {
        const webhookUrls = {
            smsWebhookUrl: `${ngrokUrl}/webhook/sms`,
            voiceWebhookUrl: `${ngrokUrl}/webhook/voice`
        };

        this.config.webhooks = { ...this.config.webhooks, ...webhookUrls };
        this.saveConfig(this.config);

        console.log('🔗 Webhook URLs updated:');
        console.log('   SMS:', webhookUrls.smsWebhookUrl);
        console.log('   Voice:', webhookUrls.voiceWebhookUrl);

        // Update config.js with new webhook URLs
        await this.updateConfigFile(webhookUrls);
    }

    // Update config.js file
    async updateConfigFile(webhookUrls) {
        const configPath = path.join(__dirname, 'config.js');
        const configContent = `module.exports = {
    // Telnyx Configuration via environment variables (do not commit secrets)
    apiKey: process.env.TELNYX_API_KEY || '',
    connectionId: process.env.TELNYX_CONNECTION_ID || '',

    // Webhook URLs
    smsWebhookUrl: process.env.SMS_WEBHOOK_URL || '${webhookUrls.smsWebhookUrl}',
    voiceWebhookUrl: process.env.VOICE_WEBHOOK_URL || '${webhookUrls.voiceWebhookUrl}',

    // Server Configuration
    port: parseInt(process.env.PORT || '${this.config.backend.port}', 10),

    // Phone Numbers (comma-separated in TELNYX_PHONE_NUMBERS)
    phoneNumbers: (process.env.TELNYX_PHONE_NUMBERS || '')
        .split(',')
        .map(n => n.trim())
        .filter(Boolean)
};`;

        try {
            fs.writeFileSync(configPath, configContent);
            console.log('✅ config.js updated with new webhook URLs');
        } catch (error) {
            console.error('❌ Error updating config.js:', error);
        }
    }

    // Open dashboard in browser
    async openDashboard() {
        if (!this.config.autoOpen.dashboard) {
            console.log('⏭️  Auto-open dashboard disabled');
            return;
        }

        console.log('🌐 Opening dashboard...');
        
        const platform = process.platform;
        let command;
        
        switch (platform) {
            case 'darwin': // macOS
                command = `open "${this.config.autoOpen.url}"`;
                break;
            case 'win32': // Windows
                command = `start "${this.config.autoOpen.url}"`;
                break;
            default: // Linux
                command = `xdg-open "${this.config.autoOpen.url}"`;
                break;
        }

        try {
            await this.execCommand(command);
            console.log('✅ Dashboard opened in browser');
        } catch (error) {
            console.error('❌ Error opening dashboard:', error);
        }
    }

    // Wait for port to be available
    async waitForPort(port, timeout = 30000) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            try {
                const net = require('net');
                const socket = new net.Socket();
                
                await new Promise((resolve, reject) => {
                    socket.setTimeout(1000);
                    socket.on('connect', () => {
                        socket.destroy();
                        resolve();
                    });
                    socket.on('timeout', () => {
                        socket.destroy();
                        reject(new Error('Timeout'));
                    });
                    socket.on('error', () => {
                        socket.destroy();
                        reject(new Error('Connection failed'));
                    });
                    socket.connect(port, 'localhost');
                });
                
                return; // Port is available
            } catch (error) {
                await this.sleep(1000);
            }
        }
        
        throw new Error(`Port ${port} not available after ${timeout}ms`);
    }

    // Wait for ngrok to start
    async waitForNgrok(timeout = 30000) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            try {
                const response = await fetch('http://localhost:4040/api/tunnels');
                if (response.ok) {
                    console.log('✅ Ngrok API is ready');
                    return;
                }
            } catch (error) {
                // Ngrok API not ready yet
            }
            
            await this.sleep(1000);
        }
        
        console.log('⚠️  Ngrok may not be fully ready, but continuing...');
    }

    // Execute command
    execCommand(command) {
        return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(stdout);
                }
            });
        });
    }

    // Sleep utility
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Start all services
    async start() {
        console.log('🚀 Starting CodeLife SMS Platform...');
        console.log('📋 Configuration loaded from:', CONFIG_FILE);
        
        try {
            // Kill existing processes
            await this.killExistingProcesses();
            
            // Start backend
            await this.startBackend();
            
            // Start ngrok
            await this.startNgrok();
            
            // Open dashboard
            await this.openDashboard();
            
            console.log('\n🎉 CodeLife SMS Platform is ready!');
            console.log('📱 Dashboard:', this.config.autoOpen.url);
            console.log('🔗 SMS Webhook:', this.config.webhooks.smsWebhookUrl);
            console.log('🔗 Voice Webhook:', this.config.webhooks.voiceWebhookUrl);
            console.log('\n💡 Press Ctrl+C to stop all services');
            
            // Handle graceful shutdown
            process.on('SIGINT', () => {
                console.log('\n🛑 Shutting down...');
                this.shutdown();
            });
            
        } catch (error) {
            console.error('❌ Startup failed:', error);
            this.shutdown();
        }
    }

    // Shutdown all services
    shutdown() {
        console.log('🔄 Stopping all services...');
        
        for (const [name, process] of this.processes) {
            console.log(`🛑 Stopping ${name}...`);
            process.kill();
        }
        
        console.log('✅ All services stopped');
        process.exit(0);
    }

    // Show status
    async status() {
        console.log('📊 CodeLife SMS Platform Status:');
        console.log('================================');
        
        // Check backend
        try {
            const response = await fetch(`http://localhost:${this.config.backend.port}/api/test`);
            if (response.ok) {
                console.log('✅ Backend: Running');
            } else {
                console.log('❌ Backend: Not responding');
            }
        } catch (error) {
            console.log('❌ Backend: Not running');
        }
        
        // Check ngrok
        try {
            const response = await fetch('http://localhost:4040/api/tunnels');
            if (response.ok) {
                const tunnels = await response.json();
                console.log('✅ Ngrok: Running');
                tunnels.tunnels.forEach(tunnel => {
                    console.log(`   ${tunnel.proto}: ${tunnel.public_url}`);
                });
            } else {
                console.log('❌ Ngrok: Not responding');
            }
        } catch (error) {
            console.log('❌ Ngrok: Not running');
        }
        
        // Show configuration
        console.log('\n📋 Configuration:');
        console.log('   Backend Port:', this.config.backend.port);
        console.log('   SMS Webhook:', this.config.webhooks.smsWebhookUrl);
        console.log('   Voice Webhook:', this.config.webhooks.voiceWebhookUrl);
        console.log('   Phone Numbers:', this.config.telnyx.phoneNumbers.join(', '));
    }
}

// CLI interface
async function main() {
    const manager = new StartupManager();
    const command = process.argv[2];

    switch (command) {
        case 'start':
            await manager.start();
            break;
        case 'status':
            await manager.status();
            break;
        case 'config':
            console.log('📋 Current configuration:');
            console.log(JSON.stringify(manager.config, null, 2));
            break;
        case 'reset':
            manager.saveConfig(DEFAULT_CONFIG);
            console.log('✅ Configuration reset to defaults');
            break;
        default:
            console.log('🚀 CodeLife SMS Platform Startup Manager');
            console.log('==========================================');
            console.log('');
            console.log('Usage:');
            console.log('  node startup.js start    - Start all services');
            console.log('  node startup.js status   - Show service status');
            console.log('  node startup.js config   - Show configuration');
            console.log('  node startup.js reset    - Reset to default config');
            console.log('');
            console.log('Configuration file:', CONFIG_FILE);
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = StartupManager; 