#!/usr/bin/env node
import { run } from '../src/cli.mjs';
run().then((code) => { process.exitCode = code ?? 0; });
