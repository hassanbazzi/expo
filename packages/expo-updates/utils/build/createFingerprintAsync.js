"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFingerprintAsync = void 0;
const config_1 = require("@expo/config");
const Fingerprint = __importStar(require("@expo/fingerprint"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const workflow_1 = require("./workflow");
async function createFingerprintAsync(platform, possibleProjectRoot, destinationDir) {
    // Remove projectRoot validation when we no longer support React Native <= 62
    let projectRoot;
    if (fs_1.default.existsSync(path_1.default.join(possibleProjectRoot, 'package.json'))) {
        projectRoot = possibleProjectRoot;
    }
    else if (fs_1.default.existsSync(path_1.default.join(possibleProjectRoot, '..', 'package.json'))) {
        projectRoot = path_1.default.resolve(possibleProjectRoot, '..');
    }
    else {
        throw new Error('Error loading app package. Ensure there is a package.json in your app.');
    }
    process.chdir(projectRoot);
    const { exp: config } = (0, config_1.getConfig)(projectRoot, {
        isPublicConfig: true,
        skipSDKVersionRequirement: true,
    });
    const runtimeVersion = config[platform]?.runtimeVersion ?? config.runtimeVersion;
    if (!runtimeVersion || typeof runtimeVersion === 'string') {
        return;
    }
    if (runtimeVersion.policy !== 'fingerprintExperimental') {
        // not a policy that needs fingerprinting
        return;
    }
    const workflow = await (0, workflow_1.resolveWorkflowAsync)(projectRoot, platform);
    let fingerprint;
    if (workflow === 'generic') {
        fingerprint = await Fingerprint.createFingerprintAsync(projectRoot, {
            platforms: [platform],
        });
    }
    else {
        // ignore everything in native directories to ensure fingerprint is the same
        // no matter whether project has been prebuilt
        fingerprint = await Fingerprint.createFingerprintAsync(projectRoot, {
            platforms: [platform],
            ignorePaths: ['/android/**/*', '/ios/**/*'],
        });
    }
    console.log(JSON.stringify(fingerprint.sources));
    fs_1.default.writeFileSync(path_1.default.join(destinationDir, 'fingerprint'), fingerprint.hash);
}
exports.createFingerprintAsync = createFingerprintAsync;
