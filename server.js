// Dotenv
import dotenv from 'dotenv';
dotenv.config();

// import express from 'express';
import autoload from './modules/autoload.js';

const autoloader = new autoload(process.env.AUTOLOAD_PATH ?? './channels');

setInterval(() => {
  autoloader.discover();
}, process.env.AUTOLOAD_FREQUENCY ?? 1000)