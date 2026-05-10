/**
 * k6 stress test — POST /compile
 *
 * Usage:
 *   k6 run -e BURST_RATE=1000 -e TEST_KEY=<secret> scripts/k6/stress-compile.js
 */

import http from 'k6/http';
import { check } from 'k6';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';

const BASE_URL = __ENV.BASE_URL || 'https://openlatex-api.blavogiez.fr';
//const BASE_URL = __ENV.BASE_URL || 'http://13.39.204.79';
const TEST_KEY = __ENV.TEST_KEY || '';

export const options = {
  thresholds: {
    checks: ['rate>0.95'],
  },
  scenarios: {
    stress_compile: {
      executor: 'shared-iterations',
      vus: 10,
      iterations: parseInt(__ENV.BURST_RATE || '10000', 10),
      maxDuration: '60m',
    },
  },
};

const DOCUMENTS = [
  String.raw`\documentclass{article}\begin{document}Hello, OpenLaTeX!\end{document}`,
  String.raw`\documentclass{article}\usepackage{amsmath}\begin{document}\[E = mc^2\]\end{document}`,
  String.raw`\documentclass{article}\begin{document}\section{Test}This is a stress test compilation.\end{document}`,
  String.raw`\documentclass{article}\begin{document}\begin{itemize}\item Alpha\item Beta\item Gamma\end{itemize}\end{document}`,
  String.raw`\documentclass{article}\usepackage{amsmath}\begin{document}\[\int_0^\infty e^{-x^2}\,dx = \frac{\sqrt{\pi}}{2}\]\end{document}`,
];

export default function () {
  const content = DOCUMENTS[Math.floor(Math.random() * DOCUMENTS.length)];

  const payload = JSON.stringify({
    files: [{ path: 'main.tex', content, file_type: 'tex' }],
    mainFile: 'main.tex',
  });

  const headers = { 'Content-Type': 'application/json' };
  // bypass la limite de compilation grace à un secret de dév
  if (TEST_KEY) headers['X-Test-Key'] = TEST_KEY;

  const res = http.post(`${BASE_URL}/compile`, payload, {
    headers,
    tags: { scenario: 'stress-compile' },
    timeout: '60s',
  });

  const ok = check(res, {
    'status 200 ou 500': (r) => r.status === 200 || r.status === 500,
  });

  console.log(`[compile] status=${res.status} duration=${res.timings.duration.toFixed(0)}ms ok=${ok}`);
}

export function handleSummary(data) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logPath = `logs/stress-compile-${timestamp}.log`;

  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    [logPath]: textSummary(data, { indent: ' ', enableColors: false }),
  };
}
